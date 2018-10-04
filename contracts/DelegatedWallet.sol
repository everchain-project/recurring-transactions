pragma solidity ^0.4.23;

import "./external/Owned.sol";
import "./external/ERC20.sol";
import "./utility/AddressList.sol";
import "./Interfaces.sol";

contract DelegatedWallet is Owned, IDelegated, ITokenSender, ITokenReceiver {

    uint public blockCreated;

    AddressList public delegates;

    function initialize (address _owner, AddressList _delegates) public {
        require(blockCreated == 0, "contract already initialized");
        
        owner = _owner;
        delegates = _delegates;

        blockCreated = block.number;
    }

    function transfer (address token, address recipient, uint amount) public onlyDelegates returns (bool success) {
        if(token == address(0x0))
            success = recipient.send(amount);
        else
            success = ERC20(token).transfer(recipient, amount);
        
        emit Transfer_event(msg.sender, token, recipient, amount, success);
    }

    function replaceDelegates (AddressList newDelegates) public onlyOwner {
        delegates = newDelegates;
    }

    function isDelegate (address _address) public view returns (bool) {
        return delegates.contains(_address);
    }

    function () public payable {
        emit Deposit_event(msg.sender, msg.value);
    }

    modifier onlyDelegates () {
        require(isDelegate(msg.sender), "only a delegate can transfer tokens out of the wallet");
        _;
    }

    event Deposit_event (
        address indexed sender, 
        uint amount
    );

    event Transfer_event (
        address indexed delegate, 
        address indexed token, 
        address indexed recipient, 
        uint amount, 
        bool success
    );

}
