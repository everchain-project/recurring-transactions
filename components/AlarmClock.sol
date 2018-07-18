pragma solidity ^0.4.23;

import "components/Interfaces.sol";

contract AlarmClock is IAlarmClock {
    
    SchedulerInterface public alarmScheduler;
    IPriceOracle public priceOracle;
    IDelegatedWallet public target;
    
    uint public windowStart;        // The payment can be executed after the 'windowStart' timestamp
    uint public windowSize;         // The payment has 'windowSize' seconds to be executed or it fails
    uint public intervalSize;       // The number of seconds in between payments
    uint public maximumIntervals;   // The number of recurring payments to make
    uint public currentInterval;    // The current interval this payment is on
    uint public gas;                // The amount of gas to call the transaction with
    
    bytes public callData;
    
    function init (
        SchedulerInterface _alarmScheduler,
        IPriceOracle _priceOracle,
        IDelegatedWallet _target, 
        uint[6] _options,
        bytes _callData
    ) public {
        require(target == address(0x0));
        
        alarmScheduler = _alarmScheduler;
        priceOracle = _priceOracle;
        target = _target;
        
        windowStart = _options[0];
        windowSize = _options[1];
        intervalSize = _options[2];
        maximumIntervals = _options[3];
        currentInterval = _options[4];
        gas = _options[5];
        
        callData = _callData;
    }
    
    function setNextAlarm () public payable onlyOwner returns (address) {
        if(currentInterval < maximumIntervals) {
            if(currentInterval > 0)
                windowStart = windowStart + intervalSize;
        }
        
        currentInterval++;
        
        uint gasPrice = priceOracle.gasPrice(windowStart);
        return alarmScheduler.schedule.value(msg.value)(
            target,             // toAddress
            callData,           // callData
            [
                gas,            // The amount of gas to be sent with the transaction.
                0,              // The amount of wei to be sent.
                windowSize,     // The size of the execution window.
                windowStart,    // The start of the execution window.
                gasPrice,       // The gasprice for the transaction
                gasPrice * 10,  // A fee that goes to maintaining and upgrading the EAC protocol
                gasPrice * 10,  // The payment for the claimer that triggers this alarm.
                gasPrice * 10   // The required amount of wei the claimer must send as deposit.
            ]
        );
    }
    
    function getNextAlarmCost() public view returns (uint) {
        uint gasPrice = priceOracle.gasPrice(windowStart + intervalSize);
        return alarmScheduler.computeEndowment(
            gasPrice * 10, 
            gasPrice * 10,
            gas,
            0, 
            gasPrice
        );
    }
    
}