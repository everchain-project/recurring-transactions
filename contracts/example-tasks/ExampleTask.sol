pragma solidity ^0.4.23;

import "../external/Owned.sol";
import "../Interfaces.sol";

/// @title ExampleTask Contract
/// @author Joseph Reed
/// @dev This contract is a simple example task that waits for the executor
///      to call the default function thus emitting an event.
contract ExampleTask {

    uint public blockCreated;   // records the block when the contract is created

    address public executor;    // The executor is allowed to call the task

    /// @notice Initializes the wallet. Uses 'initialize()' instead of a constructor to make use of the clone 
    ///         factory at https://github.com/optionality/clone-factory. In general, 'initialize()' should be  
    ///         called directly following it's deployment through the use of a factory.
    /// @param _executor The alarm clock with exclusive permission to trigger an event
    function initialize (address _executor) public {
        require(blockCreated == 0, "can only initialize once");

        blockCreated = block.number;
        executor = _executor;
    }

    /// @notice Every time the alarm clock is triggered it calls the default function and emits an event
    function () public {
        require(msg.sender == executor, "only the executor can call the task");

        emit Task_event();
    }

    event Task_event();

}