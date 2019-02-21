pragma solidity ^0.5.0;

import "./external/BokkyPooBahsDateTimeLibrary.sol";
import "./Interfaces.sol";

/// @title Recurring Transaction Contract
/// @author Joseph Reed
/// @dev This contract's allows decentralized execution of on-chain recurring tasks. It requires three main components:
///     1. An external source for calling transactions at future time. This contract uses the Ethereum Alarm Clock (EAC)
///     2. A payment delegate with the Recurring Transaction scheduled
///     3. A funded delegated wallet with the payment delegate set as a delegate
/// To calculate the cost of each transaction the supplied gas price oracle determines the current network price times a  
/// multiplierbased on how far in the future the transaction is executed. As long as the delegated wallet has enough funds, 
/// the recurring transactions will continue.
contract RecurringTransaction is IRecurringTransaction {

    using BokkyPooBahsDateTimeLibrary for uint; // A Date/Time library for manipulating timestamps
    
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
    uint public alarmStart;             // The start of the execution window for the current alarm
    uint public windowSize;             // The number of seconds after the alarm start in which the alarm can be executed
    
    // Recurring Transaction Options
    uint public blockStarted;           // The block the current recurring transaction started
    uint public intervalValue;          // The value of the time unit when calculating the next alarm timestamp
    uint public intervalUnit;           // The time unit used when calculating the next alarm timestamp: 0 = seconds, 1 = minutes, 2 = hours, 3 = days, 4 = months, 5 = years
    uint public maxIntervals;           // The number of times this alarm will go off. 0 = infinite
    uint public currentInterval;        // Keeps track of how many alarms have been called

    // Execution Options
    address public txRequest;           // The next scheduled transaction request contract
    address payable public callAddress; // The address of the contract to call
    bytes public callData;              // The data to send with the contract call
    uint public callValue;              // The amount of ether to send with the contract call
    uint public callGas;                // The amount of extra gas to add to the BASE_GAS_COST when scheduling an alarm
    
    constructor() public {
        blockInitialized = block.number; // force the master contract to be initialized. Ensures the master copy is never self destructed.
    }

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
        require(blockInitialized == 0, "contract already initialized");
        
        factory = msg.sender;
        blockInitialized = block.number;
        BASE_GAS_COST = 700000;

        EAC = _EAC;
        wallet = _wallet;
        delegate = _delegate;
    }

    function start (
        address payable _callAddress,
        bytes memory _callData,
        uint[7] memory _callOptions
    ) public onlyDelegates {
        require(_callAddress != address(0x0), "call address must not be empty");
        require(_callOptions[2] > now, "start timestamp cannot be in the past");
        require(_callOptions[3] != 0, "window size cannot be zero");

        blockStarted = block.number;
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

        scheduleTransaction();

        emit Start_event(msg.sender, _callAddress, _callData, _callOptions);
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
        require(msg.sender == txRequest, "msg.sender must be tx request");

        if(callValue != 0) delegate.transfer(address(0x0), address(this), callValue);
        (bool success, bytes memory result) = callAddress.call.value(callValue).gas(callGas)(callData);
        emit Execute_event(txRequest, callAddress, callValue, callData, currentInterval, maxIntervals, success, result);

        if(currentInterval < maxIntervals || maxIntervals == 0) {
                 if(intervalUnit == 0) alarmStart = alarmStart.addSeconds(intervalValue);
            else if(intervalUnit == 1) alarmStart = alarmStart.addMinutes(intervalValue);
            else if(intervalUnit == 2) alarmStart = alarmStart.addHours(intervalValue);
            else if(intervalUnit == 3) alarmStart = alarmStart.addDays(intervalValue);
            else if(intervalUnit == 4) alarmStart = alarmStart.addMonths(intervalValue);
            else if(intervalUnit == 5) alarmStart = alarmStart.addYears(intervalValue);
 
            scheduleTransaction();
        } else {
            delete txRequest;
        }

        currentInterval++;
    }

    /// @notice Schedules a new transaction request with the Ethereum Alarm Clock
    function scheduleTransaction () internal {
        uint totalGasCost = BASE_GAS_COST + callGas;    // The amount of gas to be sent with the transaction
        uint currentCost = totalGasCost * gasPrice.future(alarmStart + windowSize);

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
            0,              // The minimum gas price for the transaction when called
            endowment       // The required deposit by the claimer
        ];

        txRequest = EAC.createValidatedRequest.value(endowment)(addressOptions, uintOptions, "");

        if(txRequest != address(0x0))
            emit ValidRequest_event(txRequest);
        else
            emit InvalidRequest_event(EAC.validateRequestParams(addressOptions, uintOptions, endowment));
    }

    /// @notice Cleans up and destroys the alarm. Any leftover ether is sent to the wallet.
    function destroy () public onlyDelegates {
        delegate.unschedule();
        emit Destroy_event(msg.sender);

        selfdestruct(address(wallet));
    }

    /// @notice Sets the priority caller that receives the fee when an alarm is called
    /// @param _priorityCaller The address that receives the alarm fee when it is triggered.
    function setPriorityCaller (address _priorityCaller) public onlyDelegates {
        priorityCaller = _priorityCaller;
    }

    /// @notice Sets the execution limits for when an alarm can be claimed, called, or cancelled.
    /// @param _limits The execution limits applied to each decentralized alarm
    function setExecutionLimits (uint[3] memory _limits) public onlyDelegates {
        limits = _limits;
    }

    /// @notice Sets the oracle that predicts future gas prices.
    /// @param _oracle Attempts to predict the gas price at a future date
    function setGasPriceOracle (IGasPriceOracle _oracle) public onlyDelegates {
        gasPrice = _oracle;
    }

    modifier onlyDelegates () {
        require(wallet.isDelegate(msg.sender), "msg sender must be a delegate");
        _;
    }

    event AlarmPaid_event (address indexed msgSender, uint msgValue);
    event ValidRequest_event (address txRequest);
    event InvalidRequest_event (bool[6] reason);
    event Start_event(
        address indexed delegate,
        address indexed callAddress,
        bytes callData,
        uint[7] callOptions
    );
    event Execute_event(
        address txRequest,
        address indexed callAddress,
        uint callValue,
        bytes callData,
        uint currentInterval,
        uint maxIntervals,
        bool success,
        bytes result
    );
    event Destroy_event(address indexed delegate);

}
