pragma solidity ^0.4.23;

import "../external/Owned.sol";
import "../libraries/ListLib.sol";
import "../Interfaces.sol";

contract AddressList is Owned {

    bool public initialized;

    using ListLib for ListLib.AddressList;

    ListLib.AddressList addresses;

    function initialize (address _owner, address[] list) public {
        require(!initialized, "contract can only be initialized once");

        owner = _owner;

        for(uint i = 0; i < list.length; i++)
            addresses.add(list[i]);

        initialized = true;
    }

    function get () public view returns (address[]) {
        return addresses.get();
    }

    function index (uint i) public view returns (address) {
        return addresses.index(i);
    }
    
    function indexOf (address account) public view returns (uint) {
        return addresses.getIndexOf(account);
    }
    
    function length () public view returns (uint) {
        return addresses.array.length;
    }
    
    function contains (address account) public view returns (bool) {
        return addresses.contains(account);
    }
    
    function add (address account) public onlyOwner returns (bool) {
        return addresses.add(account);
    }
    
    function remove (address account) public onlyOwner returns (bool) {
        return addresses.remove(account);
    }
    
}
