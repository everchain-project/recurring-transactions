pragma solidity ^0.4.23;

import "../../external/CloneFactory.sol";
import "../../Interfaces.sol";
import "./RecurringAlarmClock.sol";

/// @title RecurringAlarmClockFactory Contract
/// @author Joseph Reed
/// @dev This contract's goal is to create a recurring alarm clocks
contract RecurringAlarmClockFactory is CloneFactory {

    RequestFactoryInterface public ethereumAlarmClock;  // The contract responsible for deploying decentralized alarms
    RecurringAlarmClock public alarmClockBlueprint;     // The recurring alarm clock blueprint to supply the clone factory

    /// @notice Constructor to create a DelegatedWalletFactory
    /// @param _ethereumAlarmClock The contract responsible for deploying decentralized alarms 
    /// @param _alarmClockBlueprint The recurring alarm clock blueprint 
    constructor (
        RequestFactoryInterface _ethereumAlarmClock, 
        RecurringAlarmClock _alarmClockBlueprint
    ) public {
        ethereumAlarmClock = _ethereumAlarmClock;
        alarmClockBlueprint = _alarmClockBlueprint;
    }

    /// @notice Creates a delegated wallet with the owner set to 'owner' and no delegates
    /// @param delegate The delegate from which to pull alarm payments
    /// @param wallet The funding wallet, change address, and owner of the deployed alarms
    /// @param priorityCaller The priority caller receives a base amount of the alarm fee regardless of if they call the alarm.
    /// @param recurringAlarmClockOptions The options used for creating the recurring alarm clock
    /// @param ethereumAlarmClockOptions The options used for creating decentralized alarms.
    /// @return The recurring alarm clock contract
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

        emit AlarmClock_event(msg.sender, recurringAlarmClock);
    }

    event AlarmClock_event(address indexed caller, address alarmClock);

}
