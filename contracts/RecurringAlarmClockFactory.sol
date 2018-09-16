pragma solidity ^0.4.23;

import "./RecurringAlarmClock.sol";

contract RecurringAlarmClockFactory is CloneFactory {
    
    RequestFactoryInterface public ethereumAlarmClock;
    RecurringAlarmClock public recurringAlarmClockBlueprint;

    constructor (RequestFactoryInterface _ethereumAlarmClock, RecurringAlarmClock _recurringAlarmClockBlueprint) public {
        ethereumAlarmClock = _ethereumAlarmClock;
        recurringAlarmClockBlueprint = _recurringAlarmClockBlueprint;
    }

    function createRecurringAlarmClock(
        ITask task,
        ITokenSender changeAddress,
        IFuturePaymentDelegate delegate,
        address feeRecipient,
        address token,
        uint[3] recurringAlarmClockOptions,
        uint[10] ethereumAlarmClockOptions
    ) public returns (RecurringAlarmClock) {
        RecurringAlarmClock recurringAlarmClock = RecurringAlarmClock(createClone(recurringAlarmClockBlueprint));
        
        recurringAlarmClock.initialize(
            task,
            changeAddress,
            delegate,
            ethereumAlarmClock,
            feeRecipient,
            token,
            recurringAlarmClockOptions,
            ethereumAlarmClockOptions
        );

        return recurringAlarmClock;
    }

}
