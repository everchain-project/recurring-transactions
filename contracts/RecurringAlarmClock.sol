pragma solidity ^0.5.0;

import "./external/BokkyPooBahsDateTimeLibrary.sol";
import "./Interfaces.sol";

/// @title RecurringAlarmClock Contract
/// @author Joseph Reed
/// @dev This contract's goal is to execute recurring tasks completely on-chain. It requires four main components:
///      1. A source for on chain alarms. This contract uses the Ethereum Alarm Clock (eac)
///      2. A payment delegate with this alarm scheduled and permitted to pull funds for each alarm
///      3. A funded delegated wallet with the payment delegate set as a delegate
///      4. A recurring task to execute
contract RecurringAlarmClock is IRecurringAlarmClock {

    using BokkyPooBahsDateTimeLibrary for uint;
    
    address public factory;             // The factory that deployed this contract
    uint public blockInitialized;       // The block the alarm clock was initialized
    uint public BASE_GAS_COST;          // The minimum amount of gas it takes to run the alarm clock not including the triggered task.

    // Payment Options
    IDelegatedWallet public wallet;     // The address which owns the alarm and collects any leftover funds
    IPaymentDelegate public delegate;   // The delegate that pulls funds for each alarm
    IGasPriceOracle public gasPrice;    // The fetches the current or future gas price of the network
    
    // Ethereum Alarm Clock Options
    RequestFactoryInterface public EAC; // Interface provided by the Ethereum Alarm Clock
    address public priorityCaller;      // The priority recipient of part of the alarm deposit
    uint[3] public limits;              // The execution limits used when calling the alarm
    uint public alarmStart;             // The start of the execution window for the next alarm
    uint public windowSize;             // The window of time during which an alarm can be executed
    
    // Recurring Alarm Clock Options
    uint public intervalValue;          // The value of the time unit when calculating the next alarm timestamp
    uint public intervalUnit;           // The time unit used when calculating the next alarm timestamp: 0 = seconds, 1 = minutes, 2 = hours, 3 = days, 4 = months, 5 = years
    uint public maxIntervals;           // The number of times this alarm will go off. 0 = infinite
    uint public currentInterval;        // Keeps track of how many alarms have been called

    // Execution Options
    address public alarm;       // The next scheduled alarm contract
    address payable public callAddress; // The address of the task contract
    bytes public callData;              // The data for the task to execute when the alarm is triggered
    uint public callValue;              // The amount of ether to send when the task is triggered
    
    /// @notice Uses 'initialize()' instead of a constructor to make use of the clone 
    ///         factory at https://github.com/optionality/clone-factory. In general, 'initialize()' should be  
    ///         called directly following the alarm clock deployment through the use of a factory.
    /// @param _EAC The Ethereum Alarm Clock smart contract responsible for creating decentralized alarms.
    /// @param _wallet The funding wallet, change address, and owner of the deployed alarms
    /// @param _delegate The delegate from which to pull alarm payments
    function initialize (
        RequestFactoryInterface _EAC,
        IDelegatedWallet _wallet,
        IPaymentDelegate _delegate
    ) public {
        require(blockInitialized == 0, "the lock function can be called only once by the factory");
        
        factory = msg.sender;
        blockInitialized = block.number;
        BASE_GAS_COST = 700000;

        EAC = _EAC;
        wallet = _wallet;
        delegate = _delegate;
    }

    /// @param _limits The execution limits applied to each decentralized alarm
    function setExecutionLimits (uint[3] memory _limits) public onlyDelegates {
        limits = _limits;
    }

    /// @param _oracle To do
    function setGasPriceOracle (IGasPriceOracle _oracle) public onlyDelegates {
        gasPrice = _oracle;
    }

    /// @param _priorityCaller To do
    function setPriorityCaller (address _priorityCaller) public onlyDelegates {
        priorityCaller = _priorityCaller;
    }

    function start (
        address payable _callAddress,
        bytes memory _callData,
        uint[7] memory _callOptions
    ) public onlyDelegates {
        require(_callAddress != address(0x0));
        require(_callOptions[2] > now, "start timestamp cannot be in the past.");
        require(_callOptions[3] != 0, "window size cannot be zero");

        callAddress = _callAddress;
        callData = _callData;
        callValue = _callOptions[0];
        callGas = _callOptions[1];
        alarmStart = _callOptions[2];
        windowSize = _callOptions[3];
        intervalValue = _callOptions[4];
        intervalUnit = _callOptions[5];
        maxIntervals = _callOptions[6];
        currentInterval = 1;

        scheduleAlarm();

        emit Start_event(_callAddress, _callData, _callOptions);
    }

    /// @notice The default function collects ether sent by the payment delegate and is also called by
    ///         each alarm when they are triggered
    function () external payable {
        if(msg.value > 0)
            emit AlarmPaid_event(msg.sender, msg.value);
        else
            handleAlarmCall();
    }

    /// @notice The heart of the recurring alarm clock.
    ///         1. Check if the caller is the current alarm
    ///         2. Execute the task
    ///         3. Reschedule the alarm
    ///         4. Cleanup
    function handleAlarmCall () internal {
        require(msg.sender == alarm, "only the alarm can trigger the alarm clock");

        if(callValue != 0) delegate.transfer(address(0x0), address(this), callValue);
        (bool success, bytes memory result) = callAddress.call.value(callValue).gas(gasleft())(callData);
        emit Execute_event(alarm, currentInterval, maxIntervals, callAddress, callValue, callData , success, result);

        if(currentInterval < maxIntervals || maxIntervals == 0) {
                 if(intervalUnit == 0) alarmStart = alarmStart.addSeconds(intervalValue);
            else if(intervalUnit == 1) alarmStart = alarmStart.addMinutes(intervalValue);
            else if(intervalUnit == 2) alarmStart = alarmStart.addHours(intervalValue);
            else if(intervalUnit == 3) alarmStart = alarmStart.addDays(intervalValue);
            else if(intervalUnit == 4) alarmStart = alarmStart.addMonths(intervalValue);
            else if(intervalUnit == 5) alarmStart = alarmStart.addYears(intervalValue);
 
            scheduleAlarm();
        } else {
            delete alarm;
        }

        currentInterval++;
    }

    /// @notice Schedules a new alarm with the Ethereum Alarm Clock
    function scheduleAlarm () internal {
        uint totalGasCost = BASE_GAS_COST + callGas;    // The amount of gas to be sent with the transaction
        uint currentCost = totalGasCost * gasPrice.future(alarmStart);

        // Pull the necessary funds for the alarm
        if(currentCost > 0) delegate.transfer(address(0x0), address(this), currentCost); 
        uint endowment = address(this).balance;         // Commit all available ether to the next alarm
        uint priorityFee = endowment / 100;             // Set one percent aside for the priority caller
        uint timeBounty = endowment - priorityFee;      // Set the remaining ether aside for the time bounty

        address[3] memory addressOptions = [
            address(wallet),    // Change from the alarm is sent to this address, also the account that can owns the alarm.
            priorityCaller,     // The priority fee is sent to the priority caller
            address(this)       // The contract to call at execution
        ];

        uint[12] memory uintOptions = [
            priorityFee,    // A fee that goes to the fee recipient
            timeBounty,     // The bounty for the account that triggers this alarm
            limits[0],      // claimWindowSize
            limits[1],      // freezeintervalDuration
            limits[2],      // reservedWindowSize
            2,              // 1 = use block based scheduling, 2 = Use timestamp based scheduling
            windowSize,     // The size of the execution window
            alarmStart,     // The start of the execution window
            totalGasCost,   // The amount of gas to be sent with the transaction
            0,              // The amount of ether to be sent
            0,              // The minimum gas price for the alarm when called
            0               // The required deposit by the claimer
        ];

        alarm = EAC.createValidatedRequest.value(endowment)(addressOptions, uintOptions, "");

        if(alarm != address(0x0))
            emit ValidRequest_event(alarm);
        else
            emit InvalidRequest_event(EAC.validateRequestParams(addressOptions, uintOptions, endowment));
    }

    function destroy () public onlyDelegates {
        delegate.unschedule();
        selfdestruct(address(wallet));
    }

    modifier onlyDelegates () {
        require(wallet.isDelegate(msg.sender), "only a wallet delegate can call this function");
        _;
    }
    
    event AlarmPaid_event (address sender, uint amount);
    event ValidRequest_event (address newAlarm);
    event InvalidRequest_event (bool[6] params);
    event Start_event(
        address callAddress,
        bytes callData,
        uint[7] callOptions
    );    
    event Execute_event(
        address alarm,
        uint currentInterval,
        uint maxIntervals,
        address callAddress,
        uint callValue,
        bytes callData,
        bool success,
        bytes result
    );

}
