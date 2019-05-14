// Libraries
var DateTimeLib = artifacts.require("BokkyPooBahsDateTimeLibrary");
var AddressListLib = artifacts.require("AddressListLib");

// Components
var PaymentDelegate = artifacts.require("DecentralizedPaymentDelegate");
var RecurringTransaction = artifacts.require("RecurringTransaction");
var RecurringTransactionFactory = artifacts.require("RecurringTransactionFactory");
var RecurringTransactionHelper = artifacts.require("RecurringTransactionHelper");

// Feeds
var BancorGasPriceFeed = artifacts.require("BancorGasPriceFeed");
var DaiPriceFeed = artifacts.require('DaiPriceFeed');

// Test Contracts
var ExampleTask = artifacts.require("ExampleTask");
var OneTimePayment = artifacts.require("OneTimePayment");
var DummyGasPriceFeed = artifacts.require("DummyGasPriceFeed");

var IBancorGasPriceLimit = {
    'live': "0x607a5C47978e2Eb6d59C6C6f51bc0bF411f4b85a"
}

var EthereumAlarmClock = {
    'kovan': "0x20e24880b2f9da6c18ea238ac01b4c86de988532",
    'live': "0xff5c4b7ec93dd70b862af027bb7f3d9900002c4d",
    'develop': "0xD5CA3F941a09334Ca72758925aaD7d58aBb273B2",
    'test': "0xD5CA3F941a09334Ca72758925aaD7d58aBb273B2",
}

module.exports = function(deployer, network, accounts) {

    if(network == "live"){
        console.log("Live network not supported yet")
    }
    else if(network == "kovan"){
        //deployer.deploy(DateTimeLib)
        //.then(() => {
            deployer.link(DateTimeLib, RecurringTransaction);
            //deployer.link(AddressListLib, PaymentDelegate);
        //})
        //.then(() => deployer.deploy(ExampleTask))
        //.then(() => deployer.deploy(DummyGasPriceFeed))
        //.then(() => deployer.deploy(BancorGasPriceFeed, DummyGasPriceFeed.address))
        //.then(() => deployer.deploy(PaymentDelegate))
        //.then(() =>
            deployer.deploy(RecurringTransaction)
        .then(() => deployer.deploy(RecurringTransactionFactory, EthereumAlarmClock[network], RecurringTransaction.address))
        .then(() => deployer.deploy(RecurringTransactionHelper, PaymentDelegate.address, RecurringTransactionFactory.address, BancorGasPriceFeed.address))
        .then(() => {
            console.log("Finished deploying contracts to " + network);
        })
    }
    else if(network == "test"){
        deployer.deploy(DateTimeLib)
        .then(() => deployer.deploy(AddressListLib))
        .then(() => {
            deployer.link(DateTimeLib, RecurringTransaction);
            deployer.link(AddressListLib, PaymentDelegate);
        })
        .then(() => deployer.deploy(ExampleTask))
        .then(() => deployer.deploy(DummyGasPriceFeed))
        .then(() => deployer.deploy(BancorGasPriceFeed, DummyGasPriceFeed.address))
        .then(() => deployer.deploy(PaymentDelegate))
        .then(() => deployer.deploy(RecurringTransaction))
        .then(() => deployer.deploy(RecurringTransactionFactory, EthereumAlarmClock[network], RecurringTransaction.address))
        .then(() => deployer.deploy(RecurringTransactionHelper, RecurringTransactionFactory.address, BancorGasPriceFeed.address))
        .then(() => {
            console.log("Finished deploying contracts to " + network);
        })
    }

};
