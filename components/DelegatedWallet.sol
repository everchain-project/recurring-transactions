pragma solidity ^0.4.23;

import "import/Owned.sol";
import "import/ERC20.sol";
import "components/Interfaces.sol";

contract Delegated is Owned {
    
    address[] public delegateArray;
    mapping (address => bool) public delegateLookup;
    
    function delegates () public view returns (address[]) {
        return delegateArray;
    }
    
    function totalDelegates () public view returns (uint) {
        return delegateArray.length;
    }
    
    function isDelegate (address account) public view returns(bool) {
        return delegateLookup[account];
    }
    
    function addDelegate (address account) public onlyOwner {
        if(!isDelegate(account)){
            delegateArray.push(account);
            delegateLookup[account] = true;
        }
    }
    
    function removeDelegate (uint index) public onlyOwner {
        require(index < delegateArray.length);
        
        address account = delegateArray[index];
        address replacement = delegateArray[delegateArray.length-1]; // The last value in the list
        delegateArray[index] = replacement;
        delegateArray.length--;
        delegateLookup[account] = false;
    }
    
}

contract DelegatedWallet is IDelegatedWallet, Delegated {
    
    struct Trigger {
        address target;
        bytes4 callData;
    }
    
    uint public blockCreated = block.number;
    mapping (address => Trigger) public triggers;
    
    function transfer (address recipient, address token, uint amount) public returns (bool success) {
        require(isDelegate(msg.sender));
        
        if(token == address(0x0))
            success = recipient.send(amount);
        else
            success = ERC20(token).transfer(recipient, amount);
        
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

contract DelegatedWalletFactory {
    
    uint public blockCreated = block.number;
    
    function createWallet () public returns (DelegatedWallet) {
        DelegatedWallet wallet = new DelegatedWallet();
        wallet.transferOwnership(msg.sender);
        
        emit Creation_event(msg.sender, wallet);
        
        return wallet;
    }
    
    event Creation_event (address indexed creator, address walletAddress);
    
}
