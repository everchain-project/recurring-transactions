pragma solidity ^0.4.23;

import "../../external/CloneFactory.sol";
import "./PaymentDelegate.sol";

/// @title PaymentDelegateFactory Contract
/// @author Joseph Reed
/// @dev This contract's goal is to create payment delegates
contract PaymentDelegateFactory is CloneFactory {
    
    uint public blockCreated;           // records the block when the contract is created
    
    PaymentDelegate public blueprint;   // The payment delegate blueprint to supply the clone factory
    
    /// @notice Constructor to create a PaymentDelegateFactory
    /// @param _blueprint payment delegate blueprint 
    constructor (PaymentDelegate _blueprint) public {
        blockCreated = block.number;
        blueprint = _blueprint;
    }
    
    /// @notice Create a newly deployed Payment Delegate with a predefined list of trusted schedulers
    /// @param owner The owner of the Payment Delegate
    /// @param schedulerList the list of schedulers to add to the payment delegate
    function createDelegate (address owner, address[] schedulerList) public returns (PaymentDelegate delegate) {
        delegate = PaymentDelegate(createClone(blueprint));
        delegate.initialize(this);

        for(uint i = 0; i < schedulerList.length; i++)
            delegate.addScheduler(schedulerList[i]);
        
        delegate.transferOwnership(owner);
        
        emit CreateDelegate_event(msg.sender, owner, delegate, schedulerList);
    }
    
    event CreateDelegate_event (
        address indexed caller, 
        address indexed owner, 
        address delegateAddress,
        address[] schedulers
    );
    
}
