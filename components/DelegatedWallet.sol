pragma solidity ^0.4.23;

import "import/ERC20.sol";
import "import/LibList.sol";
import "import/CloneFactory.sol";
import "Interfaces.sol";

contract Delegated is Owned {
    
    using LibList for LibList.AddressList;
    
    LibList.AddressList delegates;
    
    function getDelegates () public view returns (address[]) {
        return delegates.array;
    }
    
    function totalDelegates () public view returns (uint) {
        return delegates.getLength();
    }
    
    function isDelegate (address account) public view returns(bool) {
        return delegates.contains(account);
    }
    
    function addDelegate (address account) public onlyOwner {
        delegates.add(account);
    }
    
    function removeDelegate (address account) public onlyOwner {
        delegates.remove(account);
    }
    
}

contract DelegatedWallet is IDelegatedWallet, Delegated {
    
    uint public blockCreated = block.number;
    
    struct Trigger {
        address target;
        bytes4 callData;
    }

    mapping (address => Trigger) public triggers;
    
    mapping (address => uint) public allowance;
    
    function init () public {
        owner = msg.sender;
    }
    
    function transfer (address token, address recipient, uint amount) public returns (bool success) {
        require(isDelegate(msg.sender));
        
        if(token == address(0x0))
            success = recipient.send(amount);
        else
            success = ERC20(token).transfer(recipient, amount);
        
        emit Transfer_event(msg.sender, token, recipient, amount, success);
    }
    
    function approve (address token, address recipient, uint amount) public returns (bool success) {
        require(isDelegate(msg.sender));
        
        if(token == address(0x0)){
            allowance[recipient] += amount;
        } else {
            ERC20 Token = ERC20(token);
            uint currentAllowance = Token.allowance(this, recipient);
            uint expectedAllowance = currentAllowance + amount;
            Token.approve(recipient, amount);
            uint newAllowance = Token.allowance(this, recipient);
            if(newAllowance != expectedAllowance)
                Token.approve(this, expectedAllowance);
        }
        
        success = true;
        emit Transfer_event(msg.sender, token, recipient, amount, success);
    }

    function registerTrigger (address caller, address target, bytes4 callData) public {
        require(isDelegate(msg.sender));
        require(caller != address(0x0));
        require(target != address(0x0));
        require(triggers[caller].target == address(0x0));
        
        triggers[caller] = Trigger(target, callData);
        
        emit Register_event(msg.sender, caller, target, callData);
    }
    
    function trigger_internal (address caller) internal {
        address target = triggers[caller].target;
        require(target != address(0x0));
        
        emit Trigger_event(
            caller, 
            target, 
            target.call(
                triggers[caller].callData, 
                caller
            )
        );
        
        delete triggers[caller];
    }
    
    function () public payable {
        if(msg.value > 0)
            emit Deposit_event(msg.sender, msg.value);
        else 
            trigger_internal(msg.sender);
    }
    
    event Transfer_event (address delegate, address token, address recipient, uint amount, bool success);
    event Register_event(address delegate, address trigger, address target, bytes4 callData);
    event Trigger_event(address caller, address target, bool success);
    event Deposit_event (address sender, uint amount);
    
}

contract DelegatedWalletFactory is CloneFactory {
    
    uint public blockCreated = block.number;
    
    address public walletBlueprint;
    
    constructor (address _walletBlueprint) public {
        walletBlueprint = _walletBlueprint;
    }
    
    function createWallet () public returns (IDelegatedWallet) {
        DelegatedWallet wallet = DelegatedWallet(createClone(walletBlueprint));
        wallet.init();
        wallet.transferOwnership(msg.sender);
        
        emit NewWallet_event(msg.sender, wallet);
        
        return wallet;
    }
    
    event NewWallet_event (address indexed creator, address walletAddress);
    
}

contract DelegatedWalletManager is Owned {
    
    using LibList for LibList.AddressList;
    
    DelegatedWalletFactory public Factory = DelegatedWalletFactory(0x0);
    
    mapping (address => LibList.AddressList) wallets;
    
    function createWallet (address[] delegates) public returns (address) {
        IDelegatedWallet wallet = Factory.createWallet();
        
        for(uint i = 0; i < delegates.length; i++)
            wallet.addDelegate(delegates[i]);
        
        wallet.transferOwnership(msg.sender);
        wallets[msg.sender].add(wallet);
        
        return wallet;
    }
    
    function getWallets (address account) public view returns (address[]) {
        return wallets[account].array;
    }
    
    function updateFactory (DelegatedWalletFactory newFactory) public onlyOwner {
        Factory = newFactory;
    }
    
}