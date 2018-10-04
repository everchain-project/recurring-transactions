const AddressList = artifacts.require("AddressList");
const AddressListFactory = artifacts.require("AddressListFactory");
const DelegatedWallet = artifacts.require("DelegatedWallet");
const DelegatedWalletFactory = artifacts.require("DelegatedWalletFactory");
const FuturePaymentDelegate = artifacts.require("FuturePaymentDelegate");
const RecurringAlarmClock = artifacts.require("RecurringAlarmClock");
const RecurringPayment = artifacts.require("RecurringPayment");
const RequestFactory = artifacts.require("RequestFactory");
const TransactionRequestInterface = artifacts.require("TransactionRequestInterface");

var q = require('q');

contract('Recurring Alarm Clock Blueprint', function(accounts) {

    const ETHER = '0x0';
    
    var PaymentDelegate;
    var ListFactory;
    var TrustedFactories;
    var Wallet;
    var Payment;
    var AlarmClock;
    var EthereumAlarmClock;
    var Alarm;

    var owner = accounts[0];
    var recipient = accounts[5];
    var priorityCaller = accounts[9];

    var startTimestamp;
    var periodInMinutes = 5;
    var period = minutes(periodInMinutes);
    var totalPayments = 5;
    var untilAlarmIsCallable = (period + 15) * 1000;

    it("initialize the recurring alarm clock blueprint", () => {
        return q.all([
            setupPaymentDelegate(),
            RequestFactory.deployed(),
            RecurringAlarmClock.deployed(),
        ])
        .then(instance => {
            PaymentDelegate = instance[0];
            EthereumAlarmClock = instance[1];
            AlarmClock = instance[2];
            
            return setupDelegatedWallet();
        })
        .then(instance => {
            Wallet = instance;

            var safetyMultiplier = ether(3);
            
            var gas = 2000000;
            
            startTimestamp = now() + period;

            return AlarmClock.initialize(
                EthereumAlarmClock.address,
                PaymentDelegate.address,
                Wallet.address,
                priorityCaller,
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
                {from: owner}
            );
        })
        .then(tx => RecurringPayment.deployed())
        .then(instance => {
            Payment = instance;
            return Payment.initialize(
                AlarmClock.address,
                PaymentDelegate.address,
                Wallet.address,
                ETHER,
                recipient,
                ether(.5),
                {from: owner}
            );
        })
        .then(tx => {
            return q.all([
                PaymentDelegate.schedule(Payment.address, Wallet.address, {from: owner}),
                PaymentDelegate.schedule(AlarmClock.address, Wallet.address, {from: owner}),
            ]);
        })
        .then(tx => AlarmClock.start(Payment.address, {from: owner}))
    });

    it("attempt and fail to execute the alarm early", () => {
        return getCurrentAlarm()
        .then(instance => {
            Alarm = instance;
            return Alarm.execute({from: owner, gasPrice: web3.toWei(10, 'gwei')});
        })
        .then(tx => {
            var deferred = q.defer();
            Alarm.Aborted()
            .get(function(err,events){
                if(err)
                    deferred.reject(err);
                else
                    deferred.resolve(events);
            });
            return deferred.promise
        })
        .then(events => {
            var abortReason = events[0].args.reason;
            assert(abortReason == 2, "The abort reason should equal 2 (too early to execute alarm)")
        })
    });

    it("check execution of the alarm clock", () => {
        var executeTx;
        console.log("    ? check execution of the alarm clock");
        
        return getCurrentAlarm()
        .then(alarm => {
            Alarm = alarm;
            console.log("      0/5 alarms called. waiting " + periodInMinutes + " minutes for alarm " + Alarm.address);
            return q.delay(untilAlarmIsCallable);
        })
        .then(() => updateBlockchainTimestamp())
        .then(tx => Alarm.execute({from: owner, gas: 3000000, gasPrice: web3.toWei(10, 'gwei')}))
        .then(tx => getCurrentAlarm())
        .then(alarm => {
            Alarm = alarm;
            console.log("      1/5 alarms called. waiting " + periodInMinutes + " minutes for alarm " + Alarm.address);
            return q.delay(untilAlarmIsCallable);
        })
        .then(() => updateBlockchainTimestamp())
        .then(tx => {
            return Alarm.execute({from: owner, gas: 3000000, gasPrice: web3.toWei(10, 'gwei')});
        })
        .then(tx => getCurrentAlarm())
        .then(alarm => {
            Alarm = alarm;
            console.log("      2/5 alarms called. waiting " + periodInMinutes + " minutes for alarm " + Alarm.address);
            return q.delay(untilAlarmIsCallable);
        })
        .then(() => updateBlockchainTimestamp())
        .then(tx => {
            return Alarm.execute({from: owner, gas: 3000000, gasPrice: web3.toWei(10, 'gwei')});
        })
        .then(tx => getCurrentAlarm())
        .then(alarm => {
            Alarm = alarm;
            console.log("      3/5 alarms called. waiting " + periodInMinutes + " minutes for alarm " + Alarm.address);
            return q.delay(untilAlarmIsCallable);
        })
        .then(() => updateBlockchainTimestamp())
        .then(tx => {
            return Alarm.execute({from: owner, gas: 3000000, gasPrice: web3.toWei(10, 'gwei')});
        })
        .then(tx => getCurrentAlarm())
        .then(alarm => {
            Alarm = alarm;
            console.log("      4/5 alarms called. waiting " + periodInMinutes + " minutes for alarm " + Alarm.address);
            return q.delay(untilAlarmIsCallable);
        })
        .then(() => updateBlockchainTimestamp())
        .then(tx => {
            return Alarm.execute({from: owner, gas: 3000000, gasPrice: web3.toWei(10, 'gwei')});
        })
        .then(tx => AlarmClock.alarm())
        .then(alarmAddress => {
            console.log("      5/5 alarms called. alarm has been reset to " + alarmAddress);
        })
    })

    function minutes(toSeconds) {
        return Math.floor(60 * toSeconds);
    }

    function hours(toSeconds) {
        return Math.floor(60 * 60 * toSeconds);
    }

    function now() {
        return Math.floor(Date.now() / 1000);
    }

    function updateBlockchainTimestamp(){
        return web3.eth.sendTransaction({
            from: accounts[5],
            to: accounts[6],
            value: 1
        })
    }

    function getCurrentAlarm(){
        return AlarmClock.alarm().then(alarmAddress => TransactionRequestInterface.at(alarmAddress));
    }

    function getBalance(address){
        var deferred = q.defer();

        web3.eth.getBalance(address, function(err, etherBalance){
            //console.log(err, etherBalance);
            if(err)
                deferred.reject(err);
            else
                deferred.resolve(etherBalance);
        });

        return deferred.promise;
    }

    function ether(toWei){
        return web3.toWei(toWei,'ether');
    }

    function setupPaymentDelegate(){
        return q.all([
            FuturePaymentDelegate.new({from: owner}),
            AddressListFactory.deployed(),
            AddressList.new({from: owner}),
        ])
        .then(instance => {
            PaymentDelegate = instance[0];
            ListFactory = instance[1];
            TrustedFactories = instance[2];

            return TrustedFactories.initialize(owner, [owner], {from: owner});
        })
        .then(tx => {
            return PaymentDelegate.initialize(ListFactory.address, TrustedFactories.address, {from: owner}); 
        })
        .then(tx => {
            return PaymentDelegate;
        })
    }

    function setupDelegatedWallet(){
        var walletAddress;

        return DelegatedWalletFactory.deployed()
        .then(WalletFactory => WalletFactory.createWallet(owner, [owner, PaymentDelegate.address], {from: owner}))
        .then(tx => {
            walletAddress = tx.logs[0].args.walletAddress;
            return q.all([
                web3.eth.sendTransaction({from: accounts[6], to: walletAddress, value: ether(5)}),
                web3.eth.sendTransaction({from: accounts[7], to: walletAddress, value: ether(5)}),
                web3.eth.sendTransaction({from: accounts[8], to: walletAddress, value: ether(5)}),
            ]);
        })
        .then(tx => DelegatedWallet.at(walletAddress))
    }
    
});