const DelegatedWalletContract = artifacts.require("DelegatedWallet");
const DelegatedWalletFactory = artifacts.require("DelegatedWalletFactory");
const PaymentDelegateBlueprint = artifacts.require("PaymentDelegate");
const OneTimePaymentBlueprint = artifacts.require("OneTimePayment");

var q = require('q');

contract('Payment Delegate Blueprint', function(accounts) {
    
    var ETHER = '0x0';

    var PaymentDelegate;
    var DelegatedWallet;
    var OneTimePayment;

    var defaultCaller = accounts[0];
    var defaultDelegate = accounts[0];
    var owner = accounts[1]; 
    var recipient = accounts[2];
    var attacker = accounts[3];
    var trustedScheduler = accounts[4];
    var executor = accounts[5];

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
        var paymentInstance;
        return OneTimePaymentBlueprint.new()
        .then(instance => {
            paymentInstance = instance;

            return instance.initialize( 
                PaymentDelegate.address,
                DelegatedWallet.address,
                ETHER,
                recipient,
                1,
                {from: executor}
            );
        })
        .then(tx => {
            return web3.eth.getBalance(DelegatedWallet.address)
        })
        .then(walletBalance => {
            assert(walletBalance == "1", "wallet balance expected to be 1 wei");
            return paymentInstance;
        })
    }

    it("initialize the payment delegate", () => {
        return PaymentDelegateBlueprint.new()
        .then(instance => {
            PaymentDelegate = instance;
            return PaymentDelegate.initialize(owner, {from: owner})
        })
        .then(tx => {
            return PaymentDelegate.addScheduler(trustedScheduler, {from: owner})
        })
    }); 

    it("check correctness of payment delegate", () => {
        return q.all([
            PaymentDelegate.owner(),
            PaymentDelegate.getSchedulers(),
        ])
        .then(promises => {
            var currentOwner = promises[0];
            var schedulers = promises[1];
            assert(owner == currentOwner, "owner was not properly set");
            assert(schedulers.length == 1, "payment delegate scheduler should have 1 payment scheduler");
            assert(schedulers[0] == trustedScheduler, "the payment scheduler was not correctly set");
        })
    })

    it("schedule a payment", () => {
        return deployDelegatedWallet()
        .then(instance => {
            DelegatedWallet = instance;
            return web3.eth.getBalance(recipient)
        })
        .then(etherBalance => {
            recipientStartBalance = etherBalance;
            return deployPayment();
        })
        .then(instance => {
            OneTimePayment = instance;
            return PaymentDelegate.schedule(OneTimePayment.address, {from: trustedScheduler})
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
            assert(walletPayments.length == 1, "there should be one wallet payment scheduled");
            assert(walletPayments[0] == OneTimePayment.address, "the only wallet payment should be the example payment");
            assert(recipientPayments.length == 1, "there should be one recipient payment scheduled");
            assert(recipientPayments[0] == OneTimePayment.address, "the only recipient payment should be the example payment");
        })
    });

    it("have a non-delegate attempt to cancel the payment", () => {
        return PaymentDelegate.schedule(OneTimePayment.address, {from: trustedScheduler})
        .then(tx => {
            return PaymentDelegate.unschedule(OneTimePayment.address, {from: attacker})
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
            assert(walletPayments[0] == OneTimePayment.address, "the only wallet payment should be the example payment");
            assert(recipientPayments.length == 1, "there should be one recipient payment scheduled");
            assert(recipientPayments[0] == OneTimePayment.address, "the only recipient payment should be the example payment");
        })
    });

    it("execute payment", () => {
        return OneTimePayment.sendTransaction({from: executor})
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
        return PaymentDelegate.schedule(OneTimePayment.address, {from: trustedScheduler})
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
            assert(walletPayments[0] == OneTimePayment.address, "the only wallet payment should be the example payment");
            assert(recipientPayments.length == 1, "there should be one recipient payment scheduled");
            assert(recipientPayments[0] == OneTimePayment.address, "the only recipient payment should be the example payment");
            return OneTimePayment.cancel({from: defaultDelegate})
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
        return PaymentDelegate.schedule(OneTimePayment.address, {from: attacker})
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
