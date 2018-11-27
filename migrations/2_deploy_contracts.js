// Imported
var EthereumAlarmClock = artifacts.require("RequestFactory");

// Libraries
var DateTimeLib = artifacts.require("BokkyPooBahsDateTimeLibrary");
var ListLib = artifacts.require("ListLib");

// Platform
var GasPriceOracle = artifacts.require("GasPriceOracle");
var RecurringAlarmClock = artifacts.require("RecurringAlarmClock");
var RecurringAlarmClockFactory = artifacts.require("RecurringAlarmClockFactory");
var PaymentDelegate = artifacts.require("PaymentDelegate");
// var PaymentDelegateFactory = artifacts.require("PaymentDelegateFactory");

// Tests
var ExampleTask = artifacts.require("ExampleTask");
var OneTimePayment = artifacts.require("OneTimePayment");

var BANCOR = {
    gasPriceOracle: {
        "live": "0x607a5C47978e2Eb6d59C6C6f51bc0bF411f4b85a",
        "kovan": null,
    }
}

var MAKER = {
    dai: {
        "live": "0x729D19f657BD0614b4985Cf1D82531c67569197B",
        "kovan": "0xa5aA4e07F5255E14F02B385b1f04b35cC50bdb66",
    }
}

module.exports = function(deployer, network, accounts) {
    
    var owner = accounts[0];

    if(network == "live"){
        console.log("Live network not supported yet")
        
    } 
    else if(network == "kovan"){
        deployer.deploy(DateTimeLib)
        .then(() => deployer.deploy(ListLib))
        .then(() => {
            deployer.link(DateTimeLib, RecurringAlarmClock);
            deployer.link(ListLib, PaymentDelegate);
        })
        .then(() => deployer.deploy(GasPriceOracle))
        .then(() => deployer.deploy(RecurringAlarmClock))
        .then(() => deployer.deploy(RecurringAlarmClockFactory, EthereumAlarmClock.address, RecurringAlarmClock.address))
        .then(() => deployer.deploy(PaymentDelegate, owner))
        .then(() => {
            
        })
    } 
    else if(network == "develop"){
        
    }

    /*
    var owner = accounts[0];
    var PriorityCaller = accounts[9];
    var EthereumAlarmClock;
    if(network == "kovan")
        EthereumAlarmClock = EAC.KOVAN.requestFactory;
    else
        EthereumAlarmClock = RequestFactory.address;

    deployer.deploy(MiniMeTokenFactory, {overwrite: false})
    .then(() => deployer.deploy(MiniMeToken, MiniMeTokenFactory.address, '0x0', 0, 'Test Token', 18, 'tkn', true, {overwrite: false}))
    .then(() => deployer.deploy(ListLib, {overwrite: false}))
    .then(() => {
        deployer.link(ListLib, ListLibTests);
        deployer.link(ListLib, DelegatedWallet);
        deployer.link(ListLib, DelegatedWalletManager);
        deployer.link(ListLib, PaymentDelegate);

        return deployer.deploy(ListLibTests, {overwrite: false});
    })
    .then(() => deployer.deploy(ExampleTask, {overwrite: false}))
    .then(() => deployer.deploy(OneTimePayment, {overwrite: false}))
    .then(() => deployer.deploy(DelegatedWallet, {overwrite: false}))
    .then(() => deployer.deploy(DelegatedWalletFactory, DelegatedWallet.address, {overwrite: false}))
    .then(() => deployer.deploy(DelegatedWalletManager, DelegatedWalletFactory.address, {overwrite: false}))
    .then(() => deployer.deploy(PaymentDelegate, {overwrite: false}))
    .then(() => deployer.deploy(PaymentDelegateFactory, PaymentDelegate.address, {overwrite: false}))
    .then(() => deployer.deploy(RecurringAlarmClock, {overwrite: false}))
    .then(() => deployer.deploy(RecurringAlarmClockFactory, RequestFactory.address, RecurringAlarmClock.address, {overwrite: false}))
    .then(() => deployer.deploy(RecurringAlarmClockAssistant, PriorityCaller, RecurringAlarmClockFactory.address, {overwrite: false}))
    .then(() => deployer.deploy(RecurringPayment, {overwrite: false}))
    .then(() => deployer.deploy(RecurringPaymentFactory, RecurringPayment.address, 500000, {overwrite: false}))
    .then(() => deployer.deploy(RecurringPaymentScheduler, RecurringAlarmClockAssistant.address, RecurringPaymentFactory.address, {overwrite: false}))
    .then(() => PaymentDelegate.deployed())
    .then(instance => {
        return instance.initialize(owner, {from: owner})
        .then(tx => {
            return Promise.all([
                instance.addScheduler(RecurringPaymentScheduler.address, {from: owner}),
                instance.addScheduler(RecurringAlarmClockAssistant.address, {from: owner}),
            ])
        })
        .then(promises => {
            // successfully initialized
            console.log("Finished deploying contracts");
        })
        .catch(err => {
            // already initialized
            console.log("Finished deploying contracts");
        })
    })

    */
};
