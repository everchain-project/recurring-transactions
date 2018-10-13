pragma solidity ^0.4.23;

import "../../external/CloneFactory.sol";
import "./FuturePaymentDelegate.sol";

contract FuturePaymentDelegateFactory is CloneFactory {
    
    uint public blockCreated;
    
    FuturePaymentDelegate public blueprint;
    
    constructor (FuturePaymentDelegate _blueprint) public {
        blockCreated = block.number;
        blueprint = _blueprint;
    }
    
    function createDelegate (address owner, address[] schedulerList) public returns (FuturePaymentDelegate delegate) {
        delegate = FuturePaymentDelegate(createClone(blueprint));
        delegate.initialize();

        for(uint i = 0; i < schedulerList.length; i++)
            delegate.addScheduler(schedulerList[i]);
        
        emit CreateDelegate_event(msg.sender, owner, delegate);
    }
    
    event CreateDelegate_event (
        address indexed caller, 
        address indexed owner, 
        address delegateAddress
    );
    
}
