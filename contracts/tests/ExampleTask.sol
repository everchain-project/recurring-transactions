pragma solidity ^0.5.0;

import "../external/Owned.sol";
import "../Interfaces.sol";

/// @title ExampleTask Contract
/// @author Joseph Reed
/// @dev This contract is a simple example task that waits for the executor
///      to call the default function thus emitting an event.
contract ExampleTask {

    uint public blockCreated;   // records the block when the contract is created

    IRecurringAlarmClock public alarmClock;    // The executor is allowed to call the task

    /// @notice Initializes the task
    /// @param _alarmClock The alarm clock with exclusive permission to trigger an event
    constructor (IRecurringAlarmClock _alarmClock) public {
        blockCreated = block.number;
        alarmClock = _alarmClock;
    }

    /// @notice Every time the alarm clock is triggered it calls the default function and emits an event
    function () external {
        require(msg.sender == address(alarmClock), "only the alarm clock can trigger the task");

        emit Task_event();
    }

    event Task_event();

}