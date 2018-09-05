const TokenCore = artifacts.require("TokenCore");
const MiniMeToken = artifacts.require("MiniMeToken");
const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");

contract('TokenCore', function(accounts) {
    
    const oneEther = web3.toWei(1, 'ether');
    const halfEther = web3.toWei(0.5, 'ether');
    const zeroEther = '0';

    var primaryAccount = accounts[0];
    var secondaryAccount = accounts[1];

    var tokenCore;
    var tx;
    
    it("initialize the token core", function(){
        return TokenCore.deployed()
        .then(function(instance){
            tokenCore = instance;
            return tokenCore.initialize(primaryAccount);
        })
        .then(function(txReceipt){
            tx = txReceipt;
        })
        .catch(function(err){
            assert(false, 'token core failed to initialize');
        })
    });
    
    it("check correctness of the token core", function(){
        return tokenCore.blockCreated()
        .then(function(blockCreated){
            assert(blockCreated == tx.receipt.blockNumber, "block created was not set properly");
            return tokenCore.owner();
        })
        .then(function(owner){
            assert(owner == primaryAccount);
        })
    });

    it("attempt to re-initialize the token core", function(){
        return tokenCore.initialize(secondaryAccount)
        .then(function(){
            assert(false, "the token core should only be able to be initialized once");
        })
        .catch(function(){
            return tokenCore.owner();
        })
        .then(function(owner){
            assert(owner == primaryAccount, "the owner should be the delegated wallet");
        })
    });

    it("Send ether to the token core", function() {
        return tokenCore.sendTransaction({
            from: primaryAccount,
            value: oneEther
        })
        .then(function(txReceipt){
            return web3.eth.getBalance(tokenCore.address)
        })
        .then(function(etherBalance){
            assert(etherBalance == oneEther, "balance should equal one ether");
        });
    });

    it("Send erc20 tokens to the token core", function() {
        return MiniMeToken.deployed()
        .then(function(instance){
            erc20Token = instance;
        })
        .then(function(txReceipt){
            return erc20Token.balanceOf(primaryAccount);
        })
        .then(function(tokenBalance){
            assert(tokenBalance == oneEther, "balance should equal one ether of tokens");
            return erc20Token.transfer(
                tokenCore.address, halfEther,
                {from: primaryAccount}
            );
        })
        .then(function(txReceipt){
            return erc20Token.balanceOf(tokenCore.address);
        })
        .then(function(tokenBalance){
            assert(tokenBalance == halfEther, "balance should equal half an ether of tokens");
        })
    });

    it("have a non-owner attempt to transfer ether from the token core", function() {
        return tokenCore.transfer(
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

    it("have a non-owner attempt to transfer erc20 tokens from the token core", function() {
        return tokenCore.transfer(
            erc20Token.address, secondaryAccount, halfEther,
            {from: secondaryAccount}
        )
        .then(function(txReceipt){
            assert(false, "the secondary account should not be able to send erc20 tokens")
        })
        .catch(function(err){
            return erc20Token.balanceOf(tokenCore.address);
        })
        .then(function(tokenBalance){
            assert(tokenBalance == halfEther, "balance should equal half an ether");
        })
    });

    it("have the owner complete a transfer of ether from the token core", function() {
        return tokenCore.transfer(
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

    it("have the owner complete a transfer of erc20 tokens from the token core", function() {
        return tokenCore.transfer(
            erc20Token.address, secondaryAccount, halfEther,
            {from: primaryAccount}
        )
        .then(function(txReceipt){
            assert(false, "the secondary account should not be able to send erc20 tokens")
        })
        .catch(function(err){
            return erc20Token.balanceOf(tokenCore.address);
        })
        .then(function(tokenBalance){
            assert(tokenBalance == zeroEther, "balance should equal zero ether");
            return erc20Token.balanceOf(secondaryAccount);
        })
        .then(function(tokenBalance){
            assert(tokenBalance == halfEther, "balance should equal half an ether");
        })
    });
    
});