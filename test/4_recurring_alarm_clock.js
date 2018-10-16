const DelegatedWalletContract = artifacts.require("DelegatedWallet");
const DelegatedWalletFactory = artifacts.require("DelegatedWalletFactory");
const PaymentDelegateBlueprint = artifacts.require("PaymentDelegate");
const RecurringAlarmClock = artifacts.require("RecurringAlarmClock");
const SimpleTaskContract = artifacts.require("SimpleTask");
const RequestFactory = artifacts.require("RequestFactory");
const TransactionRequestInterface = artifacts.require("TransactionRequestInterface");

var q = require('q');

contract('Recurring Alarm Clock Blueprint', function(accounts) {

    var DelegatedWallet;
    var PaymentDelegate;
    var WalletFactory;
    var AlarmClock;
    var SimpleTask;
    var Alarm;
    
    var defaultCaller = accounts[0];
    var defaultDelegate = accounts[0];
    var owner = accounts[1];
    var trustedScheduler = accounts[5];
    var recipient = accounts[6];
    var priorityCaller = accounts[9];

    var totalPayments = 2;

    function sendEther(options){
        var deferred = q.defer();
        web3.eth.sendTransaction(options, function(err, txHash){
            //console.log(err, txHash);
            if(err)
                deferred.reject(err);
            else {
                web3.eth.getTransactionReceipt(txHash, function(err, tx){
                    //console.log(err, tx);
                    if(err)
                        deferred.reject(tx);
                    else
                        deferred.resolve(tx);
                })
            }
        })
        return deferred.promise;
    }

    function setupPrerequisites(){
        return q.all([
            DelegatedWalletFactory.deployed(),
            PaymentDelegateBlueprint.new({from: owner}),
        ])
        .then(instance => {
            WalletFactory = instance[0];
            PaymentDelegate = instance[1];
            return q.all([
                WalletFactory.createWallet({from: owner}),
                WalletFactory.createWallet({from: recipient}),
                PaymentDelegate.initialize(owner, {from: defaultCaller}),
            ])
        })
        .then(txs => {
            var walletAddress = txs[0].logs[0].args.wallet;
            return q.all([
                DelegatedWalletContract.at(walletAddress),
                PaymentDelegate.owner(),
            ])
        })
        .then(promises => {
            DelegatedWallet = promises[0];
            assert(owner == promises[1]);
            return q.all([
                DelegatedWallet.addDelegate(defaultDelegate, {from: owner}),
                DelegatedWallet.addDelegate(PaymentDelegate.address, {from: owner}),
                PaymentDelegate.addScheduler(trustedScheduler, {from: owner}),
                sendEther({from: trustedScheduler, to: DelegatedWallet.address, value: ether(5), gasPrice: 0})
            ])
        })
    }

    function updateBlockchainTimestamp(){
        return sendEther({
            from: accounts[8],
            to: accounts[9],
            value: 1
        })
        .then(tx => {
            //console.log(tx)
            var deferred = q.defer();
            web3.eth.getBlock(tx.blockNumber, function(err, blockData){
                //console.log(err, blockData);
                if(err)
                    deferred.reject(err);
                else
                    deferred.resolve(blockData)
            })
            return deferred.promise;
        })
        .then(blockData => {
            //console.log(blockData)
            return blockData.timestamp;
        })
        .catch(err => {
            console.log(err)
            clearInterval(alarmCaller);
        })
    }

    var waitForAlarmExecution = q.defer();

    var alarmCaller = setInterval(() => {
        updateBlockchainTimestamp()
        .then(currentTimestamp => {
            if(Alarm){
                return Alarm.requestData()
                .then(options => {
                    var startTimestamp = options[2][10];
                    if(startTimestamp < currentTimestamp){
                        return Alarm.execute({from: defaultCaller})
                        .then(tx => {
                            //console.log('        alarm executed...   ' + currentTimestamp + '/' + startTimestamp + '   gas used: ' + tx.logs[0].args.measuredGasConsumption)
                            waitForAlarmExecution.resolve(tx)
                        })
                        .catch(err => {
                            waitForAlarmExecution.reject(err);
                        })
                    } else {
                        //console.log('        updating blockchain timestamp...   ' + currentTimestamp + '/' + startTimestamp)
                    }
                })
            }
        })
        .catch(err => {
            waitForAlarmExecution.reject(err);
        })
    }, 30000);

    it("initialize the recurring alarm clock blueprint", () => {
        return setupPrerequisites()
        .then(() => {
            return q.all([
                RequestFactory.deployed(),
                RecurringAlarmClock.deployed(),
                SimpleTaskContract.deployed(),
            ]);
        })
        .then(instances => {
            EthereumAlarmClock = instances[0];
            AlarmClock = instances[1];
            SimpleTask = instances[2];

            var safetyMultiplier = 3;
            var period = minutes(5);
            
            var startTimestamp = now() + period;
            var gas = 1000000;
            
            return AlarmClock.initialize(
                EthereumAlarmClock.address,
                PaymentDelegate.address,
                DelegatedWallet.address,
                priorityCaller,
                "",
                [
                    safetyMultiplier,
                    period,
                    totalPayments
                ],
                [
                    minutes(60),        // claimWindowSize
                    minutes(3),         // freezePeriod
                    minutes(5),         // reservedWindowSize
                    2,                  // 2 = Use timestamp based scheduling instead of blocks
                    hours(24),          // The size of the execution window
                    startTimestamp,     // The start of the execution window
                    gas,                // The amount of gas to be sent with the transaction
                    0,                  // The amount of ether to be sent
                    0,                  // The minimum gas price for the alarm when called
                    0                   // The required deposit by the claimer
                ],
                {from: defaultCaller}
            );
        }).then(tx => {
            return SimpleTask.initialize(owner, AlarmClock.address, {from: defaultCaller})
        })
        .then(tx => {
            return PaymentDelegate.schedule(AlarmClock.address, {from: trustedScheduler})
        })
    });

    it("check correctness of alarm execution", () => {
        console.log("    ? check correctness of alarm execution")
        return AlarmClock.start(SimpleTask.address, {from: defaultCaller, gasPrice: web3.toWei(10, 'gwei')})
        .then(tx => {
            return AlarmClock.alarm()
        })
        .then(alarmAddress => {
            return TransactionRequestInterface.at(alarmAddress);
        })
        .then(instance => {
            Alarm = instance;
            console.log("    0/2 alarms executed...   current alarm: " + Alarm.address)
            return waitForAlarmExecution.promise;
        })
        .then(tx => {
            //console.log(tx.receipt.blockNumber)
            return AlarmClock.alarm()
        })
        .then(alarmAddress => {
            return TransactionRequestInterface.at(alarmAddress);
        })
        .then(alarm => {
            Alarm = alarm;
            console.log("    1/2 alarms executed...   current alarm: " + Alarm.address)
            waitForAlarmExecution = q.defer();
            return waitForAlarmExecution.promise;
        })
        .then(tx => {
            //console.log(tx.receipt.blockNumber)
            return AlarmClock.alarm()
        })
        .then(alarmAddress => {
            console.log("    2/2 alarms executed...   current alarm: " + alarmAddress)
            clearInterval(alarmCaller);
            
            var waitForEvents = q.defer();
            SimpleTask.allEvents({fromBlock: 0, toBlock: 'latest'})
            .get((err, events) => {
                waitForEvents.resolve(events);
            })

            return waitForEvents.promise;
        })
        .then(events => {
            assert(events.length == totalPayments, "there should be " + totalPayments + " events")
        })
        .catch(err => {
            console.log(err);
            clearInterval(alarmCaller);
        })
    });

    function minutes(toSeconds) {
        return Math.floor(60 * toSeconds);
    }

    function hours(toSeconds) {
        return Math.floor(60 * 60 * toSeconds);
    }

    function now() {
        return Math.floor(Date.now() / 1000);
    }

    function ether(toWei){
        return web3.toWei(toWei,'ether');
    }

});