var RequestFactoryInterface = artifacts.require("RequestFactoryInterface");

var MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
var MiniMeToken = artifacts.require("MiniMeToken");
var ERC20 = artifacts.require("ERC20");

var ListLib = artifacts.require("ListLib");
var ListLibTests = artifacts.require("ListLibTests");
var FuturePaymentLib = artifacts.require("FuturePaymentLib");

var DelegatedWallet = artifacts.require("DelegatedWallet");
var DelegatedWalletFactory = artifacts.require("DelegatedWalletFactory");
var DelegatedWalletManager = artifacts.require("DelegatedWalletManager");
var FuturePaymentDelegate = artifacts.require("FuturePaymentDelegate");

var RecurringAlarmClock = artifacts.require("RecurringAlarmClock");
var RecurringAlarmClockFactory = artifacts.require("RecurringAlarmClockFactory");

var q = require("q");

module.exports = function(deployer, network, accounts) {
    
    console.log("");
    console.log("Deploying contracts to " + network + " network");
    console.log("");

    var feeRecipient = accounts[9];
    var EthereumAlarmClock;
    var EAC = {
        develop: '0x82d50ad3c1091866e258fd0f1a7cc9674609d254',
        kovan: '0x20e24880b2f9da6c18ea238ac01b4c86de988532',
        live: '0xff5c4b7ec93dd70b862af027bb7f3d9900002c4d'
    };
    
    deployer.deploy(ListLib, {overwrite: true})
    .then(() => deployer.deploy(FuturePaymentLib, {overwrite: true}))
    .then(() => deployer.deploy(RecurringAlarmClock, {overwrite: true}))
    .then(() => deployer.deploy(MiniMeTokenFactory, {overwrite: true}))
    .then(() => linkLibListToRelevantContracts())
    .then(() => deployer.deploy(ListLibTests, {overwrite: true}))
    .then(() => deployer.deploy(FuturePaymentDelegate, {overwrite: true}))
    .then(() => deployer.deploy(DelegatedWallet, {overwrite: true}))
    .then(() => deployer.deploy(DelegatedWalletManager, {overwrite: true}))
    .then(() => getEthereumAlarmClockFromCurrentNetwork())
    .then(() => deployer.deploy(RecurringAlarmClockFactory, EthereumAlarmClock.address, RecurringAlarmClock.address, {overwrite: true}))
    .then(() => deployer.deploy(DelegatedWalletFactory, DelegatedWallet.address, {overwrite: true}))
    .then(() => deployer.deploy(MiniMeToken, MiniMeTokenFactory.address, '0x0', 0, 'Test Token', 18, 'tkn', true, {overwrite: true}))
    .then(function(){
        console.log("");
        console.log("Finished deploying contracts");
        console.log("");
    })
    .catch(function(err){
        console.log("");
        console.log("An error occured while deploying contracts");
        console.log("");
        console.log(err);
    });

    function getEthereumAlarmClockFromCurrentNetwork(){
        var deferred = q.defer();

        RequestFactoryInterface.at(EAC[network])
        .then(function(instance){
            EthereumAlarmClock = instance;
            deferred.resolve();
        })
        .catch(function(err){
            deferred.reject(err)
        })

        return deferred.promise;
    }

    function linkLibListToRelevantContracts(){
        var deferred = q.defer();

        deployer.link(ListLib, ListLibTests);
        deployer.link(ListLib, DelegatedWallet);
        deployer.link(ListLib, DelegatedWalletManager);
        deployer.link(ListLib, FuturePaymentDelegate);
        deferred.resolve();

        return deferred.promise;
    }
};
