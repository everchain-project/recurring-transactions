const DelegatedWallet = artifacts.require("DelegatedWallet");
const AddressList = artifacts.require("AddressList");
const AddressListFactory = artifacts.require("AddressListFactory");
const MiniMeToken = artifacts.require("MiniMeToken");

var q = require('q');

contract('Delegated Wallet Blueprint', function(accounts) {
    const oneEther  = web3.toWei(1, 'ether');
    const halfEther = web3.toWei(0.5, 'ether');
    const quarterEther = web3.toWei(0.25, 'ether');

    var ERC20Token;

    var wallet;
    var delegates;
    var initTx;
    
    it("initialize the delegated wallet blueprint", function(){
        return q.all([
            AddressListFactory.deployed(),
            DelegatedWallet.deployed(),
            MiniMeToken.deployed(),
        ])
        .then(promises => {
            var factory = promises[0];
            wallet = promises[1];
            ERC20Token = promises[2];

            return q.all([
                factory.createAddressList(accounts[0], [accounts[1]], {from: accounts[0]}),
                ERC20Token.generateTokens(accounts[0], oneEther, {from: accounts[0]}),
            ]);
        })
        .then(tx => AddressList.at(tx[0].logs[0].args.addressList))
        .then(instance => {
            delegates = instance;

            return wallet.initialize(
                accounts[0], 
                delegates.address,
                {from: accounts[0]}
            );
        })
        .then(tx => {
            initTx = tx;

            return q.all([
                web3.eth.sendTransaction({to: wallet.address, from: accounts[8], value: oneEther}),
                ERC20Token.transfer(wallet.address, oneEther, {from:accounts[0]})
            ]);
        })
        .then(tx => {
            return q.all([
                web3.eth.getBalance(wallet.address),
                ERC20Token.balanceOf(wallet.address)
            ]);
        })
        .then(balances => {
            var etherBalance = balances[0];
            var tokenBalance = balances[1];
            assert(etherBalance == oneEther, "wallet ether balance should equal one ether");
            assert(tokenBalance == oneEther, "wallet erc20 token balance should equal one ether");
        })
        .catch(err => {
            console.log(err);
            assert(false, 'delegated wallet failed to initialize');
        })
    });

    it("attempt to re-initialize the delegated wallet", function(){
        return wallet.initialize(
            accounts[2], 
            delegates.address,
            {from: accounts[2]}
        )
        .then(() => {
            assert(false, "the delegated wallet should only be able to be initialized once");
        })
        .catch(() => wallet.owner())
        .then(owner => {
            assert(owner == accounts[0], "the owner should still be set to accounts[0]");
        })
    });

    it("check correctness of the initialization", function() {
        return q.all([
            wallet.blockCreated(),
            wallet.owner(),
            wallet.delegates(),
        ])
        .then(promises => {
            var blockCreated = promises[0];
            var owner = promises[1];
            var delegatesAddress = promises[2];

            assert(initTx.receipt.blockNumber == blockCreated, "delegated wallet should be initialized");
            assert(owner == accounts[0], "delegated wallet owner should be set to accounts[0]");
            assert(delegatesAddress == delegates.address, "delegated wallet delegates address list not set correctly");
        })
    });

    it("have the owner transfer ownership of the delegated wallet", function() {
        return wallet.transferOwnership(accounts[1], {from: accounts[0]})
        .then(() => wallet.owner())
        .then(owner => {
            assert(owner == accounts[1], "owner should be set to accounts[1]");
            return wallet.transferOwnership(accounts[0], {from: accounts[1]});
        })
        .then(() => wallet.owner())
        .then(owner => {
            assert(owner == accounts[0], "owner should be set to accounts[0]");
        })
    });


    it("have a delegate transfer ether from the wallet", function() {
        return wallet.isDelegate(accounts[1])
        .then(isDelegate => {
            assert(isDelegate, "accounts[1] should be set as a delegate");
            return wallet.transfer('0x0', accounts[1], halfEther, {from: accounts[1]})
        })
        .then(tx => web3.eth.getBalance(wallet.address))
        .then(etherBalance => {
            assert(etherBalance == halfEther, "wallet ether balance should equal half an ether");
        })
    });

    it("have a delegate transfer erc20 tokens from the wallet", function() {
        return wallet.isDelegate(accounts[1])
        .then(isDelegate => {
            assert(isDelegate, "accounts[1] should be set as a delegate");
            return wallet.transfer(ERC20Token.address, accounts[1], halfEther, {from: accounts[1]})
        })
        .then(tx => q.all([
            ERC20Token.balanceOf(accounts[1]),
            ERC20Token.balanceOf(wallet.address)
        ]))
        .then(balances => {
            var accountBalance = balances[0];
            var walletBalance = balances[1];
            assert(accountBalance == halfEther, "account[1] token balance should equal half an ether");
            assert(walletBalance == halfEther, "wallet token balance should equal half an ether");
        })
    });

    it("have a non-delegate attempt to transfer ether from the delegated wallet", function() {
        return wallet.transfer('0x0', accounts[2], quarterEther, {from: accounts[2]})
        .then(tx => {
            assert(false, "accounts[2] should not be able to send ether")
        })
        .catch(err => web3.eth.getBalance(wallet.address))
        .then(etherBalance => {
            assert(etherBalance == halfEther, "wallet ether balance should equal half an ether");
        })
    });    

    it("have a non-delegate attempt to transfer erc20 tokens from the delegated wallet", function() {
        return wallet.transfer(ERC20Token.address, accounts[2], quarterEther, {from: accounts[2]})
        .then(tx => {
            assert(false, "accounts[2] should not be able to send erc20 tokens")
        })
        .catch(err => ERC20Token.balanceOf(wallet.address))
        .then(function(tokenBalance){
            assert(tokenBalance == halfEther, "wallet token balance should equal half an ether");
        })
    });

    it("have a non-owner attempt to claim ownership the delegated wallet", function() {
        return wallet.transferOwnership(accounts[2], {from: accounts[2]})
        .catch(() => wallet.owner())
        .then(owner => {
            assert(owner == accounts[0], "owner should be set to accounts[0]");
        })
    });

});
