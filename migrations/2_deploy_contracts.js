// Imported
var EthereumAlarmClock = artifacts.require("RequestFactory");

// Libraries
var DateTimeLib = artifacts.require("BokkyPooBahsDateTimeLibrary");
var ListLib = artifacts.require("ListLib");

// Components
var GasPriceOracle = artifacts.require("GasPriceOracle");
var PaymentDelegate = artifacts.require("DecentralizedPaymentDelegate");
var RecurringAlarmClock = artifacts.require("RecurringAlarmClock");

// Helpers
var RecurringAlarmClockFactory = artifacts.require("RecurringAlarmClockFactory");
var RecurringAlarmClockWizard = artifacts.require("RecurringAlarmClockWizard");

// Tests
var DummyGasPriceFeed = artifacts.require("DummyGasPriceFeed");
var ExampleTask = artifacts.require("ExampleTask");
var OneTimePayment = artifacts.require("OneTimePayment");

var IBancorGasPriceLimit = {
    address: "0x607a5C47978e2Eb6d59C6C6f51bc0bF411f4b85a"
}

module.exports = function(deployer, network, accounts) {
    
    if(network == "live"){
        console.log("Live network not supported yet")
    } 
    else if(network == "kovan"){
        deployer.deploy(ListLib, {overwrite: false})
        .then(() => deployer.deploy(ExampleTask))
        .then(() => deployer.deploy(DummyGasPriceFeed))
        .then(() => deployer.deploy(GasPriceOracle, DummyGasPriceFeed.address))
        .then(() => {
            deployer.link(ListLib, PaymentDelegate)
            return deployer.deploy(PaymentDelegate)
        })
        .then(() => {
            deployer.link(DateTimeLib, RecurringAlarmClock)
            return deployer.deploy(RecurringAlarmClock)
        })
        .then(() => deployer.deploy(RecurringAlarmClockFactory, EthereumAlarmClock.address, RecurringAlarmClock.address))
        .then(() => deployer.deploy(RecurringAlarmClockWizard, RecurringAlarmClockFactory.address, GasPriceOracle.address))
        .then(() => {
            console.log("Finished deploying contracts to " + network);
        })
    }
    else if(network == "develop"){
        deployer.deploy(DateTimeLib)
        .then(() => {
            deployer.link(DateTimeLib, RecurringAlarmClock);
            deployer.link(ListLib, PaymentDelegate);
        })
        .then(() => deployer.deploy(ExampleTask))
        .then(() => deployer.deploy(DummyGasPriceFeed))
        .then(() => deployer.deploy(GasPriceOracle, DummyGasPriceFeed.address))
        .then(() => deployer.deploy(PaymentDelegate))
        .then(() => deployer.deploy(RecurringAlarmClock))
        .then(() => deployer.deploy(RecurringAlarmClockFactory, EthereumAlarmClock.address, RecurringAlarmClock.address))
        .then(() => deployer.deploy(RecurringAlarmClockWizard, RecurringAlarmClockFactory.address, GasPriceOracle.address))
        .then(() => {
            console.log("Finished deploying contracts to develop" + network);
        })
    }

};
