pragma solidity ^0.4.23;

import "../../external/Owned.sol";
import "./RecurringAlarmClockFactory.sol";

/// @title RecurringAlarmClockAssistant Contract
/// @author Joseph Reed
/// @dev This contract's goal is to make it easy for anyone to create a recurring alarm clock using the minumum amount
///      of inputs possible. However this introduces an third party risk of ***unresearched*** severity (todo)
contract RecurringAlarmClockAssistant is Owned {
    
    RecurringAlarmClockFactory public Factory;  // The factory that creates each recurring alarm clock
    address public priorityCaller;              // The priority caller receives extra incentive to trigger an alarm
    uint public defaultSafetyMultiplier = 1;    // The safety multiplier provides a safety net if the value of ether 
                                                // drops too far and/or if the gas price becomes more expensive
    uint[10] defaultOptions = [
        60 minutes,     // claimWindowSize
        3 minutes,      // freezePeriod
        5 minutes,      // reservedWindowSize
        2,              // 2 = Use timestamp based scheduling instead of blocks
        24 hours,       // The size of the execution window
        0,              // The start of the execution window
        700000,         // The amount of gas to be sent with the transaction
        0,              // The amount of ether to be sent
        0,              // The minimum gas price for the alarm when called
        0               // The required deposit by the claimer
    ];

    /// @notice Constructor to create a DelegatedWalletFactory
    /// @param _priorityCaller The account given a priority fee for calling the alarm 
    /// @param _Factory The factory deploying the recurring alarm clocks
    constructor (
        address _priorityCaller, 
        RecurringAlarmClockFactory _Factory
    ) public {
        priorityCaller = _priorityCaller;
        Factory = _Factory;
    }

    /// @notice Easily create a recurring alarm clock using the bare minimum amount of inputs.
    /// @param delegate The delegate from which to pull alarm payments
    /// @param wallet The funding wallet, change address, and owner of the deployed alarms
    /// @param startTimestamp The starting timestamp in seconds
    /// @param totalPayments The total number of payments to execute
    /// @param period How long in seconds between each payment
    /// @param extraGas How much additional gas to trigger each alarm with
    /// @return The address of the recurring alarm clock contract
    function createRecurringAlarmClock(
        IPaymentDelegate delegate,
        IDelegatedWallet wallet,
        uint startTimestamp,
        uint totalPayments,
        uint period,
        uint extraGas
    ) public returns (RecurringAlarmClock alarmClock) {
        uint[3] memory recurringAlarmClockOptions = [defaultSafetyMultiplier, period, totalPayments];
        uint[10] memory ethereumAlarmClockOptions = defaultOptions;
        ethereumAlarmClockOptions[5] = startTimestamp;
        ethereumAlarmClockOptions[6] += extraGas;
        
        alarmClock = Factory.createRecurringAlarmClock(
            delegate,
            wallet,
            priorityCaller,
            "",
            recurringAlarmClockOptions,
            ethereumAlarmClockOptions
        );

        delegate.schedule(alarmClock);  // schedules the alarm clock with the payment delegate
    }

    /// @notice Updates the safety multipler to a new value
    /// @param newSafetyMultiplier The new value to set
    function updateSafetyMultiplier(uint newSafetyMultiplier) public onlyOwner {
        defaultSafetyMultiplier = newSafetyMultiplier;
    }

    /// @notice Updates the default options to new values
    /// @param newOptions The new values to set
    function updateDefaultOptions(uint[10] newOptions) public onlyOwner {
        defaultOptions = newOptions;
    }

}
