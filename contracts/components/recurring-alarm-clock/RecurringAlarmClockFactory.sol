pragma solidity ^0.4.23;

import "../../external/CloneFactory.sol";
import "../../Interfaces.sol";
import "./RecurringAlarmClock.sol";

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
        IPaymentDelegate delegate,
        IDelegatedWallet wallet,
        address priorityCaller,
        bytes callData,
        uint[3] recurringAlarmClockOptions,
        uint[10] ethereumAlarmClockOptions
    ) public returns (RecurringAlarmClock recurringAlarmClock) {
        recurringAlarmClock = RecurringAlarmClock(createClone(alarmClockBlueprint));
        recurringAlarmClock.initialize(
            ethereumAlarmClock,
            delegate,
            wallet,
            priorityCaller,
            callData,
            recurringAlarmClockOptions,
            ethereumAlarmClockOptions
        );
    }

}
