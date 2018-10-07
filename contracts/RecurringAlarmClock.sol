pragma solidity ^0.4.23;

import "./external/RequestFactoryInterface.sol";
import "./Interfaces.sol";

contract RecurringAlarmClock is IRecurringAlarmClock {

    uint public blockStarted;               // The block the alarm clock was started
    address constant ETHER = address(0x0);  // Used for code readability
    
    ITask public task;                      // The task to execute when the alarm is triggered
    RequestFactoryInterface public eac;     // Interface provided by the Ethereum Alarm Clock
    IFuturePaymentDelegate public delegate; // The delegate that pulls funds for each alarm
    address public wallet;                  // The address which owns the alarm and collects any leftover funds
    address public priorityCaller;          // The priority recipient of part of the alarm deposit
    address public alarm;                   // The next scheduled alarm contract

    uint[10] public eacOptions;             // The options used when setting an alarm using the Ethereum Alarm Clock
    uint public safetyMultiplier;           // The multiplier to use when calculating the alarm cost
    uint public period;                     // The amount of time between each alarm
    uint public maxIntervals;               // The number of times this alarm will go off
    uint public currentInterval;            // Keeps track of how many alarms have been called

    function initialize (
        RequestFactoryInterface _eac,
        IFuturePaymentDelegate _delegate,
        address _wallet,
        address _priorityCaller,
        uint[3] _recurringAlarmClockOptions,
        uint[10] _ethereumAlarmClockOptions
    ) public {
        require(blockStarted == 0, "contract can only be before the alarm clock is started");

        eac = _eac;
        wallet = _wallet;
        delegate = _delegate;
        priorityCaller = _priorityCaller;

        eacOptions = _ethereumAlarmClockOptions;
        safetyMultiplier = _recurringAlarmClockOptions[0];
        period = _recurringAlarmClockOptions[1];
        maxIntervals = _recurringAlarmClockOptions[2];
        currentInterval = 1;
        
        blockStarted = block.number;
    }

    function start (ITask _task) public {
        require(task == address(0x0), "contract can only be started when the alarm is empty");
        
        task = _task;
        
        scheduleAlarm();
    }

    function cancel () public onlyTask {
        delegate.unschedule();
    }

    function amount () public view returns (uint) {
        uint gas = eacOptions[6];
        return tx.gasprice * gas; // return tx.gasprice * gas * safetyMultiplier / 10^18;
    }

    function () public payable {
        if(msg.value == 0)
            handleAlarmCall();
        else
            emit Deposit_event(msg.sender, msg.value);
    }

    function handleAlarmCall () internal {
        require(msg.sender == address(alarm));
        
        bool finished = currentInterval == maxIntervals;
        task.execute(currentInterval, maxIntervals); // ignore success or failure

        if(finished){
            delegate.unschedule();
            alarm = address(0x0);
        } else {
            currentInterval++;
            eacOptions[5] += period;
            scheduleAlarm();
        }
    }

    function scheduleAlarm () internal {
        delegate.transfer(ETHER, this, amount());
        
        uint endowment = address(this).balance;    
        uint priorityFee = endowment / 100;
        uint callBounty = endowment - priorityFee;

        address[3] memory addressOptions = [
        //  this,           // In the future, I'd like the owner address to equal this contract and keep the wallet as the change address
            wallet,         // Change from the alarm is sent to this address, also the account that can owns the alarm. 
            priorityCaller, // The priority fee is sent to this address
            this            // The contract to call at execution
        ];

        uint[12] memory uintOptions = [
            priorityFee,    // A fee that goes to the fee recipient
            callBounty,     // The bounty for the account that triggers this alarm
            eacOptions[0],  // claimWindowSize
            eacOptions[1],  // freezePeriod
            eacOptions[2],  // reservedWindowSize
            eacOptions[3],  // 2 = Use timestamp based scheduling instead of blocks
            eacOptions[4],  // The size of the execution window
            eacOptions[5],  // The start of the execution window
            eacOptions[6],  // The amount of gas to be sent with the transaction
            eacOptions[7],  // The amount of ether to be sent
            eacOptions[8],  // The minimum gas price for the alarm when called
            eacOptions[9]   // The required deposit by the claimer
        ];

        bool[6] memory params = eac.validateRequestParams(
            addressOptions,
            uintOptions,
            endowment
        );

        if(params[0] && params[1] && params[2] && params[3] && params[4] && params[5]){
            alarm = eac.createValidatedRequest.value(endowment)(addressOptions, uintOptions, "");
            emit ValidRequest_event(msg.sender, alarm);
        } else {
            emit InvalidRequest_event(params);
        }
    }

    modifier onlyTask () {
        require(msg.sender == address(task));
        _;
    }
    
    event Deposit_event (address indexed sender, uint amount);
    event ValidRequest_event (address sender, address alarm);
    event InvalidRequest_event (bool[6] params);
}
