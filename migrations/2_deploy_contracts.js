var MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
var MiniMeToken = artifacts.require("MiniMeToken");

var ListLib = artifacts.require("ListLib");
var ListLibTests = artifacts.require("ListLibTests");
var TokenCore = artifacts.require("TokenCore");
var DelegatedWallet = artifacts.require("DelegatedWallet");
var DelegatedWalletFactory = artifacts.require("DelegatedWalletFactory");
var DelegatedWalletManager = artifacts.require("DelegatedWalletManager");

var Rescheduler = artifacts.require("Rescheduler");
var ReschedulerLib = artifacts.require("ReschedulerLib");
var AlarmClock = artifacts.require("AlarmClock");
var RecurringPayment = artifacts.require("RecurringPayment");
var RecurringPaymentFactory = artifacts.require("RecurringPaymentFactory");

module.exports = function(deployer, network, accounts) {
    
    var EthereumAlarmClock = '0x0';
    var feeRecipient = accounts[9];

    deployer.deploy(
        [
            ListLib,
            TokenCore,
            AlarmClock,
            Rescheduler,
            ReschedulerLib,
            RecurringPayment,
            MiniMeTokenFactory
        ]
    )
    .then(function(){
        deployer.link(ListLib, [DelegatedWallet, DelegatedWalletManager, ListLibTests]);
        deployer.link(ReschedulerLib, [RecurringPaymentFactory]);
        return deployer.deploy(
            RecurringPaymentFactory,
            Rescheduler.address,
            RecurringPayment.address,
            AlarmClock.address,
            EthereumAlarmClock,
            feeRecipient
        );
    })
    .then(function(){
        return deployer.deploy(DelegatedWallet);
    })
    .then(function(){
        return deployer.deploy(DelegatedWalletFactory, TokenCore.address, DelegatedWallet.address);
    })
    .then(function(){
        return deployer.deploy(DelegatedWalletManager, DelegatedWalletFactory.address);
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
        return deployer.deploy(ListLibTests);
    })
    .then(function(){
        return MiniMeToken.deployed();
    })
    .then(function(instance){
        return instance.generateTokens(
            accounts[0], web3.toWei(1, 'ether'),
            {from: accounts[0]}
        );
    })
    
};
