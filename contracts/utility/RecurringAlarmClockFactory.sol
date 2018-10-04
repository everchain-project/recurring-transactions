pragma solidity ^0.4.23;

import "../external/CloneFactory.sol";
import "../RecurringAlarmClock.sol";

contract RecurringAlarmClockFactory is CloneFactory {

    RequestFactoryInterface public ethereumAlarmClock;
    RecurringAlarmClock public alarmClockBlueprint;

    constructor (
        RequestFactoryInterface _ethereumAlarmClock, 
        RecurringAlarmClock _alarmClockBlueprint
    ) public {
        ethereumAlarmClock = _ethereumAlarmClock;
        alarmClockBlueprint = _alarmClockBlueprint;
    }

    function createRecurringAlarmClock(
        IFuturePaymentDelegate delegate,
        address wallet,
        address priorityCaller,
        uint[3] recurringAlarmClockOptions,
        uint[10] ethereumAlarmClockOptions
    ) public returns (RecurringAlarmClock) {
        RecurringAlarmClock recurringAlarmClock = RecurringAlarmClock(createClone(alarmClockBlueprint));
        recurringAlarmClock.initialize(
            ethereumAlarmClock,
            delegate,
            wallet,
            priorityCaller,
            recurringAlarmClockOptions,
            ethereumAlarmClockOptions
        );

        return recurringAlarmClock;
    }

}
