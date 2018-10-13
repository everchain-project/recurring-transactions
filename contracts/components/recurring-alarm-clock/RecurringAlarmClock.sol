pragma solidity ^0.4.23;

import "../../external/RequestFactoryInterface.sol";
import "../../Interfaces.sol";

contract RecurringAlarmClock is IFuturePayment {

    uint public blockCreated;               // The block the alarm clock was started
    
    RequestFactoryInterface public eac;     // Interface provided by the Ethereum Alarm Clock
    IFuturePaymentDelegate public delegate; // The delegate that pulls funds for each alarm
    IDelegatedWallet public wallet;         // The address which owns the alarm and collects any leftover funds
    ITask public task;                      // The address of the task contract
    address public priorityCaller;          // The priority recipient of part of the alarm deposit
    address public alarm;                   // The next scheduled alarm contract

    bytes public callData;                  // The data for the task to execute when the alarm is triggered

    uint[10] public eacOptions;             // The options used when setting an alarm using the Ethereum Alarm Clock
    uint public safetyMultiplier;           // The multiplier to use when calculating the alarm cost
    uint public intervalDuration;           // The amount of time between each alarm
    uint public maximumIntervals;           // The number of times this alarm will go off
    uint public currentInterval;            // Keeps track of how many alarms have been called

    function initialize (
        RequestFactoryInterface _eac,
        IFuturePaymentDelegate _delegate,
        IDelegatedWallet _wallet,
        address _priorityCaller,
        bytes _callData,
        uint[3] _recurringAlarmClockOptions,
        uint[10] _ethereumAlarmClockOptions
    ) public {
        require(blockCreated == 0, "contract can only be initialized once");

        eac = _eac;
        delegate = _delegate;
        wallet = _wallet;
        priorityCaller = _priorityCaller;

        callData = _callData;

        eacOptions = _ethereumAlarmClockOptions;
        safetyMultiplier = _recurringAlarmClockOptions[0];
        intervalDuration = _recurringAlarmClockOptions[1];
        maximumIntervals = _recurringAlarmClockOptions[2];
        currentInterval = 1;

        blockCreated = block.number;
    }

    function start (ITask _task) public {
        require(task == address(0x0), "task must not be set to start a task");

        task = _task;
        
        scheduleAlarm();
    }

    function () public payable {
        if(msg.value == 0)
            handleAlarmCall();
        else
            emit Deposit_event(msg.sender, msg.value);
    }

    function amount () public view returns (uint) {
        uint gas = eacOptions[6];
        return tx.gasprice * gas * safetyMultiplier / 10^18;
    }

    function cancel () public onlyTask {
        delegate.unschedule();
    }

    function handleAlarmCall () internal {
        require(msg.sender == alarm);
        
        bool success = address(task).call.gas(gasleft())(callData);
        emit Task_event(msg.sender, currentInterval, success);

        if(currentInterval <= maximumIntervals){
            currentInterval++;
            eacOptions[5] += intervalDuration;
            scheduleAlarm();
        } else {
            delegate.unschedule();
            alarm = address(0x0);
        }
    }

    function scheduleAlarm () internal {
        delegate.execute();
        
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
        require(msg.sender == address(task), "msg.sender is not the alarm task");
        _;
    }
    
    event Task_event(address alarm, uint currentInterval, bool success);
    event Deposit_event (address indexed sender, uint amount);
    event ValidRequest_event (address indexed sender, address alarm);
    event InvalidRequest_event (bool[6] params);

}
