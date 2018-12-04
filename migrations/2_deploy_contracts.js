// Imported
var EthereumAlarmClock = artifacts.require("RequestFactory");

// Libraries
var DateTimeLib = artifacts.require("BokkyPooBahsDateTimeLibrary");
var ListLib = artifacts.require("ListLib");

// Platform
var DummyGasPriceOracle = artifacts.require("DummyGasPrice");
var GasPriceOracle = artifacts.require("GasPriceOracle");
var PaymentDelegate = artifacts.require("PaymentDelegate");
var RecurringAlarmClock = artifacts.require("RecurringAlarmClock");
var RecurringAlarmClockFactory = artifacts.require("RecurringAlarmClockFactory");
var RecurringAlarmClockManager = artifacts.require("RecurringAlarmClockManager");

// Tests
var ExampleTask = artifacts.require("ExampleTask");
var OneTimePayment = artifacts.require("OneTimePayment");

module.exports = function(deployer, network, accounts) {
    
    if(network == "live"){
        console.log("Live network not supported yet")
    } 
    else if(network == "kovan"){
        deployer.deploy(DateTimeLib)
        .then(() => deployer.deploy(ListLib))
        .then(() => {
            deployer.link(DateTimeLib, RecurringAlarmClock);
            deployer.link(ListLib, RecurringAlarmClockManager);
            deployer.link(ListLib, PaymentDelegate);
        })
        .then(() => deployer.deploy(ExampleTask))
        .then(() => deployer.deploy(OneTimePayment))
        .then(() => deployer.deploy(DummyGasPriceOracle))
        .then(() => deployer.deploy(GasPriceOracle, DummyGasPriceOracle.address))
        .then(() => deployer.deploy(PaymentDelegate))
        .then(() => deployer.deploy(RecurringAlarmClock))
        .then(() => deployer.deploy(RecurringAlarmClockFactory, EthereumAlarmClock.address, RecurringAlarmClock.address))
        .then(() => deployer.deploy(RecurringAlarmClockManager))
        .then(() => {
            console.log("Finished deploying contracts");
        })
    }

};
