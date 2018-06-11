pragma solidity ^0.4.23;

import "Owned.sol";
import "ERC20.sol";

contract Delegated is Owned {
    
    address[] public delegates;
    mapping (address => bool) public isDelegate;
    
    function totalDelegates () public view returns (uint) {
        return delegates.length;
    }
    
    function addDelegate (address account) public onlyOwner {
        if(!isDelegate[account]){
            delegates.push(account);
            isDelegate[account] = true;
        }
    }
    
    function removeDelegate (uint index) public onlyOwner {
        require(index < delegates.length);
        
        address account = delegates[index];
        address replacement = delegates[delegates.length-1]; // The last value in the list
        delegates[index] = replacement;
        delegates.length--;
        isDelegate[account] = false;
    }
    
}

contract EverchainWallet is Delegated {
    
    uint public blockCreated = block.number;
    mapping (address => address) public alarms;
    
    function transfer (address token, address recipient, uint amount) public returns (bool success) {
        require(isDelegate[msg.sender]);
        
        if(token == address(0x0))
            success = recipient.send(amount);
        else
            success = ERC20(token).transfer(recipient, amount);
        
        emit Transfer_event(msg.sender, token, recipient, amount, success);
    }

    function registerAlarm (address alarm) public {
        require(isDelegate[msg.sender]);
        
        alarms[alarm] = msg.sender;
        
        emit Register_event(msg.sender, alarm);
    }
    
    function forwardAlarm_internal () internal {
        address delegate = alarms[msg.sender];
        require(delegate != address(0x0));
        
        emit Alarm_event(
            msg.sender, 
            delegate, 
            delegate.call(
                bytes4(keccak256("_alarm(address)")), 
                msg.sender
            )
        );
    }
    
    function () public payable {
        if(msg.value > 0)
            emit Deposit_event(msg.sender, msg.value);
        else 
            forwardAlarm_internal();
    }
    
    event Register_event(address delegate, address alarm);
    event Alarm_event(address alarm, address delegate, bool success);
    event Transfer_event (address delegate, address token, address recipient, uint amount, bool success);
    event Deposit_event (address sender, uint amount);
    
}

contract DelegatedWalletFactory {
    
    uint public blockCreated = block.number;
    
    function createWallet () public returns (EverchainWallet) {
        EverchainWallet wallet = new EverchainWallet();
        wallet.transferOwnership(msg.sender);
        
        emit Wallet_event(msg.sender, wallet);
        
        return wallet;
    }
    
    event Wallet_event (address indexed creator, address walletAddress);
    
}
