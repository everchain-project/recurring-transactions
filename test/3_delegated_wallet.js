const TokenCore = artifacts.require("TokenCore");
const DelegatedWallet = artifacts.require("DelegatedWallet");
const DelegatedWalletManager = artifacts.require("DelegatedWalletManager");
const MiniMeToken = artifacts.require("MiniMeToken");
const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
const Rescheduler = artifacts.require("Rescheduler");

contract('DelegatedWallet', function(accounts) {

    const oneEther = web3.toWei(1, 'ether');
    const halfEther = web3.toWei(0.5, 'ether');
    
    var primaryAccount = accounts[0];
    var secondaryAccount = accounts[1];

    var delegatedWalletManager;
    var delegatedWallet;
    var tokenCore;
    var erc20Token;
    
    it("deploy a delegated wallet", function() {
        return DelegatedWalletManager.deployed()
        .then(function(instance) {
            delegatedWalletManager = instance;
            return delegatedWalletManager.createWallet(
                [Rescheduler.address, primaryAccount], 
                {from: primaryAccount}
            );
        })
        .then(function(txReceipt) {
            //console.log(txReceipt);
            return delegatedWalletManager.getWallets(primaryAccount);
        })
        .then(function(wallets){
            assert(wallets.length == 1, "there should be one wallet");
            delegatedWallet = DelegatedWallet.at(wallets[0]);
        })
    });

    it("check correctness of deployment", function() {
        return delegatedWallet.owner()
        .then(function(owner){
            assert(owner == primaryAccount, "the owner should be the primary account");
        })
        .then(function(txReceipt){
            return delegatedWallet.getDelegates()
        })
        .then(function(delegates){
            assert(delegates.length == 2, "there should be two delegates");
            assert(delegates[0] == Rescheduler.address, "the first delegate should be the rescheduler");
            assert(delegates[1] == primaryAccount, "the second delegate should be the primary account");
            return delegatedWallet.isDelegate(Rescheduler.address);
        })
        .then(function(isDelegate){
            assert(isDelegate == true, "the rescheduler should be flagged as a delegate");
            return delegatedWallet.isDelegate(primaryAccount);
        })
        .then(function(isDelegate){
            assert(isDelegate == true, "the primaryAccount should be flagged as a delegate");
            return delegatedWallet.totalDelegates();
        })
        .then(function(totalDelegates){ 
            assert(totalDelegates == 2, "there should be two delegates");
            return delegatedWallet.tokenCore();
        })
        .then(function(tokenCoreAddress){
            tokenCore = TokenCore.at(tokenCoreAddress);
            return tokenCore.owner();
        })
        .then(function(owner){
            assert(owner == delegatedWallet.address, "the token core should be owned by the delegated wallet");
        })
    });

    it("attempt to re-initialize the delegated wallet", function(){
        return delegatedWallet.initialize(tokenCore.address)
        .then(function(){
            assert(false, "the delegated wallet should only be able to be initialized once");
        })
        .catch(function(){
            return delegatedWallet.owner();
        })
        .then(function(owner){
            assert(owner == primaryAccount, "the owner should be the primary account");
        })
    });

    it("Send ether to the wallet token core", function() {
        return delegatedWallet.tokenCore()
        .then(function(tokenCoreAddress){
            tokenCore = TokenCore.at(tokenCoreAddress);
            return tokenCore.sendTransaction({
                from: primaryAccount,
                value: oneEther
            });
        })
        .then(function(txReceipt){
            return web3.eth.getBalance(tokenCore.address)
        })
        .then(function(etherBalance){
            assert(etherBalance == oneEther, "balance should equal one ether");
        });
    });

    it("Send erc20 tokens to the wallet token core", function() {
        return MiniMeToken.deployed()
        .then(function(instance){
            erc20Token = instance;
        })
        .then(function(txReceipt){
            return erc20Token.balanceOf(primaryAccount);
        })
        .then(function(tokenBalance){
            assert(tokenBalance == oneEther, "balance should equal one ether");
            return erc20Token.transfer(
                tokenCore.address, halfEther,
                {from: primaryAccount}
            );
        })
        .then(function(txReceipt){
            return erc20Token.balanceOf(tokenCore.address);
        })
        .then(function(tokenBalance){
            assert(tokenBalance == halfEther, "balance should equal half an ether");
        })
    });

    it("have a non-delegate attempt to transfer ether from the wallet", function() {
        return delegatedWallet.transfer(
            '0x0', secondaryAccount, oneEther,
            {from: secondaryAccount}
        )
        .then(function(txReceipt){
            assert(false, "the secondary account should not be able to send ether")
        })
        .catch(function(err){
            return web3.eth.getBalance(tokenCore.address);
        })
        .then(function(etherBalance){
            assert(etherBalance == oneEther, "balance should equal one ether");
        })
    });

    it("have a delegate complete a transfer of ether from the wallet", function() {
        return delegatedWallet.transfer(
            '0x0', secondaryAccount, halfEther,
            {from: primaryAccount}
        )
        .then(function(txReceipt){
            return web3.eth.getBalance(tokenCore.address)
        })
        .then(function(etherBalance){
            assert(etherBalance == halfEther, "balance should equal half an ether");
        })
    });

    it("have a non-owner attempt to add a delegate", function() {
        return delegatedWallet.addDelegate(
            secondaryAccount,
            {from: secondaryAccount}
        )
        .then(function(txReceipt){
            assert(false, "the secondary account should not be able to add itself as a delegate");
        })
        .catch(function(err){
            return delegatedWallet.getDelegates();
        })
        .then(function(delegates){
            assert(delegates.length == 2, "there should be two delegates");
            assert(delegates[0] == Rescheduler.address, "the first delegate should be the rescheduler");
            assert(delegates[1] == primaryAccount, "the second delegate should be the primary account");
            return delegatedWallet.totalDelegates();
        })
        .then(function(totalDelegates){ 
            assert(totalDelegates == 2, "there should be two delegates");
            return delegatedWallet.isDelegate(secondaryAccount);
        })
        .then(function(isDelegate){
            assert(isDelegate == false, "the secondary account should not be flagged as a delegate");
        })
    });

    it("have the owner add a delegate", function() {
        return delegatedWallet.addDelegate(
            secondaryAccount,
            {from: primaryAccount}
        )
        .then(function(txReceipt){
            return delegatedWallet.getDelegates()
        })
        .then(function(delegates){
            assert(delegates.length == 3, "there should be three delegates");
            assert(delegates[0] == Rescheduler.address, "the first delegate should be the rescheduler");
            assert(delegates[1] == primaryAccount, "the second delegate should be the primary account");
            assert(delegates[2] == secondaryAccount, "the third delegate should be the secondary account");
            return delegatedWallet.totalDelegates();
        })
        .then(function(totalDelegates){ 
            assert(totalDelegates == 3, "there should be three delegates");
        })
    });

    it("have a non-owner attempt to remove a delegate", function() {
        return delegatedWallet.removeDelegate(
            Rescheduler.address,
            {from: secondaryAccount}
        )
        .then(function(txReceipt){
            assert(false, "the secondary account should not be able remove a delegate");
        })
        .catch(function(txReceipt){
            return delegatedWallet.getDelegates()
        })
        .then(function(delegates){
            assert(delegates.length == 3, "there should be two delegates");
            assert(delegates[0] == Rescheduler.address, "the first delegate should be the rescheduler");
            assert(delegates[1] == primaryAccount, "the second delegate should be the primary account");
            assert(delegates[2] == secondaryAccount, "the third delegate should be the secondary account");
        })
    });

    it("have the owner remove a delegate", function() {
        return delegatedWallet.removeDelegate(
            primaryAccount,
            {from: primaryAccount}
        )
        .then(function(txReceipt){
            return delegatedWallet.getDelegates()
        })
        .then(function(delegates){
            assert(delegates.length == 2, "there should be two delegates");
            assert(delegates[0] == Rescheduler.address, "the first delegate should be the rescheduler")
            assert(delegates[1] == secondaryAccount, "the second delegate should be the secondary account")
        })
    });

});