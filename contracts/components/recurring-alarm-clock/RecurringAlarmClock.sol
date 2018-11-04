pragma solidity ^0.4.23;

import "../../external/RequestFactoryInterface.sol";
import "../../Interfaces.sol";

/// @title RecurringAlarmClock Contract
/// @author Joseph Reed
/// @dev This contract's goal is to execute recurring tasks completely on-chain. It requires four main components:
///      1. A source for on chain alarms. This contract uses the Ethereum Alarm Clock (eac)
///      2. A payment delegate with this alarm scheduled and permitted to pull funds for each alarm
///      3. A funded delegated wallet with the payment delegate set as a delegate
///      4. A recurring task to execute
contract RecurringAlarmClock is IRecurringAlarmClock, ICancellable {

    uint public blockCreated;               // The block the alarm clock was started
    address public factory;                 // The factory that deployed this contract

    address public executor;                // The next scheduled alarm contract
    address public task;                    // The address of the task contract
    RequestFactoryInterface public eac;     // Interface provided by the Ethereum Alarm Clock
    IPaymentDelegate public delegate;       // The delegate that pulls funds for each alarm
    IDelegatedWallet public wallet;         // The address which owns the alarm and collects any leftover funds
    address public token;                   // The token to pull when funding an alarm. default of 0x0 represents native ether
    address public recipient;               // The recipient to send pulled funds to. set to 'this' at initialization
    address public priorityCaller;          // The priority recipient of part of the alarm deposit
    bytes public callData;                  // The data for the task to execute when the alarm is triggered
    uint[10] public eacOptions;             // The options used when setting an alarm using the Ethereum Alarm Clock
    uint public safetyMultiplier;           // The multiplier to use when calculating the alarm cost
    uint public intervalDuration;           // The amount of time between each alarm
    uint public maximumIntervals;           // The number of times this alarm will go off
    uint public currentInterval;            // Keeps track of how many alarms have been called
    uint public maxGasPrice;                // placeholder for a gas price oracle

    /// @notice Initializes the recurring alarm clock. Uses 'initialize()' instead of a constructor to make use of the clone 
    ///         factory at https://github.com/optionality/clone-factory. In general, 'initialize()' should be  
    ///         called directly following it's deployment through the use of a factory
    /// @param _eac The contract responsible for deploying decentralized alarms
    /// @param _delegate The delegate from which to pull alarm payments
    /// @param _wallet The funding wallet, change address, and owner of the deployed alarms
    /// @param _priorityCaller The priority caller receives a base amount of the alarm fee regardless of if they call the alarm
    /// @param _recurringAlarmClockOptions The options used for creating the recurring alarm clock
    /// @param _ethereumAlarmClockOptions The options used for creating decentralized alarms
    function initialize (
        RequestFactoryInterface _eac,
        IPaymentDelegate _delegate,
        IDelegatedWallet _wallet,
        address _priorityCaller,
        bytes _callData,
        uint[3] _recurringAlarmClockOptions,
        uint[10] _ethereumAlarmClockOptions
    ) public {
        require(blockCreated == 0, "contract can only be initialized once");

        blockCreated = block.number;    // The block number at the time of deployment
        factory = msg.sender;           // The factory that deployed this contract

        maxGasPrice = 1000000000;       // This will eventually be set to a Gas Price Oracle
        token = address(0x0);           // '0x0' == Ether; EAC alarms use ether as the default/only currency
        recipient = this;               // This alarm clock is the recipient of it's own recurring payment

        eac = _eac;
        delegate = _delegate;
        wallet = _wallet;
        priorityCaller = _priorityCaller;
        callData = _callData;
        eacOptions = _ethereumAlarmClockOptions;
        safetyMultiplier = _recurringAlarmClockOptions[0];
        intervalDuration = _recurringAlarmClockOptions[1];
        maximumIntervals = _recurringAlarmClockOptions[2];
    }

    /// @notice Assigns a task to recurring alarm clock and schedules the first alarm. Should be called
    ///         immediately after the factory creates the recurring alarm clock
    /// @param _task The task to execute when each alarm is triggered
    function start (address _task) public {
        require(task == address(0x0), "the task must not be assigned yet");

        task = _task;
        executor = newAlarm();
    }

    /// @notice The default function collects ether sent by the payment delegate and is also called by
    ///         each alarm when they are triggered
    function () public payable {
        if(msg.value > 0)
            emit Deposit_event(msg.sender, msg.value);
        else
            handleAlarmCall();
    }

    /// @notice The heart of the recurring alarm clock.
    ///         1. Check if the caller is the executor
    ///         2. Execute the task
    ///         3. Reschedule the alarm
    ///         4. Cleanup
    function handleAlarmCall () internal {
        require(msg.sender == executor, "only the executor can handle an alarm call");
        executor = address(0x0);

        bool success = task.call.gas(gasleft())(callData);

        if(currentInterval < maximumIntervals){
            eacOptions[5] += intervalDuration;
            executor = newAlarm();
        }

        if(currentInterval == maximumIntervals)
            delegate.unschedule();

        emit Execute_event(currentInterval, success);
    }

    /// @notice Schedules a new alarm with the Ethereum Alarm Clock
    /// @return The new alarm scheduled
    function newAlarm () internal returns (address alarm) {
        currentInterval++;
        delegate.execute();
        
        uint endowment = address(this).balance;     // Commit all available ether to the next alarm
        uint priorityFee = endowment / 100;         // Set one percent aside for the priority caller
        uint timeBounty = endowment - priorityFee;  // Set the remaining ether aside for the time bounty

        address[3] memory addressOptions = [
            wallet,         // Change from the alarm is sent to this address, also the account that can owns the alarm. 
        //  this,           // In the future, I'd like the owner address to equal this contract and keep the wallet as the change address
            priorityCaller, // The priority fee is sent to this address
            this            // The contract to call at execution
        ];

        uint[12] memory uintOptions = [
            priorityFee,    // A fee that goes to the fee recipient
            timeBounty,     // The bounty for the account that triggers this alarm
            eacOptions[0],  // claimWindowSize
            eacOptions[1],  // freezeintervalDuration
            eacOptions[2],  // reservedWindowSize
            eacOptions[3],  // 2 = Use timestamp based scheduling instead of blocks
            eacOptions[4],  // The size of the execution window
            eacOptions[5],  // The start of the execution window
            eacOptions[6],  // The amount of gas to be sent with the transaction
            eacOptions[7],  // The amount of ether to be sent
            eacOptions[8],  // The minimum gas price for the alarm when called
            eacOptions[9]   // The required deposit by the claimer
        ];

        alarm = eac.createValidatedRequest.value(endowment)(addressOptions, uintOptions, "");

        if(alarm != address(0x0))
            emit ValidRequest_event(msg.sender, alarm);
        else
            emit InvalidRequest_event(eac.validateRequestParams(addressOptions, uintOptions, endowment));
    }

    /// @notice Calculates the amount of ether needed to fund each alarm
    /// @return The amount of ether to send when the payment delegate is called
    function amount () public view returns (uint) {
        uint gas = eacOptions[6];
        return maxGasPrice * gas * safetyMultiplier;
    }

    /// @notice Cancels the recurring alarm clock. Only callable by the task or a wallet delegate
    function cancel () public {
        require(msg.sender == task || wallet.isDelegate(msg.sender), "msg.sender is not the alarm task or a delegate");

        delegate.unschedule();
    }
    
    event Execute_event(uint indexed currentInterval, bool success);
    event Deposit_event (address indexed sender, uint amount);
    event ValidRequest_event (address indexed sender, address alarm);
    event InvalidRequest_event (bool[6] params);

}
