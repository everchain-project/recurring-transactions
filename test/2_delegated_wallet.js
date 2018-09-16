const DelegatedWallet = artifacts.require("DelegatedWallet");
const DelegatedWalletFactory = artifacts.require("DelegatedWalletFactory");
const DelegatedWalletManager = artifacts.require("DelegatedWalletManager");
const FuturePaymentDelegate = artifacts.require("FuturePaymentDelegate");
const MiniMeToken = artifacts.require("MiniMeToken");

var q = require('q');

contract('DelegatedWallet', function(accounts) {
    const oneEther  = web3.toWei(   1, 'ether');
    const halfEther = web3.toWei( 0.5, 'ether');

    var delegatedWallet;
    var testToken;
    var firstWalletAddress;
    var secondWalletAddress;
    
    it("initialize the delegated wallet", function(){
        var tx;

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
            return web3.eth.sendTransaction({
                to: delegatedWallet.address, 
                from: accounts[0], 
                value: oneEther
            });
        })
        .then(_tx => q.all([
            testToken.balanceOf(delegatedWallet.address), 
            web3.eth.getBalance(delegatedWallet.address)
        ]))
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

    it("have a non-owner attempt to add a delegate", function(){
        return delegatedWallet.addDelegate(accounts[1], {from: accounts[1]})
        .then(tx => {
            assert(false, "accounts[1] should not be able to add a delegate");
        })
        .catch(() => {
            // expected outcome
        })
    });

    it("have the owner add a delegate", function(){
        return delegatedWallet.addDelegate(accounts[1], {from: accounts[0]})
        .then(tx => delegatedWallet.getDelegates())
        .then(delegates => {
            assert(delegates.length == 1, "there should be one delegate");
            assert(delegates[0] == accounts[1], "accounts[1] should be the only delegate");
        })
    });

    it("have a non-owner attempt to remove a delegate", function(){
        return delegatedWallet.removeDelegate(accounts[1], {from: accounts[1]})
        .then(tx => {
            assert(false, "accounts[1] should not be able to remove a delegate");
        })
        .catch(() => {
            // expected outcome
        })
    });

    it("have the owner remove a delegate", function(){
        return delegatedWallet.removeDelegate(accounts[1], {from: accounts[0]})
        .then(tx => delegatedWallet.getDelegates())
        .then(delegates => {
            assert(delegates.length == 0, "there should be no delegates");
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
        .then(tx => web3.eth.getBalance(delegatedWallet.address))
        .then(etherBalance => {
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

    it("have a non-owner attempt to claim ownership the delegated wallet", function() {
        return delegatedWallet.transferOwnership(accounts[1], {from: accounts[1]})
        .catch(() => delegatedWallet.owner())
        .then(owner => {
            assert(owner == accounts[0], "owner should be set to accounts[0]");
        })
    });

    it("have the owner transfer ownership of the delegated wallet", function() {
        return delegatedWallet.transferOwnership(accounts[1], {from: accounts[0]})
        .then(() => delegatedWallet.owner())
        .then(owner => {
            assert(owner == accounts[1], "owner should be set to accounts[1]");
        })
    });

    it("create a delegated wallet using the factory", function(){
        var factory;
        var manager;
        var delegate;

        return q.all([
            DelegatedWalletFactory.deployed(), 
            DelegatedWalletManager.deployed(), 
            FuturePaymentDelegate.deployed()
        ])
        .then(promises => {
            factory = promises[0];
            manager = promises[1];
            delegate = promises[2];

            return factory.createWallet(accounts[0], [delegate.address], {from: accounts[0]});
        })
        .then(tx => {
            var eventFilter = factory.NewWallet_event(
                {owner: accounts[0]}, 
                {fromBlock: tx.receipt.blockNumber, toBlock: tx.receipt.blockNumber}
            );
            var deferred = q.defer();
            eventFilter.get(function(err, events){
                events.forEach(event => {
                    if(event.transactionHash == tx.receipt.transactionHash)
                        deferred.resolve(event);
                });
            });

            return deferred.promise;
        })
        .then(event => {
            assert(event.args.owner == accounts[0], "owner should be accounts[0]");
            firstWalletAddress = event.args.walletAddress;
            return manager.addWallet(firstWalletAddress);
        })
        .then(tx => manager.getWallets(accounts[0]))
        .then(wallets => {
            assert(wallets.length == 1), "there should only be one wallet";
            assert(firstWalletAddress == wallets[0], "the only wallet should be the first wallet created");
        })
    });

    it("create a delegated wallet using the manager", function(){
        var factory;
        var manager;
        var delegate;

        return q.all([
            DelegatedWalletFactory.deployed(), 
            DelegatedWalletManager.deployed(), 
            FuturePaymentDelegate.deployed()
        ])
        .then(promises => {
            factory = promises[0];
            manager = promises[1];
            delegate = promises[2];

            return manager.createWallet(factory.address, [delegate.address], {from: accounts[0]});
        })
        .then(tx => {
            var eventFilter = factory.NewWallet_event(
                {owner: accounts[0]}, 
                {fromBlock: tx.receipt.blockNumber, toBlock: tx.receipt.blockNumber}
            );
            var deferred = q.defer();
            eventFilter.get(function(err, events){
                events.forEach(event => {
                    if(event.transactionHash == tx.receipt.transactionHash)
                        deferred.resolve(event);
                });
            });

            return deferred.promise;
        })
        .then(event => {
            assert(event.args.owner == accounts[0], "owner should be accounts[0]");
            secondWalletAddress = event.args.walletAddress;
            return manager.getWallets(accounts[0]);
        })
        .then(wallets => {
            assert(wallets.length == 2), "there should be two wallets";
            assert(firstWalletAddress == wallets[0], "wallet[0] should be the first wallet address");
            assert(secondWalletAddress == wallets[1], "wallet[1] should be the second wallet address");
        })
    });

});