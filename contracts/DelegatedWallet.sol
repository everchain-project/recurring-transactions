pragma solidity ^0.4.23;

import "./external/Owned.sol";
import "./external/CloneFactory.sol";
import "./TokenCore.sol";
import "./Interfaces.sol";
import "./ListLib.sol";

contract Delegates is IDelegates, Owned {

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

}

contract Delegated is Owned {

    Delegates public delegates;
    
    function changeDelegates (Delegates newDelegates) public onlyOwner {
        delegates = newDelegates;
    }

    function isDelegate (address account) public view returns (bool) {
        return delegates.isDelegate(account);
    }

    modifier onlyDelegates () {
        require(isDelegate(msg.sender), "not a delegate");
        _;
    }
}

contract DelegatedWallet is Delegated, hasTokenCore {
    
    bool initialized;

    function initialize (
        address _owner, 
        TokenCore _tokenCore, 
        Delegates _delegates
    ) public {
        require(!initialized, "contract is already initialized");
        
        owner = _owner;
        tokenCore = _tokenCore;
        delegates = _delegates;

        initialized = true;
    }
    
    function transfer (
        address token, 
        address recipient, 
        uint amount
    ) public onlyDelegates returns (bool) {
        return tokenCore.transfer(token, recipient, amount);
    }
    
}

contract DelegatedWalletFactory is CloneFactory {
    
    uint public blockCreated = block.number;
    
    address public tokenCoreBlueprint;
    address public delegatesBlueprint;
    address public delegatedWalletBlueprint;
    
    constructor (
        address _tokenCoreBlueprint, 
        address _delegatesBlueprint, 
        address _walletBlueprint
    ) public {
        tokenCoreBlueprint = _tokenCoreBlueprint;
        delegatesBlueprint = _delegatesBlueprint;
        delegatedWalletBlueprint = _walletBlueprint;
    }
    
    function create (address owner, address[] delegateList) public returns (DelegatedWallet wallet) {
        wallet = DelegatedWallet(createClone(delegatedWalletBlueprint));
        TokenCore tokenCore = TokenCore(createClone(tokenCoreBlueprint));
        Delegates delegates = Delegates(createClone(delegatesBlueprint));

        tokenCore.initialize(wallet);
        delegates.initialize(owner, delegateList);
        wallet.initialize(owner, tokenCore, delegates);
        
        emit NewWallet_event(owner, wallet);
    }
    
    event NewWallet_event (address indexed creator, address walletAddress);
    
}

contract DelegatedWalletManager is Owned {
    
    using ListLib for ListLib.AddressList;
    
    DelegatedWalletFactory public factory;

    mapping (address => ListLib.AddressList) wallets;
    mapping (address => bool) public verified;

    constructor (address _factory) public {
        factory = DelegatedWalletFactory(_factory);
    }

    function getWallets (address account) public view returns (address[]) {
        return wallets[account].array;
    }

    function createWallet (address[] delegateList) public returns (address) {
        DelegatedWallet wallet = factory.create(this, delegateList);
        wallets[msg.sender].add(wallet);
        verified[wallet] = true;
        
        return wallet;
    }

    function addWallet (address wallet) public {
        require(wallets[msg.sender].add(wallet));
    }

    function removeWallet (address wallet) public {
        require(wallets[msg.sender].remove(wallet));

        Owned(wallet).transferOwnership(msg.sender);
    }

    function transferWallet (address wallet, address newOwner) public {
        require(verified[wallet]);
        require(wallets[msg.sender].remove(wallet));
        require(wallets[newOwner].add(wallet));
    }
    
    function updateFactory (DelegatedWalletFactory newFactory) public onlyOwner {
        factory = newFactory;
    }
    
}
