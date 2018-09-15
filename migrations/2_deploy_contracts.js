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
var RecurringPayment = artifacts.require("RecurringPayment");
var RecurringPaymentFactory = artifacts.require("RecurringPaymentFactory");

//var q = require("q");

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
    
    RequestFactoryInterface.at(EAC[network])
    .then(function(instance){
        EthereumAlarmClock = instance;

        if(network == 'develop')
            setupDevelopContracts();
        else if(network == 'kovan')
            setupKovanContracts();
        else if(network == 'live')
            setupLiveContracts();
        else
            console.log("Tests not supported on the " + network + " network.")
    });

    function setupDevelopContracts () {
        deployer.deploy([
            ListLib,
            FuturePaymentLib,
            RecurringAlarmClock,
            RecurringPayment,
            MiniMeTokenFactory
        ])
        .then(function(){
            deployer.link(
                ListLib, 
                [
                    ListLibTests, 
                    FuturePaymentDelegate,
                    DelegatedWallet, 
                    DelegatedWalletManager
                ]
            );

            deployer.link(
                FuturePaymentLib, 
                [
                    RecurringPaymentFactory,
                ]
            );

            return deployer.deploy([
                ListLibTests,
                DelegatedWallet,
                DelegatedWalletManager,
                [RecurringAlarmClockFactory, EthereumAlarmClock.address, RecurringAlarmClock.address],
            ]);
        })
        .then(function(){
            return deployer.deploy([
                [DelegatedWalletFactory, DelegatedWallet.address],
                [RecurringPaymentFactory, RecurringAlarmClockFactory.address, RecurringPayment.address]
            ]);
        })
        .then(function(){
            return deployer.deploy(
                MiniMeToken,
                MiniMeTokenFactory.address,
                '0x0',
                0,
                'Test Token',
                18,
                'tkn',
                true
            );
        })
        .then(function(){
            return MiniMeToken.deployed();
        })
        .then(function(TestToken){
            return TestToken.generateTokens(
                accounts[0], web3.toWei(1, 'ether'),
                {from: accounts[0]}
            );
        })
        .then(function(){
            console.log("");
            console.log("Finished deploying contracts");
            console.log("");
        });
    }

    function setupKovanContracts () {
        // todo
    }

    function setupLiveContracts () {
        // todo
    }

};
