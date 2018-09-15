pragma solidity ^0.4.23;

import "../../external/ERC20.sol";
import "../../Interfaces.sol";
import "./Delegated.sol";

contract DelegatedWallet is IDelegatedWallet, Delegated {
    
    uint public blockCreated;
    
    function initialize () public {
        require(blockCreated == 0, "contract already initialized");
        
        owner = msg.sender;

        blockCreated = block.number;
    }
    
    function transfer (
        address token, 
        address recipient, 
        uint amount
    ) public onlyDelegates returns (bool success) {
        if(token == address(0x0))
            success = recipient.send(amount);
        else
            success = ERC20(token).transfer(recipient, amount);
        
        emit Transfer_event(msg.sender, token, recipient, amount, success);
    }
    
    function () public payable {
        emit Deposit_event(msg.sender, msg.value);
    }
    
    event Deposit_event (address sender, uint amount);
    event Transfer_event (address delegate, address token, address recipient, uint amount, bool success);
    
}

