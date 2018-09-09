pragma solidity ^0.4.23;

import "./external/EthereumAlarmClock.sol";
import "./external/CloneFactory.sol";
import "./Interfaces.sol";

contract RecurringAlarmClock is IRecurringAlarmClock {
    
    IDelegatedWallet public wallet;         // The wallet that funds each alarm deposit
    IFuturePaymentDelegate public delegate; // The delegate that pulls the deposit from the wallet
    address public token;                   // The token the delegate pulls from the wallet
    uint public deposit;                    // The amount of tokens to pull from the wallet

    RequestFactoryInterface public eac;     // Interface provided by the Ethereum Alarm Clock
    uint[10] public eacOptions;             // The options used when setting an alarm using the Ethereum Alarm Clock
    address public feeRecipient;            // The priority recipient of part of the alarm deposit
    address public alarm;                   // The next scheduled alarm contract

    ITask public task;                      // The task to execute when the alarm is triggered
    uint public period;                     // The amount of time between each alarm
    uint public maxIntervals;               // The number of times this alarm will go off
    uint public currentInterval;            // Keeps track of how many alarms have been called

    function initialize (
        ITask _task,
        IDelegatedWallet _wallet,
        IFuturePaymentDelegate _delegate,
        RequestFactoryInterface _eac,
        address _feeRecipient,
        address _token,
        uint[3] _recurringAlarmClockOptions,
        uint[10] _ethereumAlarmClockOptions
    ) public payable {
        task = _task;
        wallet = _wallet;
        delegate = _delegate;
        eac = _eac;
        feeRecipient = _feeRecipient;
        token = _token;
        deposit = _recurringAlarmClockOptions[0];
        period = _recurringAlarmClockOptions[1];
        maxIntervals = _recurringAlarmClockOptions[2];
        eacOptions = _ethereumAlarmClockOptions;

        scheduleAlarm();
    }
    
    function () public {
        require(msg.sender == alarm);

        task.execute(); // ignore success or failure

        scheduleAlarm();
    }

    function scheduleAlarm () internal {
        alarm = address(0x0);

        if(currentInterval <= maxIntervals){
            delegate.transfer(token, this, deposit);
            alarm = createAlarm();
            eacOptions[5] += period;
            currentInterval++;
        }
        
        if(alarm == address(0x0)){
            address(wallet).transfer(address(this).balance);
            delegate.unregister();
        }
    }

    function createAlarm () internal returns (address) {
        uint etherPayment = address(this).balance;    
        uint priorityFee = etherPayment / 100;
        uint callBounty = etherPayment - priorityFee;
        
        return eac.createRequest.value(etherPayment)(
            [
                wallet,         // Change from the alarm is sent to this address, also the account that can owns the alarm. In the future, I'd like these two functions seperated
                feeRecipient,   // The priority fee is sent to this address
                this            // The contract to call at execution
            ],[
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
                eacOptions[9]   // The required ether the caller must deposit
            ],
            ""                  // The data used when the alarm is triggered
        );
    }
    
}
