pragma solidity ^0.5.0;

/// @title ExampleTask Contract
/// @author Joseph Reed
/// @dev This contract is a simple example task that waits for an alarm clock
///      to call the default function thus emitting an event.
contract ExampleTask {

    /// @notice Provides an event for a deployed alarm clock to trigger
    function () external {
        emit Task_event(msg.sender);
    }

    event Task_event(address indexed caller);

}