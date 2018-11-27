pragma solidity ^0.5.0;

import "./external/Owned.sol";
import "./RecurringAlarmClockFactory.sol";

/// @title RecurringAlarmClockAssistant Contract
/// @author Joseph Reed
/// @dev This contract's goal is to make it easy for anyone to create a recurring alarm clock using the minumum amount
///      of inputs possible. However this introduces an third party risk of ***unresearched*** severity (todo). The Gas
///      Price Feed and Safety Multiplier Feed could be manipulated to cause overfunded alarms or cause alarms to fail
///      to reschedule. Damage is limited due to the time based sliding scale the Ethereum Alarm Clock uses for 
///      calculating the reward.
///         Pros: The alarm is far less likely to be underfunded
///         Cons: The user overpays a substantial amount per alarm
///    Solutions: 
///         naive approach #1: Set a maximum gas price/safety multiplier, this is not a viable solution for long term unsupervised alarms
contract RecurringAlarmClockAssistant is Owned {
    
    RecurringAlarmClockFactory public Factory;  // The factory that creates each recurring alarm clock
    IUintFeed public gasPrice;                  // The oracle that provides the current gas price of the network
    IUintFeed public safetyMultiplier;          // The oracle that provides a safety multiplier when calculating the alarm cost 
                                                // drops too far and/or if the gas price becomes more expensive
    address public priorityCaller;              // The priority caller receives extra incentive to trigger an alarm
    uint[5] defaultOptions = [
        60 minutes,     // claimWindowSize
        3 minutes,      // freezePeriod
        5 minutes,      // reservedWindowSize
        24 hours,       // The size of the execution window
        700000          // The amount of gas to be sent with the transaction
    ];

    /// @notice Constructor to create a DelegatedWalletFactory
    /// @param _Factory The factory deploying the recurring alarm clocks
    constructor (RecurringAlarmClockFactory _Factory) public {
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
        address task,
        bytes memory callData,
        uint startTimestamp,
        uint totalPayments,
        uint intervalValue,
        uint intervalUnit,
        uint extraGas
    ) public returns (RecurringAlarmClock alarmClock) {
        uint[5] memory eacOptions = defaultOptions;
        eacOptions[4] += extraGas;
        
        alarmClock = Factory.createRecurringAlarmClock(
            wallet,
            delegate,
            gasPrice,
            safetyMultiplier,
            priorityCaller,
            eacOptions
        );

        delegate.schedule(alarmClock);

        alarmClock.start(
            task,
            callData,
            startTimestamp,
            intervalValue,
            intervalUnit,
            totalPayments
        );
    }

    /// @notice Updates the default options to new values
    /// @param newOptions The new values to set
    function updateDefaultOptions(uint[5] memory newOptions) public onlyOwner {
        defaultOptions = newOptions;
    }

    /// @param _priorityCaller The account given a priority fee for calling the alarm 
    function updatePriorityCaller (address _priorityCaller) public onlyOwner {
        priorityCaller = _priorityCaller;
    }
    
}
