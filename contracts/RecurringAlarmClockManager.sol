pragma solidity ^0.5.0;

import "./external/listlib.sol";
import "./external/Owned.sol";
import "./Interfaces.sol";

/// @title RecurringAlarmClockManager Contract
/// @author Joseph Reed
/// @dev This contract's goal is to make it easy to find deployed alarm clocks
contract RecurringAlarmClockManager is Owned {

    using ListLib for ListLib.AddressList;      // Import the data structure AddressList from the ListLib contract

    uint public blockCreated = block.number;    // The block the factory was deployed
    
    address public PriorityCaller;              // The priority caller receives extra incentive to trigger an alarm
    IGasPriceOracle public Oracle;
    uint[5] defaultOptions = [
        60 minutes,     // claimWindowSize
        3 minutes,      // freezePeriod
        5 minutes,      // reservedWindowSize
        24 hours,       // The size of the execution window
        700000          // The amount of gas to be sent with the transaction
    ];

    mapping (address => ListLib.AddressList) alarmClocks;   // The list of alarms added by each account

    constructor (address _PriorityCaller, uint[5] memory _defaultOptions) public {
        PriorityCaller = _PriorityCaller;
        defaultOptions = _defaultOptions;
    }
    
    function createAlarm (
        IRecurringAlarmClockFactory factory, 
        IDelegatedWallet wallet,
        IPaymentDelegate delegate,
        IGasPriceOracle gasPriceOracle,
        address priorityCaller,
        uint[5] memory ethereumAlarmClockOptions
    ) public returns (IRecurringAlarmClock alarmClock) {
        require(wallet.isDelegate(msg.sender), "caller must be a wallet delegate");

        alarmClock = factory.createAlarmClock(
            wallet,
            delegate,
            gasPriceOracle,
            priorityCaller,
            ethereumAlarmClockOptions
        );

        //delegate.schedule(alarmClock);
        alarmClocks[address(wallet)].add(address(alarmClock));

        emit CreateAlarmClock_event(msg.sender, address(factory), address(alarmClock));
    }

    function createAndStartAlarm (
        IRecurringAlarmClockFactory factory, 
        IDelegatedWallet wallet,
        IPaymentDelegate delegate,
        IGasPriceOracle gasPriceOracle,
        address priorityCaller,
        address task,
        bytes memory callData,
        uint[5] memory ethereumAlarmClockOptions,
        uint startTimestamp,
        uint totalPayments,
        uint intervalValue,
        uint intervalUnit
    ) public returns (IRecurringAlarmClock alarmClock) {
        require(wallet.isDelegate(msg.sender), "caller must be a wallet delegate");

        alarmClock = factory.createAlarmClock(
            wallet,
            delegate,
            gasPriceOracle,
            priorityCaller,
            ethereumAlarmClockOptions
        );

        delegate.schedule(alarmClock);
        alarmClocks[address(wallet)].add(address(alarmClock));

        alarmClock.start(
            task,
            callData,
            startTimestamp,
            intervalValue,
            intervalUnit,
            totalPayments
        );

        emit CreateAlarmClock_event(msg.sender, address(factory), address(alarmClock));
    }

    function createAlarmWizard (
        IRecurringAlarmClockFactory factory, 
        IDelegatedWallet wallet,
        IPaymentDelegate delegate,
        IGasPriceOracle gasPriceOracle,
        address task,
        bytes memory callData,
        uint startTimestamp,
        uint totalPayments,
        uint intervalValue,
        uint intervalUnit
    ) public returns (IRecurringAlarmClock alarmClock) {
        require(wallet.isDelegate(msg.sender), "caller must be a wallet delegate");

        alarmClock = factory.createAlarmClock(
            wallet,
            delegate,
            gasPriceOracle,
            PriorityCaller,
            defaultOptions
        );

        delegate.schedule(alarmClock);
        alarmClocks[address(wallet)].add(address(alarmClock));

        alarmClock.start(
            task,
            callData,
            startTimestamp,
            intervalValue,
            intervalUnit,
            totalPayments
        );

        emit CreateAlarmClock_event(msg.sender, address(factory), address(alarmClock));
    }

    function addAlarm (IRecurringAlarmClock alarmClock) public returns (bool success) {
        IDelegatedWallet wallet = alarmClock.wallet();
        require(wallet.isDelegate(msg.sender), "caller must be a wallet delegate");

        success = alarmClocks[address(wallet)].add(address(alarmClock));

        emit AddAlarmClock_event(msg.sender, address(alarmClock));
    }

    function removeAlarm (IRecurringAlarmClock alarmClock) public returns (bool success) {
        IDelegatedWallet wallet = alarmClock.wallet();
        require(wallet.isDelegate(msg.sender), "caller must be a wallet delegate");

        success = alarmClocks[address(wallet)].remove(address(alarmClock));

        emit RemoveAlarmClock_event(msg.sender, address(alarmClock));
    }

    /// @notice Fetches a alarm clock list from a given account.
    /// @param account The given account from which to fetch the alarm clock list
    /// @return an address array of alarmClocks owned by 'account'
    function getAlarmClocks (address account) public view returns (address[] memory) {
        return alarmClocks[account].get();
    }
    
    /// @notice Fetches a how many alarmClocks are in the list from a given account.
    /// @param account The given account from which to fetch the alarm clock list
    /// @return the total number of alarmClocks
    function totalAlarmClocks (address account) public view returns (uint) {
        return alarmClocks[account].getLength();
    }
    
    /// @notice Shows if a alarm clock exists in the alarm clock list from a given account.
    /// @param account The given account to check
    /// @param alarmClock The given alarm clock to check for
    /// @return True if the given alarm clock exists an accounts alarm clock list
    function contains (address account, IRecurringAlarmClock alarmClock) public view returns (bool) {
        return alarmClocks[account].contains(address(alarmClock));
    }

    /// @notice Fetches the alarm clock at index 'i' from the 'account' alarm clock list
    /// @param account The given account to check
    /// @param i The index to check
    /// @return The alarm clock address that exists at index 'i' in the 'account' alarm clock list
    function index (address account, uint i) public view returns (IRecurringAlarmClock) {
        return IRecurringAlarmClock(address(uint160(alarmClocks[account].index(i))));
    }

    /// @notice Fetches the index of a given 'alarmClock' from a given 'account' alarm clock list
    /// @param account The given account to check
    /// @param alarmClock The given alarm clock to check
    /// @return The current index of 'alarmClock' in 'account' alarm clock list
    function indexOf (address account, IRecurringAlarmClock alarmClock) public view returns (uint) {
        return alarmClocks[account].indexOf(address(alarmClock));
    }

    event CreateAlarmClock_event(address indexed caller, address indexed factory, address alarmClock);
    event AddAlarmClock_event(address indexed caller, address alarmClock);
    event RemoveAlarmClock_event(address indexed caller, address alarmClock);

}
