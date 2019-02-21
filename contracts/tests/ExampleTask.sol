pragma solidity ^0.5.0;

/// @title ExampleTask Contract
/// @author Joseph Reed
/// @dev This contract is a simple example task that waits for an alarm clock
///      to call a function thus emitting an example event.
contract ExampleTask {

    function example (string memory message) public payable {
        msg.sender.transfer(msg.value);
        emit Trigger_event(msg.sender, message, msg.value);
    }

    event Trigger_event(address caller, string message, uint msgValue);

}