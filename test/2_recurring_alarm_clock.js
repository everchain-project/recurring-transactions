const DelegatedWalletBlueprint = artifacts.require("DelegatedWallet");
const ExampleTaskBlueprint = artifacts.require("ExampleTask");
const PaymentDelegateBlueprint = artifacts.require("PaymentDelegate");
const RequestFactory = artifacts.require("RequestFactory");
const RecurringAlarmClockBlueprint = artifacts.require("RecurringAlarmClock");
const TransactionRequestInterface = artifacts.require("TransactionRequestInterface");

var q = require('q');

contract('Recurring Alarm Clock Blueprint', function(accounts) {

    var PaymentDelegate;
    var DelegatedWallet;

    var ExampleTask;
    var AlarmClockFactory = accounts[1];
    var AlarmClock;
    var Alarm;

    var defaultAccount = accounts[0];
    var trustedScheduler = accounts[3];
    var priorityCaller = accounts[4];

    var safetyMultiplier = 2;
    var period = 30;
    var totalPayments = 2;
    var callGas = 800000;

    var alarmCaller;

    function deployPaymentDelegate(){
        var instance;

        return PaymentDelegateBlueprint.new()
        .then(_instance => {
            instance = _instance;
            return instance.initialize(defaultAccount)
            .then(tx => {
                return instance.addScheduler(trustedScheduler)
            })
            .then(tx => {
                return instance;
            })
        })
    }

    function deployDelegatedWallet(){
        var instance;
        return DelegatedWalletBlueprint.new()
        .then(_instance => {
            instance = _instance;
            return instance.initialize(defaultAccount)
            .then(tx => {
                return instance.addDelegate(PaymentDelegate.address)
            })
            .then(tx => {
                return sendEther({from: trustedScheduler, to: instance.address, value: ether(1)})
            })
            .then(tx => {
                return instance;
            })
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
        })
    }

    function waitForAlarmExecution(){
        var deferred = q.defer();

        alarmCaller = setInterval(() => {
            return Promise.all([
                updateBlockchainTimestamp(),
                Alarm.requestData(),
            ])
            .then(promises => {
                var currentTimestamp = promises[0];
                var options = promises[1];
                var startTimestamp = options[2][10];
                
                if(startTimestamp < currentTimestamp){
                    return Alarm.execute({
                        gas: 1000000
                    })
                    .then(tx => {
                        clearInterval(alarmCaller);
                        deferred.resolve()
                    })
                    .catch(err => {
                        clearInterval(alarmCaller);
                        deferred.reject(err);
                    })
                } else {
                    //console.log('        updating blockchain timestamp...   ' + currentTimestamp + '/' + startTimestamp)
                }
            })
            .catch(err => {
                clearInterval(alarmCaller);
                deferred.reject(err);
            })
        }, 1000);

        return deferred.promise;
    }
    
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

    function ether(toWei){
        return web3.toWei(toWei,'ether');
    }

    function minutes(toSeconds) {
        return Math.floor(60 * toSeconds);
    }

    function hours(toSeconds) {
        return Math.floor(60 * 60 * toSeconds);
    }

    function now() {
        return Math.floor(Date.now() / 1000);
    }

    function getCurrentAlarm(){
        return AlarmClock.executor()
        .then(alarmAddress => {
            if(alarmAddress == '0x0000000000000000000000000000000000000000')
                return Promise.resolve(alarmAddress)
            else
                return TransactionRequestInterface.at(alarmAddress)
        })
    }

    it("initialize the recurring alarm clock blueprint", () => {
        return q.all([
            RecurringAlarmClockBlueprint.new(),
            ExampleTaskBlueprint.new(),
            deployPaymentDelegate(),
        ])
        .then(instances => {
            AlarmClock = instances[0];
            ExampleTask = instances[1];
            PaymentDelegate = instances[2];
            return deployDelegatedWallet();
        })
        .then(instance => {
            DelegatedWallet = instance;
            return q.all([
                AlarmClock.initialize(
                    RequestFactory.address,
                    PaymentDelegate.address,
                    DelegatedWallet.address,
                    priorityCaller,
                    "",
                    [
                        safetyMultiplier,   // multiplier for alarm cost to account for network price changes
                        period,             // seconds between payments
                        2                   // totalPayments
                    ],
                    [
                        minutes(60),        // claimWindowSize
                        15,                 // freezePeriod
                        30,                 // reservedWindowSize
                        2,                  // 2 = Use timestamp based scheduling instead of blocks
                        hours(24),          // The size of the execution window
                        now() + period,     // The start of the execution window
                        callGas,            // The amount of extra gas to be sent with the transaction
                        0,                  // The amount of ether to be sent
                        0,                  // The minimum gas price for the alarm when called
                        0                   // The required deposit by the claimer
                    ],
                    {from: AlarmClockFactory}
                ),
                ExampleTask.initialize(AlarmClock.address)
            ])
        })
        .then(promises => {
            return PaymentDelegate.schedule(AlarmClock.address, {from: trustedScheduler})
        })
    });

    it("check correctness of alarm execution", () => {
        console.log("    ? check correctness of alarm execution")
        return AlarmClock.start(ExampleTask.address, {from: AlarmClockFactory})
        .then(tx => getCurrentAlarm())
        .then(alarm => {
            Alarm = alarm;
            console.log("    0/2 alarms executed...   current alarm: " + Alarm.address)
            return waitForAlarmExecution()
        })
        .then(() => getCurrentAlarm())
        .then(alarm => {
            Alarm = alarm;
            console.log("    1/2 alarms executed...   current alarm: " + Alarm.address)
            return waitForAlarmExecution()
        })
        .then(() => getCurrentAlarm())
        .then(alarmAddress => {
            console.log("    2/2 alarms executed...   current alarm: " + alarmAddress)
            
            var deferred = q.defer();

            ExampleTask.allEvents({fromBlock: 0, toBlock: 'latest'})
            .get((err, events) => {
                deferred.resolve(events);
            })

            return deferred.promise;
        })
        .then(events => {
            assert(events.length == totalPayments, "there should be " + totalPayments + " events")
        })
        .catch(err => {
            console.log(err);
        })
    });

});