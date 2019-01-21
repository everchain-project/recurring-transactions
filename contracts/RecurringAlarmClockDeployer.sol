pragma solidity ^0.5.0;

import "./RecurringAlarmClockFactory.sol";
import "./PaymentDelegate.sol";

/// @title RecurringAlarmClockDeployer
/// @author Joseph Reed
/// @dev This contract's goal is to make it super easy to create a recurring alarm clock by setting several default values
contract RecurringAlarmClockDeployer is Owned {

    uint public blockCreated = block.number;
    
    RecurringAlarmClockFactory public defaultFactory;
    IGasPriceOracle public defaultOracle;
    address public defaultCaller;
    uint[3] public defaultLimits;

    /// @notice Constructor to create a smart contract which aids in creating a recurring alarm clock
    /// @param _defaultFactory The default factory contract responsible for deploying decentralized alarm clocks
    /// @param _defaultOracle The default gas price oracle responsible for predicting future gas costs
    constructor (
        RecurringAlarmClockFactory _defaultFactory,
        IGasPriceOracle _defaultOracle
    ) public {
        defaultFactory = _defaultFactory;
        defaultOracle = _defaultOracle;
        defaultCaller = msg.sender;
        
        defaultLimits[0] = 60 minutes;     // claimWindowSize
        defaultLimits[1] = 3 minutes;      // freezeIntervalDuration
        defaultLimits[2] = 5 minutes;      // reservedWindowSize
    }

    function setDefaultOracle (IGasPriceOracle newDefaultOracle) public onlyOwner {
        defaultOracle = newDefaultOracle;
    }

    function setDefaultCaller (address newDefaultCaller) public onlyOwner {
        defaultCaller = newDefaultCaller;
    }

    function setDefaultFactory (RecurringAlarmClockFactory newDefaultFactory) public onlyOwner {
        defaultFactory = newDefaultFactory;
    }

    /// @notice Creates an alarm clock belonging to the specified wallet
    /// @param wallet The funding wallet, change address, and owner of the deployed alarms
    /// @param delegate The delegate from which to pull alarm payments
    /// @return The recurring alarm clock contract address
    function createAlarmClock(
        IDelegatedWallet wallet, 
        IPaymentDelegate delegate
    ) public returns (RecurringAlarmClock alarmClock) {
        require(wallet.isDelegate(msg.sender), "the caller must be a wallet delegate");
        
        alarmClock = defaultFactory.createAlarmClock(wallet,delegate);
        alarmClock.setExecutionLimits(defaultLimits);
        alarmClock.setGasPriceOracle(defaultOracle);
        alarmClock.setPriorityCaller(defaultCaller);
        emit DeployAlarmClock_event(msg.sender, address(alarmClock));
    }

    /// @notice Creates and starts an alarm clock belonging to the specified wallet with the specified call options
    /// @param wallet The funding wallet, change address, and owner of the deployed alarms
    /// @param delegate The delegate from which to pull alarm payments
    /// @param callAddress The address the alarm clock will call each time it is triggered
    /// @param callData The data the alarm clock will send with the call
    /// @param callOptions The options defining how and when to trigger the alarm clock
    /// @return The recurring alarm clock contract address
    function createAndStartAlarmClock(
        IDelegatedWallet wallet,
        IPaymentDelegate delegate,
        address payable callAddress,
        bytes memory callData,
        uint[7] memory callOptions      // callValue, callGas, startTimestamp, windowSize, intervalValue, intervalUnit, maxIntervals
    ) public returns (RecurringAlarmClock alarmClock) {
        require(wallet.isDelegate(msg.sender), "the caller must be a wallet delegate");

        alarmClock = defaultFactory.createAlarmClock(wallet,delegate);
        alarmClock.setExecutionLimits(defaultLimits);
        alarmClock.setGasPriceOracle(defaultOracle);
        alarmClock.setPriorityCaller(defaultCaller);

        delegate.schedule(alarmClock);

        alarmClock.start(callAddress, callData, callOptions);
        emit DeployAlarmClock_event(msg.sender, address(alarmClock));
    }    

    /// @notice Creates an alarm clock
    /// @param delegate The delegate from which to pull alarm payments
    /// @param wallet The funding wallet, change address, and owner of the deployed alarms
    /// @param customCaller The custom caller receives a base amount of the alarm fee regardless of if they call the alarm.
    /// @param customOracle The feed that supplies the current network gas price
    /// @param customLimits The ethereum alarm clock limits used when calling decentralized alarms.
    /// @param callAddress The address the alarm clock will call each time it is triggered
    /// @param callData The data the alarm clock will send with the call
    /// @param callOptions The options defining how and when to trigger the alarm clock
    /// @return The recurring alarm clock contract address
    function createAndStartRawAlarmClock(
        IDelegatedWallet wallet,
        IPaymentDelegate delegate,
        IGasPriceOracle customOracle,
        address customCaller,
        uint[3] memory customLimits,
        address payable callAddress,
        bytes memory callData,
        uint[7] memory callOptions      // callValue, callGas, startTimestamp, windowSize, intervalValue, intervalUnit, maxIntervals
    ) public returns (RecurringAlarmClock alarmClock) {
        require(wallet.isDelegate(msg.sender), "the caller must be a wallet delegate");

        alarmClock = defaultFactory.createAlarmClock(wallet,delegate);
        alarmClock.setExecutionLimits(customLimits);
        alarmClock.setGasPriceOracle(customOracle);
        alarmClock.setPriorityCaller(customCaller);

        delegate.schedule(alarmClock);

        alarmClock.start(callAddress, callData, callOptions);
        emit DeployAlarmClock_event(msg.sender, address(alarmClock));
    }

    event DeployAlarmClock_event(address indexed caller, address alarmClock);

}
