const AddressList = artifacts.require("AddressList");
const DelegatedWallet = artifacts.require("DelegatedWallet");
const FuturePaymentDelegate = artifacts.require("FuturePaymentDelegate");
const EverchainWalletManager = artifacts.require("EverchainWalletManager");
const RecurringAlarmClock = artifacts.require("RecurringAlarmClock");
const RecurringPayment = artifacts.require("RecurringPayment");
const RecurringPaymentScheduler = artifacts.require("RecurringPaymentScheduler");
const TransactionRequestInterface = artifacts.require("TransactionRequestInterface");

var q = require('q');

contract('Recurring Payment Scheduler', function(accounts) {

    const ETHER = '0x0000000000000000000000000000000000000000';
    
    var PaymentScheduler;
    var Schedulers;
    var WalletManager;
    var Wallet;
    var Delegates;
    var Payment;
    var AlarmClock;
    var Alarm;

    var periodInMinutes = 5;
    var period = minutes(periodInMinutes);
    var startTimestamp = now() + period;
    var recipient = accounts[5];
    var totalPayments = 10;
    var currentInterval = 0;

    var lastTx;

    it("schedule an alarm using the recurring payment scheduler", () => {
        return q.all([
            RecurringPaymentScheduler.deployed(),
            EverchainWalletManager.deployed(),
        ])
        .then(instances => {
            PaymentScheduler = instances[0];
            WalletManager = instances[1];
            return WalletManager.createWallet();
        })
        .then(tx => {
            return DelegatedWallet.at(tx.logs[0].args.walletAddress);
        })
        .then(instance => {
            Wallet = instance;

            return getBalance(recipient);
        })
        .then(recipientBalance => {
            return web3.eth.sendTransaction({
                from: recipient,
                to: accounts[6],
                value: recipientBalance,
                gasPrice: 0
            });
        })
        .then(tx => {
            return web3.eth.sendTransaction({from: accounts[6], to: Wallet.address, value: ether(15)});
        })
        .then(tx => {
            return q.all([
                getBalance(recipient),
                getBalance(Wallet.address)
            ]);
        })
        .then(balances => {
            var recipientBalance = balances[0];
            var walletBalance = balances[1];

            console.log("    ? check execution of the recurring payment scheduler");
            console.log("");
            console.log("             wallet balance: " + web3.fromWei(walletBalance, 'ether') + " ether");
            console.log("          recipient balance: " + web3.fromWei(recipientBalance, 'ether') + " ether");
        })
        .then(tx => {
            return Wallet.delegates();
        })
        .then(delegateListAddress => {
            return AddressList.at(delegateListAddress);
        })
        .then(instance => {
            Delegates = instance;
            return Delegates.index(1);
        })
        .then(paymentDelegateAddress => {
            return FuturePaymentDelegate.at(paymentDelegateAddress);
        })
        .then(instance => {
            PaymentDelegate = instance;
            return PaymentDelegate.trustedSchedulers()
        })
        .then(schedulersList => {
            return AddressList.at(schedulersList);
        })
        .then(instance => {
            Schedulers = instance;
            return Schedulers.index(0);
        })
        .then(scheduler => {
            assert(scheduler == PaymentScheduler.address, "the payment scheduler was not properly set as a trusted scheduler");

            var delegate = PaymentDelegate.address;
            var wallet = Wallet.address;
            var token = ETHER;
            var paymentAmount = ether(1);
            var gas = 1000000;

            // console.log(delegate);
            // console.log(wallet);
            // console.log(token);
            // console.log(recipient);
            // console.log(paymentAmount);
            // console.log(startTimestamp);
            // console.log(totalPayments);
            // console.log(period);
            // console.log(gas);

            return PaymentScheduler.createRecurringPayment(
                delegate,
                wallet,
                token,
                recipient,
                paymentAmount,
                startTimestamp,
                totalPayments,
                period,
                gas,
                {gasPrice: web3.toWei(10, 'gwei')}
            );
        })
        .then(tx => {
            lastTx = tx;
            return RecurringPayment.at(tx.logs[0].args.recurringPayment);
        })
        .then(instance => {
            Payment = instance;
            return Payment.getOptions();
        })
        .then(paymentOptions => {
            var addresses = paymentOptions[0];
            var paymentAmount = paymentOptions[1];
            alarmClock = addresses[0];
            delegate = addresses[1];
            wallet = addresses[2];
            token = addresses[3];
            _recipient = addresses[4];

            assert(paymentAmount == ether(1), "payment amount not properly set to one ether");
            assert(delegate == PaymentDelegate.address, "payment delegate was not set correctly");
            assert(wallet == Wallet.address, "delegated wallet was not set correctly");
            assert(token == ETHER, "payment token was not set correctly");
            assert(_recipient == recipient, "payment token was not set correctly");

            return RecurringAlarmClock.at(alarmClock);
        })
        .then(instance => {
            AlarmClock = instance;
            return getCurrentAlarm();
        })
        .then(alarm => {
            Alarm = alarm;
        })
        .then(handleNextAlarm)
        .then(handleNextAlarm)
        .then(handleNextAlarm)
        .then(handleNextAlarm)
        .then(handleNextAlarm)
        .then(handleNextAlarm)
        .then(handleNextAlarm)
        .then(handleNextAlarm)
        .then(handleNextAlarm)
        .then(handleNextAlarm)
        
    });

    function getBalances(){
        
    }
    function handleNextAlarm(){
        currentInterval++;

        var promises = [
            getBalance(Wallet.address),
            getBalance(recipient)
        ];

        if(currentInterval != totalPayments)
            promises.push(getBalance(Alarm.address));

        return q.all(promises)
        .then(balances => {
            var walletBalance = balances[0];
            var recipientBalance = balances[1];
            var alarmBalance = balances[2];
            
            if(currentInterval < totalPayments){
                console.log("");
                console.log("      " + currentInterval + "/" + totalPayments + " alarms scheduled");
                console.log("");
                console.log("                   gas used: " + lastTx.receipt.gasUsed);
                console.log("              alarm balance: " + web3.fromWei(alarmBalance, 'ether') + " ether");
                console.log("             wallet balance: " + web3.fromWei(walletBalance, 'ether') + " ether");
                console.log("          recipient balance: " + web3.fromWei(recipientBalance, 'ether') + " ether");
                console.log("");
                console.log("          waiting " + periodInMinutes + " minutes for alarm " + Alarm.address)
                console.log("");

                assert(alarmBalance == ether(0.01), "alarm was not properly funded with 0.01 ether");

                var untilAlarmIsReady = (minutes(periodInMinutes) + 15)*1000; // 5m 15s in milliseconds
                return q.delay(untilAlarmIsReady)
                .then(() => updateBlockchainTimestamp())
                .then(() => Alarm.execute({from: accounts[0], gas: 1500000, gasPrice: web3.toWei(10, 'gwei')}))
                .then(tx => {
                    lastTx = tx;
                    return getCurrentAlarm();
                })
                .then(alarm => {
                    Alarm = alarm;
                    return;
                })
            } else {
                console.log("");
                console.log("                   gas used: " + lastTx.receipt.gasUsed);
                console.log("             wallet balance: " + web3.fromWei(walletBalance, 'ether') + " ether");
                console.log("          recipient balance: " + web3.fromWei(recipientBalance, 'ether') + " ether");
                //assert(walletBalance == ether(9.95), "wallet balance should equal 9.95 ether");
                //assert(recipientBalance == ether(5), "recipient balance should equal 5 ether");
            }
        })
        
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

});