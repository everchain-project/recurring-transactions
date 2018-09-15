pragma solidity ^0.4.23;

import "../../external/Owned.sol";
import "../../libraries/ListLib.sol";
import "../../Interfaces.sol";

contract Delegated is IDelegated, Owned {

    using ListLib for ListLib.AddressList;

    ListLib.AddressList delegates;

    function initialize (address _owner, address[] delegateList) public {
        owner = _owner;
        for(uint i = 0; i < delegateList.length; i++)
            delegates.add(delegateList[i]);
    }

    function getDelegates () public view returns (address[]) {
        return delegates.array;
    }
    
    function totalDelegates () public view returns (uint) {
        return delegates.getLength();
    }
    
    function isDelegate (address account) public view returns (bool) {
        return delegates.contains(account);
    }
    
    function addDelegate (address account) public onlyOwner {
        delegates.add(account);
    }
    
    function removeDelegate (address account) public onlyOwner {
        delegates.remove(account);
    }

    modifier onlyDelegates () {
        require(isDelegate(msg.sender), "not a delegate");
        _;
    }

}