pragma solidity ^0.4.23;

import "../components/recurring-alarm-clock/RecurringAlarmClockFactory.sol";

contract RecurringAlarmClockAssistant {
    
    RecurringAlarmClockFactory public Factory;
    address public priorityCaller;
    uint public safetyMultiplier = 10^18;

    constructor (
        address everchain, 
        RecurringAlarmClockFactory factory
    ) public {
        priorityCaller = everchain;
        Factory = factory;
    }

    function createRecurringAlarmClock(
        IPaymentDelegate delegate,
        IDelegatedWallet wallet,
        uint startTimestamp,
        uint totalPayments,
        uint period,
        uint gas
    ) public returns (RecurringAlarmClock) {
        uint[3] memory recurringAlarmClockOptions = [
            safetyMultiplier,
            period,
            totalPayments
        ];

        uint[10] memory ethereumAlarmClockOptions = [
            60 minutes,     // claimWindowSize
            3 minutes,      // freezePeriod
            5 minutes,      // reservedWindowSize
            2,              // 2 = Use timestamp based scheduling instead of blocks
            24 hours,       // The size of the execution window
            startTimestamp, // The start of the execution window
            gas,            // The amount of gas to be sent with the transaction
            0,              // The amount of ether to be sent
            0,              // The minimum gas price for the alarm when called
            0               // The required deposit by the claimer
        ];
        
        return Factory.createRecurringAlarmClock(
            delegate,
            wallet,
            priorityCaller,
            "",
            recurringAlarmClockOptions,
            ethereumAlarmClockOptions
        );
    }

}
