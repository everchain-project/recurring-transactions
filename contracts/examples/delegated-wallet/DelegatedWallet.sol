pragma solidity ^0.4.23;

import "../../external/ERC20.sol";
import "../../external/Owned.sol";
import "../../libraries/ListLib.sol";
import "../../Interfaces.sol";

contract DelegatedWallet is IDelegatedWallet, Owned {
    
    uint public blockCreated;

    using ListLib for ListLib.AddressList;

    ListLib.AddressList delegates;
    
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
        require(isDelegate(msg.sender) || msg.sender == owner, "not a delegate");
        _;
    }
    
    function () public payable {
        emit Deposit_event(msg.sender, msg.value);
    }
    
    event Deposit_event (address sender, uint amount);
    event Transfer_event (address delegate, address token, address recipient, uint amount, bool success);
    
}

