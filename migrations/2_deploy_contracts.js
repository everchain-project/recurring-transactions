var MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
var MiniMeToken = artifacts.require("MiniMeToken");

var ListLib = artifacts.require("ListLib");
var ListLibTests = artifacts.require("ListLibTests");
var AddressList = artifacts.require("AddressList");
var AddressListFactory = artifacts.require("AddressListFactory");

var DelegatedWallet = artifacts.require("DelegatedWallet");
var DelegatedWalletFactory = artifacts.require("DelegatedWalletFactory");
var FuturePaymentDelegate = artifacts.require("FuturePaymentDelegate");
var FuturePaymentDelegateFactory = artifacts.require("FuturePaymentDelegateFactory");

var RequestFactory = artifacts.require("RequestFactory");
var RecurringAlarmClock = artifacts.require("RecurringAlarmClock");
var RecurringAlarmClockFactory = artifacts.require("RecurringAlarmClockFactory");
var RecurringAlarmClockScheduler = artifacts.require("RecurringAlarmClockScheduler");

var RecurringPayment = artifacts.require("RecurringPayment");
var RecurringPaymentFactory = artifacts.require("RecurringPaymentFactory");
var RecurringPaymentScheduler = artifacts.require("RecurringPaymentScheduler");

var EverchainWalletManager = artifacts.require("EverchainWalletManager");

var q = require("q");

module.exports = function(deployer, network, accounts) {
    deployer.deploy(MiniMeTokenFactory)
    .then(() => deployer.deploy(
        MiniMeToken, 
        MiniMeTokenFactory.address, 
        '0x0', 
        0, 
        'Test Token', 
        18, 
        'tkn', 
        true
    ))
    .then(() => deployer.deploy(ListLib))
    .then(() => {
        deployer.link(ListLib, ListLibTests);
        deployer.link(ListLib, AddressList);

        return q.all([
            deployer.deploy(ListLibTests),
            deployer.deploy(AddressList)
        ]);
    })
    .then(() => deployer.deploy(AddressListFactory, AddressList.address))
    .then(() => deployer.deploy(DelegatedWallet))
    .then(() => deployer.deploy(
        DelegatedWalletFactory, 
        DelegatedWallet.address,
        AddressListFactory.address
    ))
    .then(() => deployer.deploy(FuturePaymentDelegate))
    .then(() => deployer.deploy(
        FuturePaymentDelegateFactory, 
        FuturePaymentDelegate.address, 
        AddressListFactory.address
    ))
    .then(() => deployer.deploy(RecurringAlarmClock))
    .then(() => deployer.deploy(
        RecurringAlarmClockFactory, 
        RequestFactory.address, 
        RecurringAlarmClock.address
    ))
    .then(() => deployer.deploy(
        RecurringAlarmClockScheduler, 
        accounts[9], 
        RecurringAlarmClockFactory.address
    ))
    .then(() => deployer.deploy(RecurringPayment))
    .then(() => deployer.deploy(RecurringPaymentFactory, RecurringPayment.address))
    .then(() => deployer.deploy(
        RecurringPaymentScheduler, 
        RecurringAlarmClockScheduler.address, 
        RecurringPaymentFactory.address
    ))
    .then(() => deployer.deploy(
        EverchainWalletManager, 
        AddressListFactory.address, 
        DelegatedWalletFactory.address, 
        FuturePaymentDelegateFactory.address,
        RecurringPaymentScheduler.address
    ))
    .then(function(){
        console.log("Finished deploying contracts");
    });
};
