pragma solidity ^0.4.23;

import "../external/Owned.sol";
import "../external/ERC20.sol";
import "../Interfaces.sol";

contract TokenCore is Owned, ITokenSender {
    
    uint public blockCreated;
    
    function initialize (address _owner) public {
        require(blockCreated == 0, "contract already initialized");
        
        blockCreated = block.number;
        owner = _owner;
    }
    
    function transfer (
        address token, 
        address recipient, 
        uint amount
    ) public onlyOwner returns (bool success) {
        
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
