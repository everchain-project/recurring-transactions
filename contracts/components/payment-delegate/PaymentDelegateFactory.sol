pragma solidity ^0.4.23;

import "../../external/CloneFactory.sol";
import "./PaymentDelegate.sol";

contract PaymentDelegateFactory is CloneFactory {
    
    uint public blockCreated;
    
    PaymentDelegate public blueprint;
    
    constructor (PaymentDelegate _blueprint) public {
        blockCreated = block.number;
        blueprint = _blueprint;
    }
    
    function createDelegate (address owner, address[] schedulerList) public returns (PaymentDelegate delegate) {
        delegate = PaymentDelegate(createClone(blueprint));
        delegate.initialize(this);

        for(uint i = 0; i < schedulerList.length; i++)
            delegate.addScheduler(schedulerList[i]);
        
        delegate.transferOwnership(owner);
        
        emit CreateDelegate_event(msg.sender, owner, delegate);
    }
    
    event CreateDelegate_event (
        address indexed caller, 
        address indexed owner, 
        address delegateAddress
    );
    
}
