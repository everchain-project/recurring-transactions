const DelegatedWalletContract = artifacts.require("DelegatedWallet");
const DelegatedWalletFactory = artifacts.require("DelegatedWalletFactory");
const PaymentDelegateBlueprint = artifacts.require("PaymentDelegate");
const SimplePaymentBlueprint = artifacts.require("SimplePayment");

var q = require('q');

contract('Payment Delegate Blueprint', function(accounts) {
    
    var ETHER = '0x0';

    var PaymentDelegate;
    var DelegatedWallet;
    var SimplePayment;

    var defaultCaller = accounts[0];
    var defaultDelegate = accounts[0];
    var owner = accounts[1]; 
    var recipient = accounts[2];
    var attacker = accounts[3];
    var trustedScheduler = accounts[4];
    var alarm = accounts[5];

    var recipientStartBalance;

    function deployDelegatedWallet(){
        var instancePromise;
        return DelegatedWalletFactory.deployed()
        .then(instance => {
            WalletFactory = instance;
            return WalletFactory.createWallet({from: owner})
        })
        .then(tx => {
            instancePromise = DelegatedWalletContract.at(tx.logs[0].args.wallet)
            return instancePromise;
        })
        .then(wallet => {
            return q.all([
                wallet.addDelegate(defaultDelegate, {from: owner}),
                wallet.addDelegate(PaymentDelegate.address, {from: owner}),
                web3.eth.sendTransaction({from: defaultCaller, to: wallet.address, value: 1})
            ])
        })
        .then(txs => {
            return instancePromise;
        })
    }

    function deployPayment(){
        return SimplePaymentBlueprint.deployed()
        .then(instance => {
            return instance.initialize( 
                PaymentDelegate.address,
                DelegatedWallet.address,
                ETHER,
                recipient,
                1,
                {from: alarm}
            );
        })
        .then(tx => {
            return web3.eth.getBalance(DelegatedWallet.address)
        })
        .then(walletBalance => {
            assert(walletBalance == "1", "wallet balance expected to be 1 wei");
            return SimplePaymentBlueprint.deployed();
        })
    }

    it("initialize the payment delegate", () => {
        return PaymentDelegateBlueprint.deployed()
        .then(instance => {
            PaymentDelegate = instance;
            return PaymentDelegate.initialize(owner, {from: defaultCaller})
        })
        .then(tx => {
            return PaymentDelegate.addScheduler(trustedScheduler, {from: owner})
        })
    }); 

    it("check correctness of future payment delegate", () => {
        return q.all([
            PaymentDelegate.owner(),
            PaymentDelegate.getSchedulers(),
        ])
        .then(promises => {
            var currentOwner = promises[0];
            var schedulers = promises[1];
            assert(owner == currentOwner);
            assert(schedulers.length == 1);
            assert(schedulers[0] == trustedScheduler);
        })
    })

    it("schedule a payment", () => {
        return deployDelegatedWallet()
        .then(instance => {
            DelegatedWallet = instance;
            return deployPayment();
        })
        .then(instance => {
            SimplePayment = instance;
            return PaymentDelegate.schedule(SimplePayment.address, {from: trustedScheduler})
        })
        .then(tx => {
            return web3.eth.getBalance(recipient)
        })
        .then(etherBalance => {
            recipientStartBalance = etherBalance;
            return q.all([
                PaymentDelegate.getOutgoingPayments(DelegatedWallet.address),
                PaymentDelegate.getIncomingPayments(recipient),
            ]);
        })
        .then(paymentLists => {
            var walletPayments = paymentLists[0];
            var recipientPayments = paymentLists[1];
            assert(walletPayments.length == 1, "there should be one wallet payment scheduled");
            assert(walletPayments[0] == SimplePayment.address, "the only wallet payment should be the simple payment");
            assert(recipientPayments.length == 1, "there should be one recipient payment scheduled");
            assert(recipientPayments[0] == SimplePayment.address, "the only recipient payment should be the simple payment");
        })
    });

    it("have a non-delegate attempt to cancel the payment", () => {
        return PaymentDelegate.schedule(SimplePayment.address, {from: trustedScheduler})
        .then(tx => {
            return PaymentDelegate.unschedule(SimplePayment.address, {from: attacker})
        })
        .then(tx => {
            assert(false, "a non-delegate should not be able to cancel a payment");
        })
        .catch(err => {
            return q.all([
                PaymentDelegate.getOutgoingPayments(DelegatedWallet.address),
                PaymentDelegate.getIncomingPayments(recipient),
            ]);
        })
        .then(paymentLists => {
            var walletPayments = paymentLists[0];
            var recipientPayments = paymentLists[1];
            assert(walletPayments.length == 1, "there should be one wallet payment scheduled");
            assert(walletPayments[0] == SimplePayment.address, "the only wallet payment should be the simple payment");
            assert(recipientPayments.length == 1, "there should be one recipient payment scheduled");
            assert(recipientPayments[0] == SimplePayment.address, "the only recipient payment should be the simple payment");
        })
    });

    it("execute payment", () => {
        return SimplePayment.sendTransaction({from: alarm})
        .then(tx => {
            return q.all([
                web3.eth.getBalance(DelegatedWallet.address),
                web3.eth.getBalance(recipient),
            ]);
        })
        .then(etherBalances => {
            var walletBalance = etherBalances[0];
            var recipientBalance = etherBalances[1];
            var expectedBalance = recipientStartBalance.plus(1);
            assert(walletBalance == "0", "wallet balance expected to be 0 wei");
            assert(recipientBalance.toString() == expectedBalance.toString(), "recipient balance expected to be " + expectedBalance);
            return q.all([
                PaymentDelegate.getOutgoingPayments(DelegatedWallet.address),
                PaymentDelegate.getIncomingPayments(recipient),
            ]);
        })
        .then(paymentLists => {
            var walletPayments = paymentLists[0];
            var recipientPayments = paymentLists[1];
            assert(walletPayments.length == 0, "there should be no wallet payments scheduled");
            assert(recipientPayments.length == 0, "there should be no recipient payments scheduled");
        })
    });

    it("have a delegate cancel a payment", () => {
        return PaymentDelegate.schedule(SimplePayment.address, {from: trustedScheduler})
        .then(tx => {
            return q.all([
                PaymentDelegate.getOutgoingPayments(DelegatedWallet.address),
                PaymentDelegate.getIncomingPayments(recipient),
            ]);
        })
        .then(paymentLists => {
            var walletPayments = paymentLists[0];
            var recipientPayments = paymentLists[1];
            assert(walletPayments.length == 1, "there should be one wallet payment scheduled");
            assert(walletPayments[0] == SimplePayment.address, "the only wallet payment should be the simple payment");
            assert(recipientPayments.length == 1, "there should be one recipient payment scheduled");
            assert(recipientPayments[0] == SimplePayment.address, "the only recipient payment should be the simple payment");
            return SimplePayment.cancel({from: defaultDelegate})
        })
        .then(tx => {
            return q.all([
                PaymentDelegate.getOutgoingPayments(DelegatedWallet.address),
                PaymentDelegate.getIncomingPayments(recipient),
            ]);
        })
        .then(paymentLists => {
            var walletPayments = paymentLists[0];
            var recipientPayments = paymentLists[1];
            assert(walletPayments.length == 0, "there should be no wallet payments scheduled");
            assert(recipientPayments.length == 0, "there should be no recipient payments scheduled");
        })
            
    });

    it("have a non-scheduler attempt to schedule a payment", () => {
        return PaymentDelegate.schedule(SimplePayment.address, {from: attacker})
        .then(tx => {
            assert(false, "a non-scheduler should not be able to cancel a payment");
        })
        .catch(err => {
            return q.all([
                PaymentDelegate.getOutgoingPayments(DelegatedWallet.address),
                PaymentDelegate.getIncomingPayments(recipient),
            ]);
        })
        .then(paymentLists => {
            var walletPayments = paymentLists[0];
            var recipientPayments = paymentLists[1];
            assert(walletPayments.length == 0, "there should be no wallet payments scheduled");
            assert(recipientPayments.length == 0, "there should be no recipient payments scheduled");
        })
    });

});
