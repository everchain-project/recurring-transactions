pragma solidity ^0.4.23;

import "../external/CloneFactory.sol";
import "./AddressList.sol";

contract AddressListFactory is CloneFactory {

    AddressList public blueprint;

    constructor (AddressList _blueprint) public {
        blueprint = _blueprint;
    }

    function createAddressList (address owner, address[] delegateList) public returns (AddressList) {
        AddressList addressList = AddressList(createClone(blueprint));
        addressList.initialize(owner, delegateList);
        emit CreateAddressList_event(msg.sender, owner, addressList);
        
        return addressList;
    }
    
    event CreateAddressList_event(address indexed caller, address indexed owner, AddressList addressList);
}
