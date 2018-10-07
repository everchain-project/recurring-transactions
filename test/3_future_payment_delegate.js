const AddressList = artifacts.require("AddressList");
const AddressListFactory = artifacts.require("AddressListFactory");
const DelegatedWallet = artifacts.require("DelegatedWallet");
const DelegatedWalletFactory = artifacts.require("DelegatedWalletFactory");
const FuturePaymentDelegate = artifacts.require("FuturePaymentDelegate");
const RecurringPayment = artifacts.require("RecurringPayment");
const RecurringPaymentScheduler = artifacts.require("RecurringPaymentScheduler");
const RecurringAlarmClock = artifacts.require("RecurringAlarmClock");
const TransactionRequestInterface = artifacts.require("TransactionRequestInterface");

var q = require('q');

contract('Future Payment Delegate Blueprint', function(accounts) {
    const ETHER = '0x0';
    const oneEther  = web3.toWei(1, 'ether');
    const halfEther = web3.toWei(0.5, 'ether');
    const quarterEther = web3.toWei(0.25, 'ether');

    var recipient = accounts[7];

    var PaymentDelegate;
    var ListFactory;
    var WalletFactory;
    var TrustedSchedulers;
    var PaymentScheduler;
    var AlarmClock;
    var Delegates;

    var wallet;
    var payment;

    function minutes(toSeconds) {
        return Math.floor(60 * toSeconds);
    }

    function now() {
        return Math.floor(Date.now() / 1000);
    }
    
    it("initialize the future payment delegate", () => {
        return q.all([
            FuturePaymentDelegate.new({from: accounts[0]}),
            RecurringPaymentScheduler.deployed(),
            AddressListFactory.deployed(),
        ])
        .then(instances => {
            PaymentDelegate = instances[0];
            PaymentScheduler = instances[1];
            return AddressList.new({from: accounts[0]});
        })
        .then(instance => {
            TrustedSchedulers = instance;
            return TrustedSchedulers.initialize(accounts[0], [PaymentScheduler.address], {from: accounts[0]});
        })
        .then(tx => {
            return PaymentDelegate.initialize(AddressListFactory.address, TrustedSchedulers.address, {from: accounts[0]});
        })
    });

    it("check correctness of future payment delegate", () => {
        return PaymentDelegate.trustedSchedulers()
        .then(trustedFactoryAddress => {
            assert(trustedFactoryAddress == TrustedSchedulers.address, "the trusted factories list was not set correctly");
            return AddressList.at(trustedFactoryAddress);
        })
        .then(trustedSchedulers => trustedSchedulers.get())
        .then(factoryList => {
            assert(
                factoryList[0] == PaymentScheduler.address
                && factoryList.length == 1, 
                "the recurring payment factory should be the only trusted factory"
            );
            return PaymentDelegate.listFactory();
        })
        .then(factoryAddress => {
            assert(factoryAddress == AddressListFactory.address, "address list factory not correctly set");
        })
    });

    it("have a delegate schedule a payment", () => {
        return DelegatedWalletFactory.deployed()
        .then(instance => {
            WalletFactory = instance;
            return WalletFactory.createWallet(
                accounts[0],
                [accounts[1], PaymentDelegate.address]
            );
        })
        .then(tx => DelegatedWallet.at(tx.logs[0].args.walletAddress))
        .then(instance => {
            wallet = instance;
            return web3.eth.sendTransaction({
                to: wallet.address, 
                from: accounts[8], 
                value: oneEther
            });
        })
        .then(() => {
            var startTimestamp = now() + minutes(10);
            var intervals = 1;
            var period = 0;
            
            return PaymentScheduler.createRecurringPayment(
                PaymentDelegate.address,
                wallet.address,
                ETHER,
                recipient,
                web3.toWei(0.01, 'ether'),
                startTimestamp,
                intervals,
                period,
                200000,
                {from: accounts[1]}
            );
        })
        .then(tx => RecurringPayment.at(tx.logs[0].args.recurringPayment))
        .then(instance => {
            payment = instance;
            //console.log(payment.address);
            return q.all([
                payment.alarmClock(),
                payment.delegate(),
                payment.wallet(),
                payment.token(),
                payment.recipient(),
                payment.amount()
            ]);
        })
        .then(promises => {
            //console.log(promises);
            var alarmClock = promises[0];
            return RecurringAlarmClock.at(alarmClock);
        })
        .then(instance => {
            AlarmClock = instance;
            return q.all([
                AlarmClock.alarm(),
                AlarmClock.task(),
                AlarmClock.currentInterval(),
                AlarmClock.maxIntervals(),
            ]);
        })
        .then(promises => {
            //console.log(promises);
            var alarm = promises[0];
            return TransactionRequestInterface.at(alarm);
        })
        .then(Alarm => Alarm.requestData())
        .then(requestData => {
            // console.log('addrs: ', requestData[0]);
            // console.log('bools: ', requestData[1]);
            // console.log('uints: ', requestData[2]);
            // console.log('uint8: ', requestData[3]);
        })
    });

    it("have a non-delegate attempt to cancel the payment", () => {
        return payment.cancel({from: accounts[2]})
        .then(tx => {
            assert(false, "a non delegate should not be able to cancel a payment")
        })
        .catch(err => PaymentDelegate.payments(wallet.address))
        .then(listAddress => AddressList.at(listAddress))
        .then(instance => {
            payments = instance;
            return payments.get();
        })
        .then(paymentList => {
            assert(paymentList[0] == AlarmClock.address, "alarm clock payment not set correctly");
            assert(paymentList[1] == payment.address, "recurring payment not set correctly");
            assert(paymentList.length == 2, "there should be no more payments in the list");
        })
    });

    it("have a delegate cancel the payment", () => {
        return payment.cancel({from: accounts[1]})
        .then(tx => PaymentDelegate.payments(wallet.address))
        .then(listAddress => AddressList.at(listAddress))
        .then(instance => {
            payments = instance;
            return payments.get();
        })
        .then(paymentList => {
            assert(paymentList.length == 0, "there should be no more payments in the list");
        })
    });

    it("have a non-delegate attempt to schedule a payment", () => {
        var startTimestamp = now() + minutes(10);
        var intervals = 1;
        var period = 0;

        return PaymentScheduler.createRecurringPayment(
            PaymentDelegate.address,
            wallet.address,
            ETHER,
            recipient,
            web3.toWei(0.01, 'ether'),
            startTimestamp,
            intervals,
            period,
            {from: accounts[2]}
        )
        .then(tx => {
            assert(false, "accounts[2] should not be able to schedule a payment");
        })
        .catch(err => payments.get())
        .then(paymentList => {
            assert(paymentList.length == 0, "there should be no more payments in the list");
        })
    });

});
