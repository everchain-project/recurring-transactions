pragma solidity ^0.5.0;

import "./external/BokkyPooBahsDateTimeLibrary.sol";
import "./external/Owned.sol";
import "./Interfaces.sol";

/// @title RecurringAlarmClock Contract
/// @author Joseph Reed
/// @dev This contract's goal is to execute recurring tasks completely on-chain. It requires four main components:
///      1. A source for on chain alarms. This contract uses the Ethereum Alarm Clock (eac)
///      2. A payment delegate with this alarm scheduled and permitted to pull funds for each alarm
///      3. A funded delegated wallet with the payment delegate set as a delegate
///      4. A recurring task to execute
contract RecurringAlarmClock is IRecurringAlarmClock, Owned {
    
    address public factory;             // The factory that deployed this contract
    
    // Payment Options
    IDelegatedWallet public wallet;     // The address which owns the alarm and collects any leftover funds
    IPaymentDelegate public delegate;   // The delegate that pulls funds for each alarm
    IGasPriceOracle public gasPrice;    // The fetches the current or future gas price of the network
    
    // Ethereum Alarm Clock Options
    RequestFactoryInterface public EthereumAlarmClock; // Interface provided by the Ethereum Alarm Clock
    address public priorityCaller;      // The priority recipient of part of the alarm deposit
    uint[5] public eacOptions;          // The options used when setting an alarm using the Ethereum Alarm Clock
    
    // Recurring Alarm Clock Options
    uint public windowStart;            // The start of the execution window for the next alarm
    uint public intervalValue;          // The value of the time unit when calculating the next alarm timestamp
    uint public intervalUnit;           // The time unit used when calculating the next alarm timestamp
                                        // 0 = seconds, 1 = minutes, 2 = hours, 3 = days, 4 = months, 5 = years
    uint public maxIntervals;           // The number of times this alarm will go off
    uint public currentInterval;        // Keeps track of how many alarms have been called
    uint public blockStarted;           // The block the alarm clock was started
    uint public extraGas;

    // Execution Options
    address public alarm;               // The next scheduled alarm contract
    address public task;                // The address of the task contract
    bytes public callData;              // The data for the task to execute when the alarm is triggered
    
    /// @notice Initializes the recurring alarm clock. Uses 'initialize()' instead of a constructor to make use of the clone 
    ///         factory at https://github.com/optionality/clone-factory. In general, 'initialize()' should be  
    ///         called directly following it's deployment through the use of a factory
    /// @param _factory
    /// @param _wallet The funding wallet, change address, and owner of the deployed alarms
    /// @param _delegate The delegate from which to pull alarm payments
    /// @param _gasPriceOracle The oracle that returns the current gas price of the network
    /// @param _safetyMultiplier The oracle that returns a recommended safety multiplier
    /// @param _eac The contract responsible for deploying decentralized alarms
    /// @param _priorityCaller The priority caller receives a base amount of the alarm fee regardless of if they call the alarm
    /// @param _safetyMultipler A multiplier used when calculating the cost of the next alarm
    /// @param _eacOptions The options used for creating decentralized alarms
    function initialize (
        address _factory, 
        IDelegatedWallet _wallet,
        IPaymentDelegate _delegate,
        IGasPriceOracle _oracle,
        RequestFactoryInterface _eac,
        address _priorityCaller,
        uint[5] memory _eacOptions
    ) public {
        require(factory == address(0x0), "The alarm has already been initialized");
        
        factory = _factory;                     // The factory that deployed this contract
        
        wallet = _wallet;
        delegate = _delegate;
        gasPrice = _oracle;
        EthereumAlarmClock = _eac;
        priorityCaller = _priorityCaller;
        eacOptions = _eacOptions;
    }

    function start(
        address _task, 
        bytes memory _callData,
        uint _windowStart,
        uint _intervalValue, 
        uint _intervalUnit, 
        uint _maxIntervals,
        uint extraGas
    ) public onlyDelegates {
        require(_windowStart > now + 5 minutes);
        require(_intervalValue > 0);
        require(_intervalUnit <= 5);
        require(_maxIntervals > 0);
        require(_task != address(0x0));

        windowStart = _windowStart;
        intervalValue = _intervalValue;
        intervalUnit = _intervalUnit;
        maxIntervals = _maxIntervals;
        task = _task;
        callData = _callData;

        blockStarted = block.number;    // The block number at the time of deployment
        currentInterval = 0;
        alarm = newAlarm();
    }

    /// @notice The default function collects ether sent by the payment delegate and is also called by
    ///         each alarm when they are triggered
    function () external payable {
        if(msg.value > 0)
            emit Deposit_event(msg.sender, msg.value);
        else
            handleAlarmCall();
    }

    /// @notice The heart of the recurring alarm clock.
    ///         1. Check if the caller is the current alarm
    ///         2. Execute the task
    ///         3. Reschedule the alarm
    ///         4. Cleanup
    function handleAlarmCall () internal {
        require(msg.sender == alarm, "only the executor can handle an alarm call");
        
        (bool success, bytes memory result) = address(task).call.gas(gasleft())(callData);

        if(currentInterval < maximumIntervals){
            if(intervalUnit == 0)
                windowStart = BokkyPooBahsDateTimeLibrary.addSeconds(windowStart, intervalValue);
            else if(intervalUnit == 1)
                windowStart = BokkyPooBahsDateTimeLibrary.addMinutes(windowStart, intervalValue);
            else if(intervalUnit == 2)
                windowStart = BokkyPooBahsDateTimeLibrary.addHours(windowStart, intervalValue);
            else if(intervalUnit == 3)
                windowStart = BokkyPooBahsDateTimeLibrary.addDays(windowStart, intervalValue);
            else if(intervalUnit == 4)
                windowStart = BokkyPooBahsDateTimeLibrary.addMonths(windowStart, intervalValue);
            else if(intervalUnit == 5)
                windowStart = BokkyPooBahsDateTimeLibrary.addYears(windowStart, intervalValue);
            
            alarm = newAlarm();
        }

        currentInterval++;

        emit Execute_event(currentInterval, success, result);
    }

    /// @notice Schedules a new alarm with the Ethereum Alarm Clock
    /// @return The new alarm scheduled
    function newAlarm () internal returns (address) {
        alarm = address(0x0);   // Clear the last alarm
        delegate.transfer(address(0x0), address(this), amount()); // Pull the necessary funds for the alarm
        
        uint endowment = address(this).balance;     // Commit all available ether to the next alarm
        uint priorityFee = endowment / 100;         // Set one percent aside for the priority caller
        uint timeBounty = endowment - priorityFee;  // Set the remaining ether aside for the time bounty

        address[3] memory addressOptions = [
            address(wallet),    // Change from the alarm is sent to this address, also the account that can owns the alarm. 
        //  address(this),      // In the future, I'd like the owner address to equal this contract and keep the wallet as the change address
            priorityCaller,     // The priority fee is sent to the priority caller
            address(this)       // The contract to call at execution
        ];

        uint[12] memory uintOptions = [
            priorityFee,    // A fee that goes to the fee recipient
            timeBounty,     // The bounty for the account that triggers this alarm
            eacOptions[0],  // claimWindowSize
            eacOptions[1],  // freezeintervalDuration
            eacOptions[2],  // reservedWindowSize
            2,              // 1 = use block based scheduling, 2 = Use timestamp based scheduling
            eacOptions[3],  // The size of the execution window
            windowStart,    // The start of the execution window
            eacOptions[4] + extraGas,  // The amount of gas to be sent with the transaction
            0,              // The amount of ether to be sent
            0,              // The minimum gas price for the alarm when called
            0               // The required deposit by the claimer
        ];

        alarm = EthereumAlarmClock.createValidatedRequest.value(endowment)(addressOptions, uintOptions, "");

        if(alarm != address(0x0))
            emit ValidRequest_event(msg.sender, alarm);
        else
            emit InvalidRequest_event(EthereumAlarmClock.validateRequestParams(addressOptions, uintOptions, endowment));
    }

    /// @notice Calculates the amount of ether needed to fund each alarm
    /// @return The amount of ether to send when the payment delegate is called
    function amount () public view returns (uint) {
        uint gas = eacOptions[4];
        return  gas * gasPrice.future(windowStart);
    }

    function updateCallData (bytes memory newCallData) public {
        require(msg.sender == task, "only the task can update the call data");

        callData = newCallData;
    }

    /// @notice Cancels the recurring alarm clock. Only callable by the task or a wallet delegate
    function cancel () public {
        require(msg.sender == task || wallet.isDelegate(msg.sender), "msg.sender is not the alarm task or a delegate");

        alarm = address(0x0);
    }

    function destroy () public onlyDelegates {
        delegate.unschedule();
        selfdestruct(address(wallet));
    }

    modifier onlyDelegates () {
        require(wallet.isDelegate(msg.sender), "only a wallet delegate can set the task");

        _;
    }
    
    event Execute_event(uint indexed currentInterval, bool success, bytes result);
    event Deposit_event (address indexed sender, uint amount);
    event ValidRequest_event (address indexed sender, address alarm);
    event InvalidRequest_event (bool[6] params);

}
