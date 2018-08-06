pragma solidity ^0.4.23;

import "Interfaces.sol";

contract AlarmClock is IAlarmClock {
    
    SchedulerInterface public alarmScheduler; // This interface is provided by Ethereum Alarm Clock
    IDelegatedWallet public target;
    address public token;
    
    uint public windowStart;        // The payment can be executed after the 'windowStart' timestamp
    uint public windowSize;         // The payment has 'windowSize' seconds to be executed or it fails
    uint public intervalSize;       // The number of seconds in between payments
    uint public maximumIntervals;   // The number of recurring payments to make
    uint public currentInterval;    // The current interval this payment is on
    uint public gas;                // The amount of gas to call the transaction with
    uint public safetyMultiplier;   // A multiplier used when calculating `getNextAlarmCost()`
    
    bytes public callData;
    
    function init (
        SchedulerInterface _alarmScheduler,
        IDelegatedWallet _target, 
        uint[7] _options,
        bytes _callData
    ) public {
        require(owner == address(0x0));
        
        owner == msg.sender;
        
        alarmScheduler = _alarmScheduler;
        target = _target;
        
        windowStart = _options[0];
        windowSize = _options[1];
        intervalSize = _options[2];
        maximumIntervals = _options[3];
        currentInterval = _options[4];
        gas = _options[5];
        safetyMultiplier = _options[6];
        
        callData = _callData;
    }
    
    function setNextAlarm () public payable onlyOwner returns (address) {
        if(currentInterval < maximumIntervals) {
            if(currentInterval > 0)
                windowStart = windowStart + intervalSize;
        }
        
        currentInterval++;
        
        uint onePercent = msg.value / 100;
        uint callBounty = msg.value - onePercent;
        return alarmScheduler.schedule.value(msg.value)(
            target,             // toAddress
            callData,           // callData
            [
                gas,            // The amount of gas to be sent with the transaction.
                0,              // The amount of ether to be sent.
                windowSize,     // The size of the execution window.
                windowStart,    // The start of the execution window.
                0,              // The minimum gas price for the alarm when called
                onePercent,     // A fee that goes to maintaining and the EAC protocol
                callBounty,     // The payment for the account that triggers this alarm.
                0               // The required amount of wei the caller must deposit before triggering.
            ]
        );
    }
    
    function getNextAlarmCost() public view returns (uint) {
        uint endowment = alarmScheduler.computeEndowment(
            0,          // How much ether to give to the account that triggers the alarm
            0,          // How much ether do donate to the protocol
            gas,        // The amount of gas needed to execute a recurring payment
            0,          // How much ether to send when the alarm triggers
            tx.gasprice // The gas price used when calculating the endowment
        );
        
        return endowment * safetyMultiplier / 1 ether;
    }
    
}