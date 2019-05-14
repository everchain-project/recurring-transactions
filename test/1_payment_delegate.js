// const DelegatedWalletContract = artifacts.require("DelegatedWallet");
// const DelegatedWalletFactory = artifacts.require("DelegatedWalletFactory");
// const DentralizedPaymentDelegateBlueprint = artifacts.require("DecentralizedPaymentDelegate");
// const OneTimePaymentBlueprint = artifacts.require("OneTimePayment");

contract('Payment Delegate Blueprint', function(accounts) {
/*
    var ETHER = '0x0000000000000000000000000000000000000000';

    var PaymentDelegate;
    var DelegatedWallet;
    var OneTimePayment;

    var defaultCaller = accounts[0];
    var defaultDelegate = accounts[0];
    var owner = accounts[1];
    var recipient = accounts[2];
    var attacker = accounts[3];
    var executor = accounts[4];

    var recipientStartBalance;

    function deployDelegatedWallet(){
        var instancePromise;
        return DelegatedWalletFactory.deployed()
        .then(instance => {
            WalletFactory = instance;
            return WalletFactory.createWallet(owner, [])
        })
        .then(tx => {
            instancePromise = DelegatedWalletContract.at(tx.logs[0].args.wallet)
            return instancePromise;
        })
        .then(wallet => {
            return Promise.all([
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
        return OneTimePaymentBlueprint.new({from: owner})
        .then(instance => {
            paymentInstance = instance;
            return paymentInstance.initialize(
                PaymentDelegate.address,
                DelegatedWallet.address,
                ETHER,
                recipient,
                "1"
            )
        })
        .then(tx => {
            return paymentInstance;
        })
    }

    it("initialize the payment delegate", () => {
        return DentralizedPaymentDelegateBlueprint.new({from: owner})
        .then(instance => {
            PaymentDelegate = instance;
        })
    });

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
            return PaymentDelegate.schedule(OneTimePayment.address, {from: defaultDelegate})
        })
        .then(tx => {
            return Promise.all([
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

    it("have a non-delegate fail to cancel the payment", () => {
        return PaymentDelegate.schedule(OneTimePayment.address, {from: defaultDelegate})
        .then(tx => {
            return PaymentDelegate.unschedule(OneTimePayment.address, {from: attacker})
        })
        .then(tx => {
            assert(false, "a non-delegate should not be able to cancel a payment");
        })
        .catch(err => {
            return Promise.all([
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
        return OneTimePayment.sendTransaction({from: defaultCaller})
        .then(tx => {
            return Promise.all([
                web3.eth.getBalance(DelegatedWallet.address),
                web3.eth.getBalance(recipient),
            ]);
        })
        .then(etherBalances => {
            var walletBalance = etherBalances[0];
            var recipientBalance = etherBalances[1];
            var expectedBalance = new web3.utils.BN(recipientStartBalance).add(new web3.utils.BN('1'));
            assert(walletBalance == "0", "wallet balance expected to be 0 wei");
            assert(recipientBalance == expectedBalance.toString(), "recipient balance expected to be " + expectedBalance);
            return Promise.all([
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
        var CancellablePayment;
        return deployPayment()
        .then(instance => {
            CancellablePayment = instance;
            return PaymentDelegate.schedule(instance.address, {from: defaultDelegate})
        })
        .then(tx => {
            return Promise.all([
                PaymentDelegate.getOutgoingPayments(DelegatedWallet.address),
                PaymentDelegate.getIncomingPayments(recipient),
            ]);
        })
        .then(paymentLists => {
            var walletPayments = paymentLists[0];
            var recipientPayments = paymentLists[1];
            assert(walletPayments.length == 1, "there should be one wallet payment scheduled");
            assert(walletPayments[0] == CancellablePayment.address, "the only wallet payment should be the example payment");
            assert(recipientPayments.length == 1, "there should be one recipient payment scheduled");
            assert(recipientPayments[0] == CancellablePayment.address, "the only recipient payment should be the example payment");
            return CancellablePayment.cancel({from: defaultDelegate})
        })
        .then(tx => {
            return Promise.all([
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

    it("have a non-scheduler fail to schedule a payment", () => {
        return PaymentDelegate.schedule(OneTimePayment.address, {from: attacker})
        .then(tx => {
            assert(false, "a non-scheduler should not be able to cancel a payment");
        })
        .catch(err => {
            return Promise.all([
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
*/
});
