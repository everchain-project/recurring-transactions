pragma solidity ^0.4.23;

import "PaymentScheduler.sol";

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
    
    bytes4 public callData;
    
    function init (IDelegatedWallet _target, uint[6] options) public {
        require(target == address(0x0));
        
        target = _target;
        windowStart = options[0];
        windowSize = options[1];
        intervalSize = options[2];
        maximumIntervals = options[3];
        currentInterval = options[4];
        gas = options[5];
    }
    
    function setNextAlarm () public payable onlyOwner returns (address) {
        if(currentInterval < maximumIntervals) {
            if(currentInterval > 0)
                windowStart = windowStart + intervalSize;
        }
        
        currentInterval++;
        
        return alarmScheduler.schedule.value(msg.value)(
            target,            // toAddress
            "",                // callData
            [
                gas,           // The amount of gas to be sent with the transaction.
                0,             // The amount of wei to be sent.
                windowSize,    // The size of the execution window.
                windowStart,   // The start of the execution window.
                priceOracle.gasPrice(windowStart),        // The gasprice for the transaction
                priceOracle.protocolFee(windowStart),     // A fee that goes to maintaining and upgrading the EAC protocol
                priceOracle.alarmFee(windowStart),        // The payment for the claimer that triggers this alarm.
                priceOracle.claimDeposit(windowStart)     // The required amount of wei the claimer must send as deposit.
            ]
        );
    }
    
    function getNextAlarmCost() public view returns (uint) {
        return alarmScheduler.computeEndowment(
            priceOracle.alarmFee(windowStart + intervalSize), 
            priceOracle.protocolFee(windowStart + intervalSize),
            gas,
            0, 
            priceOracle.gasPrice(windowStart + intervalSize)
        );
    }
    
}