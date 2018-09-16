const DelegatedWallet = artifacts.require("DelegatedWallet");
const MiniMeToken = artifacts.require("MiniMeToken");

var q = require('q');

contract('DelegatedWallet', function(accounts) {
    
    const zeroEther     = web3.toWei(   0, 'ether');
    const oneEther      = web3.toWei(   1, 'ether');
    const halfEther     = web3.toWei( 0.5, 'ether');
    const quarterEther  = web3.toWei(0.25, 'ether');

    var delegatedWallet;
    var testToken;
    var tx;

    it("initialize the delegated wallet", function(){
        return DelegatedWallet.deployed()
        .then(_delegatedWallet => {
            delegatedWallet = _delegatedWallet;
            return delegatedWallet.initialize({from: accounts[0]})
        })
        .then(_tx => {
            tx = _tx;
            return delegatedWallet.blockCreated()
        })
        .then(blockCreated => {
            assert(blockCreated.toString() == tx.receipt.blockNumber, "block created was not set correctly");
            return MiniMeToken.deployed();
        })
        .then(TestToken => {
            testToken = TestToken;
            return testToken.generateTokens(delegatedWallet.address, oneEther, {from: accounts[0]});
        })
        .then(_tx => {
            return web3.eth.getBalance(accounts[0]);
        })
        .then(etherBalance => {
            return web3.eth.sendTransaction({to: delegatedWallet.address, from: accounts[0], value: oneEther});
        })
        .then(_tx => q.all([testToken.balanceOf(delegatedWallet.address), web3.eth.getBalance(delegatedWallet.address)]))
        .then(promises => {
            var tokenBalance = promises[0];
            var etherBalance = promises[1];
            assert(tokenBalance == oneEther, "token balance not set correctly");
            assert(etherBalance == oneEther, "ether balance not set correctly");
            return delegatedWallet.owner();
        })
        .then(owner => {
            assert(owner == accounts[0], "owner should be accounts[0]");
        })
        .catch(err => {
            console.log(err);
            assert(false, 'delegated wallet failed to initialize');
        })
    });

    
    it("attempt to re-initialize the delegated wallet", function(){
        return delegatedWallet.initialize({from: accounts[0]})
        .then(() => {
            assert(false, "the delegated wallet should only be able to be initialized once");
        })
        .catch(() => delegatedWallet.owner())
        .then(owner => {
            assert(owner == accounts[0], "the owner should accounts[0]");
        })
    });

    it("have a non-owner attempt to transfer ether from the delegated wallet", function() {
        return delegatedWallet.transfer('0x0', accounts[1], oneEther, {from: accounts[1]})
        .then(txReceipt => {
            assert(false, "the secondary account should not be able to send ether")
        })
        .catch(err => web3.eth.getBalance(delegatedWallet.address))
        .then(etherBalance => {
            assert(etherBalance == oneEther, "balance should equal one ether");
        })
    });

    it("have a non-owner attempt to transfer erc20 tokens from the delegated wallet", function() {
        return delegatedWallet.transfer(testToken.address, accounts[1], halfEther, {from: accounts[1]})
        .then(txReceipt => {
            assert(false, "the secondary account should not be able to send erc20 tokens")
        })
        .catch(err => {
            return testToken.balanceOf(delegatedWallet.address);
        })
        .then(function(tokenBalance){
            assert(tokenBalance == oneEther, "balance should equal half an ether");
        })
    });

    it("have the owner complete a transfer of ether from the delegated wallet", function() {
        return delegatedWallet.transfer('0x0', accounts[1], halfEther, {from: accounts[0]})
        .then(_tx => web3.eth.getBalance(delegatedWallet.address))
        .then(etherBalance => {
            console.log(etherBalance.toString());
            assert(etherBalance == halfEther, "balance should equal half an ether");
        })
    });

    it("have the owner complete a transfer of erc20 tokens from the delegated wallet", function() {
        return delegatedWallet.transfer(testToken.address, accounts[1], halfEther, {from: accounts[0]})
        .then(function(txReceipt){
            assert(false, "the secondary account should not be able to send erc20 tokens")
        })
        .catch(() => testToken.balanceOf(delegatedWallet.address))
        .then(function(tokenBalance){
            assert(tokenBalance == halfEther, "balance should equal half an ether");
            return testToken.balanceOf(accounts[1]);
        })
        .then(function(tokenBalance){
            assert(tokenBalance == halfEther, "balance should equal half an ether");
        })
    });

});