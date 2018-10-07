pragma solidity ^0.4.23;

import "../external/CloneFactory.sol";
import "../utility/AddressListFactory.sol";
import "../FuturePaymentDelegate.sol";

contract FuturePaymentDelegateFactory is CloneFactory {
    
    uint public blockCreated;
    
    FuturePaymentDelegate public blueprint;
    AddressListFactory public listFactory;
    
    constructor (FuturePaymentDelegate _blueprint, AddressListFactory _listFactory) public {
        blockCreated = block.number;

        blueprint = _blueprint;
        listFactory = _listFactory;
    }
    
    function createDelegate (address owner, address[] _trustedSchedulers) public returns (FuturePaymentDelegate delegate) {
        AddressList trustedSchedulers = listFactory.createAddressList(owner, _trustedSchedulers);
        delegate = FuturePaymentDelegate(createClone(blueprint));
        delegate.initialize(listFactory, trustedSchedulers);
        
        emit CreateDelegate_event(msg.sender, owner, delegate);
    }
    
    event CreateDelegate_event (
        address indexed caller, 
        address indexed owner, 
        address delegateAddress
    );
    
}
