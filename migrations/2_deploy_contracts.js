// Libraries
var DateTimeLib = artifacts.require("BokkyPooBahsDateTimeLibrary");
var AddressListLib = artifacts.require("AddressListLib");

// Components
var GasPriceOracle = artifacts.require("GasPriceOracle");
var PaymentDelegate = artifacts.require("DecentralizedPaymentDelegate");
var RecurringAlarmClock = artifacts.require("RecurringAlarmClock");
var RecurringAlarmClockFactory = artifacts.require("RecurringAlarmClockFactory");
var RecurringAlarmClockDeployer = artifacts.require("RecurringAlarmClockDeployer");

// Tests
var DummyGasPriceFeed = artifacts.require("DummyGasPriceFeed");
var ExampleTask = artifacts.require("ExampleTask");
var OneTimePayment = artifacts.require("OneTimePayment");

var IBancorGasPriceLimit = {
    'live': "0x607a5C47978e2Eb6d59C6C6f51bc0bF411f4b85a"
}

var EthereumAlarmClock = {
    'kovan': "0x20e24880b2f9da6c18ea238ac01b4c86de988532",
    'live': "0xff5c4b7ec93dd70b862af027bb7f3d9900002c4d",
    'develop': "0xD5CA3F941a09334Ca72758925aaD7d58aBb273B2"
}

module.exports = function(deployer, network, accounts) {
    
    if(network == "live"){
        console.log("Live network not supported yet")
    } 
    else if(network == "kovan"){
        deployer.link(AddressListLib, PaymentDelegate)
        deployer.link(DateTimeLib, RecurringAlarmClock)
        
        return deployer.deploy(PaymentDelegate)
        .then(() => deployer.deploy(RecurringAlarmClock))
        .then(() => deployer.deploy(RecurringAlarmClockFactory, EthereumAlarmClock[network], RecurringAlarmClock.address))
        .then(() => deployer.deploy(RecurringAlarmClockDeployer, RecurringAlarmClockFactory.address, GasPriceOracle.address))
        .then(() => {
            console.log("Finished deploying contracts to " + network);
        })
    }
    else if(network == "develop"){
        deployer.deploy(DateTimeLib)
        .then(() => deployer.deploy(AddressListLib))
        .then(() => {
            deployer.link(DateTimeLib, RecurringAlarmClock);
            deployer.link(AddressListLib, PaymentDelegate);
        })
        .then(() => deployer.deploy(ExampleTask))
        .then(() => deployer.deploy(DummyGasPriceFeed))
        .then(() => deployer.deploy(GasPriceOracle, DummyGasPriceFeed.address))
        .then(() => deployer.deploy(PaymentDelegate))
        .then(() => deployer.deploy(RecurringAlarmClock))
        .then(() => deployer.deploy(RecurringAlarmClockFactory, EthereumAlarmClock[network], RecurringAlarmClock.address))
        .then(() => deployer.deploy(RecurringAlarmClockDeployer, RecurringAlarmClockFactory.address, GasPriceOracle.address))
        .then(() => {
            console.log("Finished deploying contracts to develop" + network);
        })
    }

};
