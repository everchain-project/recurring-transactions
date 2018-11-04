const DelegatedWalletBlueprint = artifacts.require("DelegatedWallet");
const MiniMeToken = artifacts.require("MiniMeToken");

var q = require('q');

contract('Delegated Wallet Blueprint', accounts => {
    
    var ERC20Token;
    var Wallet;

    var defaultCaller = accounts[0];
    var owner = accounts[1];
    var attacker = accounts[2];
    var delegate0 = accounts[3];
    var delegate1 = accounts[4];
    var delegate2 = accounts[5];
    var recipient = accounts[6];

    var initTx;

    function ether (valueInEther) {
        return web3.toWei(valueInEther, 'ether');
    }
    
    it("initialize the delegated wallet blueprint", () => {
        return DelegatedWalletBlueprint.new()
        .then(wallet => {
            Wallet = wallet;
            return Wallet.initialize(owner, {from: defaultCaller});
        })
        .then(tx => {
            initTx = tx;
            return MiniMeToken.deployed()
        })
        .then(erc20Token => {
            ERC20Token = erc20Token;
            
            return q.all([
                web3.eth.sendTransaction({to: Wallet.address, from: defaultCaller, value: ether(1)}),
                ERC20Token.generateTokens(Wallet.address, ether(1), {from: defaultCaller}),
            ]);
        })
        .then(txs => {
            return q.all([
                web3.eth.getBalance(Wallet.address),
                ERC20Token.balanceOf(Wallet.address)
            ]);
        })
        .then(balances => {
            var etherBalance = balances[0];
            var tokenBalance = balances[1];
            assert(etherBalance == ether(1), "wallet ether balance should equal one ether");
            assert(tokenBalance == ether(1), "wallet erc20 token balance should equal 10^18 (one ether)");
        })
    });

    it("attempt to re-initialize the delegated wallet", () => {
        return Wallet.initialize(attacker, {from: attacker})
        .then(() => {
            assert(false, "the delegated wallet should only be able to be initialized once");
        })
        .catch(err => assert(true))
    });

    it("have the owner add delegates", () => {
        return q.all([
            Wallet.addDelegate(delegate0, {from: owner}),
            Wallet.addDelegate(delegate1, {from: owner}),
            Wallet.addDelegate(delegate2, {from: owner}),
        ]).then(txs => {
            return Wallet.getDelegates();
        })
        .then(delegates => {
            assert(delegates[0] == delegate0, "delegates[0] should be set to delegate0");
            assert(delegates[1] == delegate1, "delegates[1] should be set to delegate1");
            assert(delegates[2] == delegate2, "delegates[2] should be set to delegate2");
        })
    });

    it("have the owner remove a delegate", () => {
        return Wallet.removeDelegate(delegate0, {from: owner})
        .then(txs => {
            return Wallet.getDelegates();
        })
        .then(delegates => {
            assert(delegates[0] == delegate2, "delegates[0] should be set to delegate2");
            assert(delegates[1] == delegate1, "delegates[1] should be set to delegate1");
        })
    });

    it("check correctness of the initialization", () => {
        return q.all([
            Wallet.owner(),
            Wallet.blockCreated(),
            Wallet.getDelegates(),
            web3.eth.getBalance(Wallet.address),
            ERC20Token.balanceOf(Wallet.address)
        ])
        .then(promises => {
            var ownerAddress = promises[0];
            var blockCreated = promises[1];
            var delegates = promises[2];
            var etherBalance = promises[3];
            var tokenBalance = promises[4];

            assert(ownerAddress == owner, "the owner address should still be set to owner");
            assert(blockCreated == initTx.receipt.blockNumber, "delegated wallet should be initialized");
            assert(delegates[0] == delegate2, "delegates[0] should be set to delegate2");
            assert(delegates[1] == delegate1, "delegates[1] should be set to delegate1");
            assert(etherBalance == ether(1), "wallet ether balance should equal one ether");
            assert(tokenBalance == ether(1), "wallet erc20 token balance should equal 10^18 (one ether)");
        })
    });

    it("have a delegate transfer ether from the wallet", () => {
        return Wallet.transfer('0x0', recipient, ether(.5), {from: delegate1})
        .then(tx => web3.eth.getBalance(Wallet.address))
        .then(etherBalance => {
            assert(etherBalance == ether(.5), "wallet ether balance should equal half an ether");
        })
    });

    it("have a delegate transfer erc20 tokens from the wallet", () => {
        var oldRecipientBalance;
        return q.all([
            ERC20Token.balanceOf(recipient),
            ERC20Token.balanceOf(Wallet.address)
        ])
        .then(balances => {
            var recipientBalance = balances[0];
            var walletBalance = balances[1];
            oldRecipientBalance = recipientBalance;
            return Wallet.transfer(ERC20Token.address, recipient, ether(.5), {from: delegate1})
        })
        .then(tx => q.all([
            ERC20Token.balanceOf(recipient),
            ERC20Token.balanceOf(Wallet.address)
        ]))
        .then(balances => {
            var newRecipientBalance = balances[0];
            var walletBalance = balances[1];
            var expectedBalance = oldRecipientBalance.plus(ether(.5));
            assert(walletBalance == ether(.5), "wallet token balance should equal half an ether");
            assert(newRecipientBalance.toString() == expectedBalance.toString(), "wallet token balance should equal old balance plus half an ether");
        })
    });

    it("have a non-delegate attempt to transfer ether from the delegated wallet", () => {
        return Wallet.transfer('0x0', attacker, ether(.25), {from: attacker})
        .then(tx => {
            assert(false, "attacker should not be able to send ether")
        })
        .catch(err => web3.eth.getBalance(Wallet.address))
        .then(etherBalance => {
            assert(etherBalance == ether(.5), "wallet ether balance should equal half an ether");
        })
    });    

    it("have a non-delegate attempt to transfer erc20 tokens from the delegated wallet", () => {
        return Wallet.transfer(ERC20Token.address, attacker, ether(.25), {from: attacker})
        .then(tx => {
            assert(false, "attacker should not be able to send erc20 tokens")
        })
        .catch(err => ERC20Token.balanceOf(Wallet.address))
        .then(tokenBalance => {
            assert(tokenBalance == ether(.5), "wallet token balance should equal half an ether");
        })
    });

    it("have a non-owner attempt to add an address", () => {
        return Wallet.addDelegate(attacker, {from: attacker})
        .then(tx => {
            assert(false, "a non-owner should never be allowed to add an address")
        })
        .catch(() => {
            // expected outcome
        })
    });

    it("have a non-owner attempt to remove an address", () => {
        return Wallet.removeDelegate(attacker, {from: attacker})
        .then(tx => {
            assert(false, "a non-owner should never be allowed to remove an address")
        })
        .catch(() => {
            // expected outcome
        })
    });

});
