var MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
var MiniMeToken = artifacts.require("MiniMeToken");

var ListLib = artifacts.require("ListLib");
var ListLibTests = artifacts.require("ListLibTests");

var DelegatedWallet = artifacts.require("DelegatedWallet");
var DelegatedWalletFactory = artifacts.require("DelegatedWalletFactory");
var DelegatedWalletManager = artifacts.require("DelegatedWalletManager");

var PaymentDelegate = artifacts.require("PaymentDelegate");
var PaymentDelegateFactory = artifacts.require("PaymentDelegateFactory");

var SimpleTask = artifacts.require("SimpleTask");
var SimplePayment = artifacts.require("SimplePayment");
var RequestFactory = artifacts.require("RequestFactory");
var RecurringAlarmClock = artifacts.require("RecurringAlarmClock");
var RecurringAlarmClockFactory = artifacts.require("RecurringAlarmClockFactory");
var RecurringAlarmClockAssistant = artifacts.require("RecurringAlarmClockAssistant");

var RecurringPayment = artifacts.require("RecurringPayment");
var RecurringPaymentFactory = artifacts.require("RecurringPaymentFactory");
var RecurringPaymentScheduler = artifacts.require("RecurringPaymentScheduler");

var EAC_KOVAN = {
    baseScheduler: "0xf9d49fcc9a9c3bf792fcee05cdbcc09188700db5",
    blockScheduler: "0x74e3412a7f95b810cb86dfb380ff084471b70821",
    claimLib: "0x91b74fe18472815b39bd1719f6416e7a3d13b669",
    executionLib: "0x8f10f41122dfc5ac376f0ffada2d6279b4edfefd",
    iterTools: "0xb2b54d84c61b5a083a9ac2b2f6a70942ae635e1e",
    mathLib: "0x4fa38929055dc881f656532ff778c501c4be9825",
    paymentLib: "0xc8c405fede09a9cda5b6ba6b0214070e26311d5e",
    requestFactory: "0x20e24880b2f9da6c18ea238ac01b4c86de988532",
    requestLib: "0x5c6f0101c1da5529942112162b6db8af5013ecfe",
    requestMetaLib: "0xccba4b0187191a040bd9f9e4d00f1dbe49c68aad",
    requestScheduleLib: "0x2266a08f479c04f8a3a7ae9d01e9ec7f74cbf4d0",
    safeMath: "0x8e05c79ef74d3893d4ebf7cef77c24780bfda1bc",
    timestampScheduler: "0x44b28e47fe781eabf8095a2a21449a82a635745b",
    transactionRequestCore: "0xa33d611a92895a56e38dacaf57c1fc4f54432e28",
    transactionRecorder: "0x1e856137f325fd5f3729c33cccf13ff0fbde56c4"
};

module.exports = function(deployer, network, accounts) {
    var EthereumAlarmClock;

    if(network == "kovan")
        EthereumAlarmClock = EAC_KOVAN.requestFactory;
    else
        EthereumAlarmClock = RequestFactory.address;

    deployer.deploy(MiniMeTokenFactory, {overwrite: false})
    .then(() => deployer.deploy(
        MiniMeToken, 
        MiniMeTokenFactory.address, 
        '0x0', 
        0, 
        'Test Token', 
        18, 
        'tkn', 
        true,
        {overwrite: false}
    ))
    .then(() => deployer.deploy(ListLib, {overwrite: false}))
    .then(() => {
        deployer.link(ListLib, ListLibTests);
        deployer.link(ListLib, DelegatedWallet);
        deployer.link(ListLib, DelegatedWalletManager);
        deployer.link(ListLib, PaymentDelegate);

        return deployer.deploy(ListLibTests, {overwrite: false});
    })
    .then(() => deployer.deploy(DelegatedWallet, {overwrite: false}))
    .then(() => deployer.deploy(DelegatedWalletFactory, DelegatedWallet.address, {overwrite: false}))
    .then(() => deployer.deploy(PaymentDelegate, {overwrite: false}))
    .then(() => deployer.deploy(PaymentDelegateFactory, PaymentDelegate.address, {overwrite: false}))
    .then(() => deployer.deploy(SimpleTask, {overwrite: false}))
    .then(() => deployer.deploy(SimplePayment, {overwrite: false}))
    .then(() => deployer.deploy(RecurringAlarmClock, {overwrite: false}))
    .then(() => deployer.deploy(RecurringAlarmClockFactory, EthereumAlarmClock, RecurringAlarmClock.address,{overwrite: false}))
    .then(() => deployer.deploy(RecurringAlarmClockAssistant, accounts[9], RecurringAlarmClockFactory.address, {overwrite: false}))
    .then(() => deployer.deploy(RecurringPayment, {overwrite: false}))
    .then(() => deployer.deploy(RecurringPaymentFactory, RecurringPayment.address, {overwrite: false}))
    .then(() => deployer.deploy(RecurringPaymentScheduler, RecurringAlarmClockAssistant.address, RecurringPaymentFactory.address,{overwrite: false}))
    .then(function(){
        console.log("Finished deploying contracts");
    });
};
