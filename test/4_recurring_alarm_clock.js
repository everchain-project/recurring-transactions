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
    var TrustedSchedulers;
    var Wallet;
    var Payment;
    var AlarmClock;
    var EthereumAlarmClock;
    var Alarm;

    var initialWalletBalance;
    var initialRecipientBalance;
    var initialGasCost = 0;

    var owner = accounts[0];
    var recipient = accounts[5];
    var priorityCaller = accounts[9];

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
        .then(instances => {
            PaymentDelegate = instances[0];
            EthereumAlarmClock = instances[1];
            AlarmClock = instances[2];
            
            return setupDelegatedWallet();
        })
        .then(instance => {
            Wallet = instance;
            return getBalance(recipient);
        })
        .then(recipientBalance => web3.eth.sendTransaction({
            from: recipient,
            to: accounts[6],
            value: recipientBalance,
            gasPrice: 0
        }))
        .then(tx => q.all([
            getBalance(Wallet.address),
            getBalance(recipient),
        ]))
        .then(balances => {
            initialWalletBalance = balances[0];
            initialRecipientBalance = balances[1];

            var safetyMultiplier = ether(3);
            var gas = 1000000;
            var startTimestamp = now() + period;

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
        .then(tx => {
            initialGasCost += tx.receipt.gasUsed;
            return RecurringPayment.deployed();
        })
        .then(instance => {
            Payment = instance;
            return Payment.initialize(
                AlarmClock.address,
                PaymentDelegate.address,
                Wallet.address,
                ETHER,
                recipient,
                ether(1),
                {from: owner}
            );
        })
        .then(tx => {
            initialGasCost += tx.receipt.gasUsed;
            return q.all([
                PaymentDelegate.schedule(Payment.address, Wallet.address, {from: owner}),
                PaymentDelegate.schedule(AlarmClock.address, Wallet.address, {from: owner}),
            ]);
        })
        .then(txs => {
            initialGasCost += txs[0].receipt.gasUsed;
            initialGasCost += txs[1].receipt.gasUsed;
            return AlarmClock.start(Payment.address, {from: owner, gasPrice: web3.toWei(10, 'gwei')});
        })
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

    /*
    it("check execution of the alarm clock", () => {
        console.log("    ? check execution of the alarm clock");
        var lastTx;

        console.log("");
        console.log("             wallet balance: " + web3.fromWei(initialWalletBalance, 'ether') + " ether");
        console.log("          recipient balance: " + web3.fromWei(initialRecipientBalance, 'ether') + " ether");

        return getCurrentAlarm()
        .then(alarm => {
            Alarm = alarm;
            return q.all([
                getBalance(Wallet.address),
                getBalance(Alarm.address),
                getBalance(recipient),
            ]);
        })
        .then(balances => {
            var walletBalance = balances[0];
            var alarmBalance = balances[1];
            var recipientBalance = balances[2];
            console.log("");
            console.log("      1/5 alarms scheduled - waiting " + periodInMinutes + " minutes for alarm " + Alarm.address);
            console.log("");
            console.log("                   gas used: " + initialGasCost);
            console.log("              alarm balance: " + web3.fromWei(alarmBalance, 'ether') + " ether");
            console.log("             wallet balance: " + web3.fromWei(walletBalance, 'ether') + " ether");
            console.log("          recipient balance: " + web3.fromWei(recipientBalance, 'ether') + " ether");
            return q.delay(untilAlarmIsCallable);
        })
        .then(() => updateBlockchainTimestamp())
        .then(tx => Alarm.execute({from: owner, gas: 1500000, gasPrice: web3.toWei(10, 'gwei')}))
        .then(tx => {
            lastTx = tx;
            return getCurrentAlarm();
        })
        .then(alarm => {
            Alarm = alarm;
            return q.all([
                getBalance(Wallet.address),
                getBalance(Alarm.address),
                getBalance(recipient),
            ]);
        })
        .then(balances => {
            var walletBalance = balances[0];
            var alarmBalance = balances[1];
            var recipientBalance = balances[2];
            console.log("");
            console.log("      2/5 alarms scheduled - waiting " + periodInMinutes + " minutes for alarm " + Alarm.address);
            console.log("");
            console.log("                   gas used: " + lastTx.receipt.gasUsed);
            console.log("              alarm balance: " + web3.fromWei(alarmBalance, 'ether') + " ether");
            console.log("             wallet balance: " + web3.fromWei(walletBalance, 'ether') + " ether");
            console.log("          recipient balance: " + web3.fromWei(recipientBalance, 'ether') + " ether");
            return q.delay(untilAlarmIsCallable);
        })
        .then(() => updateBlockchainTimestamp())
        .then(tx => Alarm.execute({from: owner, gas: 1500000, gasPrice: web3.toWei(10, 'gwei')}))
        .then(tx => {
            lastTx = tx;
            return getCurrentAlarm();
        })
        .then(alarm => {
            Alarm = alarm;
            return q.all([
                getBalance(Wallet.address),
                getBalance(Alarm.address),
                getBalance(recipient),
            ]);
        })
        .then(balances => {
            var walletBalance = balances[0];
            var alarmBalance = balances[1];
            var recipientBalance = balances[2];
            console.log("");
            console.log("      3/5 alarms scheduled - waiting " + periodInMinutes + " minutes for alarm " + Alarm.address);
            console.log("");
            console.log("                   gas used: " + lastTx.receipt.gasUsed);
            console.log("              alarm balance: " + web3.fromWei(alarmBalance, 'ether') + " ether");
            console.log("             wallet balance: " + web3.fromWei(walletBalance, 'ether') + " ether");
            console.log("          recipient balance: " + web3.fromWei(recipientBalance, 'ether') + " ether");
            return q.delay(untilAlarmIsCallable);
        })
        .then(() => updateBlockchainTimestamp())
        .then(tx => Alarm.execute({from: owner, gas: 1500000, gasPrice: web3.toWei(10, 'gwei')}))
        .then(tx => {
            lastTx = tx;
            return getCurrentAlarm();
        })
        .then(alarm => {
            Alarm = alarm;
            return q.all([
                getBalance(Wallet.address),
                getBalance(Alarm.address),
                getBalance(recipient),
            ]);
        })
        .then(balances => {
            var walletBalance = balances[0];
            var alarmBalance = balances[1];
            var recipientBalance = balances[2];
            console.log("");
            console.log("      4/5 alarms scheduled - waiting " + periodInMinutes + " minutes for alarm " + Alarm.address);
            console.log("");
            console.log("                   gas used: " + lastTx.receipt.gasUsed);
            console.log("              alarm balance: " + web3.fromWei(alarmBalance, 'ether') + " ether");
            console.log("             wallet balance: " + web3.fromWei(walletBalance, 'ether') + " ether");
            console.log("          recipient balance: " + web3.fromWei(recipientBalance, 'ether') + " ether");
            console.log("");
            return q.delay(untilAlarmIsCallable);
        })
        .then(() => updateBlockchainTimestamp())
        .then(tx => Alarm.execute({from: owner, gas: 1500000, gasPrice: web3.toWei(10, 'gwei')}))
        .then(tx => {
            lastTx = tx;
            return getCurrentAlarm();
        })
        .then(alarm => {
            Alarm = alarm;
            return q.all([
                getBalance(Wallet.address),
                getBalance(Alarm.address),
                getBalance(recipient),
            ]);
        })
        .then(balances => {
            var walletBalance = balances[0];
            var alarmBalance = balances[1];
            var recipientBalance = balances[2];
            console.log("");
            console.log("      5/5 alarms scheduled - waiting " + periodInMinutes + " minutes for alarm " + Alarm.address);
            console.log("");
            console.log("                   gas used: " + lastTx.receipt.gasUsed);
            console.log("              alarm balance: " + web3.fromWei(alarmBalance, 'ether') + " ether");
            console.log("             wallet balance: " + web3.fromWei(walletBalance, 'ether') + " ether");
            console.log("          recipient balance: " + web3.fromWei(recipientBalance, 'ether') + " ether");
            console.log("");
            return q.delay(untilAlarmIsCallable);
        })
        .then(() => updateBlockchainTimestamp())
        .then(tx => Alarm.execute({from: owner, gas: 1500000, gasPrice: web3.toWei(10, 'gwei')}))
        .then(tx => {
            lastTx = tx;
            return q.all([
                AlarmClock.alarm(),
                getBalance(Wallet.address),
                getBalance(recipient),
            ])
        })
        .then(promises => {
            var alarmAddress = promises[0];
            var walletBalance = promises[1];
            var recipientBalance = promises[2];
            console.log("");
            console.log("      -/- all alarms called - alarm has been set to " + alarmAddress);
            console.log("");
            console.log("                   gas used: " + lastTx.receipt.gasUsed);
            console.log("             wallet balance: " + web3.fromWei(walletBalance, 'ether') + " ether (9.95 ether expected)");
            console.log("          recipient balance: " + web3.fromWei(recipientBalance, 'ether') + " ether (5 ether expected)");
            console.log("");
            assert(walletBalance == ether(9.95), "wallet balance should equal 9.95 ether");
            assert(recipientBalance == ether(5), "recipient balance should equal 5 ether");
        })
    })
    */

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
            from: accounts[7],
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
            TrustedSchedulers = instance[2];

            return TrustedSchedulers.initialize(owner, [owner], {from: owner});
        })
        .then(tx => {
            return PaymentDelegate.initialize(ListFactory.address, TrustedSchedulers.address, {from: owner}); 
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