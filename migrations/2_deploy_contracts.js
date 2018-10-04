var MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
var MiniMeToken = artifacts.require("MiniMeToken");

var ListLib = artifacts.require("ListLib");
var ListLibTests = artifacts.require("ListLibTests");
var AddressList = artifacts.require("AddressList");
var AddressListFactory = artifacts.require("AddressListFactory");
var DelegatedWallet = artifacts.require("DelegatedWallet");
var DelegatedWalletFactory = artifacts.require("DelegatedWalletFactory");
var DelegatedWalletManager = artifacts.require("DelegatedWalletManager");
var FuturePaymentDelegate = artifacts.require("FuturePaymentDelegate");

var RequestFactory = artifacts.require("RequestFactory");
var RecurringAlarmClock = artifacts.require("RecurringAlarmClock");
var RecurringAlarmClockFactory = artifacts.require("RecurringAlarmClockFactory");
var RecurringAlarmClockWizard = artifacts.require("RecurringAlarmClockWizard");
var RecurringPayment = artifacts.require("RecurringPayment");
var RecurringPaymentFactory = artifacts.require("RecurringPaymentFactory");

var q = require("q");

module.exports = function(deployer, network, accounts) {
    
    var EthereumAlarmClock;
    
    deployer.deploy(MiniMeTokenFactory)
    .then(() => deployer.deploy(MiniMeToken, MiniMeTokenFactory.address, '0x0', 0, 'Test Token', 18, 'tkn', true))
    .then(() => deployer.deploy(ListLib))
    .then(() => linkListLib())
    .then(() => deployer.deploy(AddressList))
    .then(() => deployer.deploy(AddressListFactory, AddressList.address))
    .then(() => deployer.deploy(DelegatedWallet))
    .then(() => deployer.deploy(DelegatedWalletFactory, DelegatedWallet.address, AddressListFactory.address))
    .then(() => deployer.deploy(DelegatedWalletManager, AddressListFactory.address, DelegatedWalletFactory.address))
    .then(() => deployer.deploy(RecurringAlarmClock))
    .then(() => deployer.deploy(RecurringAlarmClockFactory, RequestFactory.address, RecurringAlarmClock.address))
    .then(() => deployer.deploy(RecurringAlarmClockWizard, accounts[9], RecurringAlarmClockFactory.address))
    .then(() => deployer.deploy(RecurringPayment))
    .then(() => deployer.deploy(RecurringPaymentFactory, RecurringAlarmClockWizard.address, RecurringPayment.address, 2000000))
    .then(() => deployer.deploy(FuturePaymentDelegate))
    .then(function(){
        console.log("Finished deploying contracts");
    });

    function linkListLib(){
        deployer.link(ListLib, ListLibTests);
        deployer.link(ListLib, AddressList);

        return deployer.deploy(ListLibTests);
    }
};
