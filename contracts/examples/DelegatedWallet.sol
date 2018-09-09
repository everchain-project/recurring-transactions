pragma solidity ^0.4.23;

import "../external/Owned.sol";
import "../external/CloneFactory.sol";
import "../examples/TokenCore.sol";
import "../libraries/ListLib.sol";
import "../Interfaces.sol";

contract Delegated is IDelegated, Owned {

    using ListLib for ListLib.AddressList;

    ListLib.AddressList delegates;

    function initialize (address _owner, address[] delegateList) public {
        owner = _owner;
        for(uint i = 0; i < delegateList.length; i++)
            delegates.add(delegateList[i]);
    }

    function getDelegates () public view returns (address[]) {
        return delegates.array;
    }
    
    function totalDelegates () public view returns (uint) {
        return delegates.getLength();
    }
    
    function isDelegate (address account) public view returns (bool) {
        return delegates.contains(account);
    }
    
    function addDelegate (address account) public onlyOwner {
        delegates.add(account);
    }
    
    function removeDelegate (address account) public onlyOwner {
        delegates.remove(account);
    }

    modifier onlyDelegates () {
        require(isDelegate(msg.sender), "not a delegate");
        _;
    }

}

contract DelegatedWallet is IDelegatedWallet, Delegated {
    
    bool initialized;

    ITokenSender public tokenCore;

    function initialize (
        address _owner, 
        TokenCore _tokenCore,
        address[] _delegateList
    ) public {
        require(!initialized, "contract is already initialized");
        
        owner = _owner;
        tokenCore = _tokenCore;

        for(uint i = 0; i < _delegateList.length; i++)
            delegates.add(_delegateList[i]);

        initialized = true;
    }
    
    function transfer (
        address token, 
        address recipient, 
        uint amount
    ) public onlyDelegates returns (bool) {
        return tokenCore.transfer(token, recipient, amount);
    }

    function transferTokenCore (address newOwner) public onlyOwner {
        TokenCore(tokenCore).transferOwnership(newOwner);
    }
    
}

contract DelegatedWalletFactory is CloneFactory {
    
    uint public blockCreated = block.number;
    
    TokenCore public tokenCoreBlueprint;
    DelegatedWallet public delegatedWalletBlueprint;
    
    constructor (TokenCore _tokenCoreBlueprint, DelegatedWallet _walletBlueprint) public {
        tokenCoreBlueprint = _tokenCoreBlueprint;
        delegatedWalletBlueprint = _walletBlueprint;
    }
    
    function createDelegatedWallet (address owner, address[] delegateList) public returns (DelegatedWallet) {
        TokenCore tokenCore = TokenCore(createClone(tokenCoreBlueprint));
        DelegatedWallet delegateWallet = DelegatedWallet(createClone(delegatedWalletBlueprint));

        tokenCore.initialize(delegateWallet);
        delegateWallet.initialize(owner, tokenCore, delegateList);
        
        emit NewWallet_event(owner, delegateWallet);
    }
    
    event NewWallet_event (address indexed creator, address walletAddress);
    
}

contract DelegatedWalletManager is Owned {
    
    using ListLib for ListLib.AddressList;

    mapping (address => ListLib.AddressList) wallets;

    function createWallet (
        DelegatedWalletFactory factory,
        address[] delegateList
    ) public returns (DelegatedWallet) {
        DelegatedWallet wallet = factory.createDelegatedWallet(msg.sender, delegateList);
        wallets[msg.sender].add(wallet);
        
        return wallet;
    }

    function addWallet (IDelegatedWallet wallet) public {
        wallets[msg.sender].add(wallet);
    }

    function removeWallet (IDelegatedWallet wallet) public {
        wallets[msg.sender].remove(wallet);
    }

    function getWallets (address account) public view returns (address[]) {
        return wallets[account].array;
    }
    
}
