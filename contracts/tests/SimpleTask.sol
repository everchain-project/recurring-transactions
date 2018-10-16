pragma solidity ^0.4.23;

import "../external/Owned.sol";
import "../Interfaces.sol";

contract SimpleTask is Owned, ITask {

    uint public blockInitialized;

    IRecurringAlarmClock public alarmClock;

    function initialize (address _owner, IRecurringAlarmClock _alarmClock) public {
        blockInitialized = block.number;

        alarmClock = _alarmClock;
        owner = _owner;
    }

    function () public {
        require(msg.sender == address(alarmClock), "only the alarmClock can call the task");

        emit Task_event();
    }

    function cancel () public onlyOwner {
        alarmClock.cancel();
    }

    event Task_event();

}