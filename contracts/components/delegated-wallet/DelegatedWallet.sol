pragma solidity ^0.4.23;

import "../../external/ERC20.sol";
import "../../external/Owned.sol";
import "../../libraries/ListLib.sol";
import "../../Interfaces.sol";

contract DelegatedWallet is Owned, IDelegatedWallet {

    uint public blockCreated;
    address public factory;

    using ListLib for ListLib.AddressList;

    ListLib.AddressList delegates;

    function initialize (address _owner) public {
        require(blockCreated == 0, "block created can only be set once");

        blockCreated = block.number;
        factory = msg.sender;

        owner = _owner;
    }

    function transfer (address token, address recipient, uint amount) public onlyDelegates returns (bool success) {
        if(token == address(0x0))
            success = recipient.send(amount);
        else
            success = ERC20(token).transfer(recipient, amount);
        
        emit Transfer_event(msg.sender, token, recipient, amount, success);
    }

    function addDelegate(address delegate) public onlyOwner returns (bool success) {
        success = delegates.add(delegate);
        
        if(success)
            emit AddDelegate_event(delegate);
    }
    
    function removeDelegate(address delegate) public onlyOwner returns (bool success) {
        success = delegates.remove(delegate);
        
        if(success)
            emit RemoveDelegate_event(delegate);
    }

    function isDelegate (address _address) public view returns (bool) {
        return delegates.contains(_address);
    }

    function getDelegates () public view returns (address[]) {
        return delegates.get();
    }

    function index (uint i) public view returns (address) {
        return delegates.index(i);
    }
    
    function indexOf (address delegate) public view returns (uint) {
        return delegates.indexOf(delegate);
    }

    function totalDelegates () public view returns (uint) {
        return delegates.getLength();
    }

    function () public payable {
        emit Deposit_event(msg.sender, msg.value);
    }

    modifier onlyDelegates () {
        require(isDelegate(msg.sender), "only a delegate can transfer tokens out of the wallet");
        _;
    }

    event Deposit_event (address indexed sender, uint amount);
    event AddDelegate_event (address delegate);
    event RemoveDelegate_event (address delegate);
    event Transfer_event (
        address indexed delegate, 
        address indexed token, 
        address indexed recipient, 
        uint amount, 
        bool success
    );

}
