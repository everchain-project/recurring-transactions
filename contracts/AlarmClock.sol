pragma solidity ^0.4.23;

import "./external/EthereumAlarmClock.sol";
import "./external/CloneFactory.sol";
import "./Interfaces.sol";

contract AlarmClock is IAlarmClock {
    
    address public alarm;                   // The next scheduled alarm

    RequestFactoryInterface public eac; // Provided by the Ethereum Alarm Clock
    IPaymentDelegate public delegate;   // The delegate that pulls the funds from the wallet
    IDelegatedWallet public wallet;     // The wallet that funds each alarm deposit
    ITask public task;                  // The task to execute when the alarm is triggered
    address public token;               // The token to pull from the wallet
    address public feeRecipient;            // The special recipient of part of the alarm deposit
    
    uint[10] public options;            // The options available for setting an alarm
    uint public alarmDeposit;           // The amount of ether to pull from the delegated wallet
    uint public maxIntervals;           // The number of times this alarm will go off
    uint public currentInterval;        // Used to keep track of how many alarms have been called

    function initialize (
        RequestFactoryInterface _factory,
        IPaymentDelegate _delegate,
        IDelegatedWallet _wallet,
        ITask _task,
        address _token,
        uint[10] _options,
        uint _deposit,
        uint _maxIntervals
    ) public {
        eac = _factory;
        delegate = _delegate;
        wallet = _wallet;
        task = _task;
        token = _token;
        options = _options;
        alarmDeposit = _deposit;
        maxIntervals = _maxIntervals;

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
            delegate.transfer(token, this, alarmDeposit);
            alarm = createAlarm();
            currentInterval++;
        }
        
        if(alarm == address(0x0)){
            address(wallet).transfer(address(this).balance);
            delegate.unregister();
        }
    }

    function createAlarm () internal returns (address) {
        uint etherPayment = address(this).balance;    
        uint protocolFee = etherPayment / 100;
        uint callBounty = etherPayment - protocolFee;
        
        return eac.createRequest.value(etherPayment)(
            [
                wallet,         // Change from the alarm is sent to this address, also the account that can owns the alarm. In the future, I'd like these two functions seperated
                feeRecipient,   // The protocol fee is sent to this address
                this            // The contract to call at execution
            ],[
                protocolFee,    // A fee that goes to maintaining and the protocol
                callBounty,     // The bounty for the account that triggers this alarm
                options[0],     // claimWindowSize
                options[1],     // freezePeriod
                options[2],     // reservedWindowSize
                options[3],     // 2 = Use timestamp based scheduling instead of blocks
                options[4],     // The size of the execution window
                options[5],     // The start of the execution window
                options[6],     // The amount of gas to be sent with the transaction
                options[7],     // The amount of ether to be sent
                options[8],     // The minimum gas price for the alarm when called
                options[9]      // The required ether the caller must deposit
            ],
            ""                  // The data used when the alarm is triggered
        );
    }
    
}

contract AlarmClockFactory is CloneFactory {
    
    RequestFactoryInterface public ethereumAlarmClock;
    address public alarmClockBlueprint;

    constructor (
        RequestFactoryInterface _ethereumAlarmClock, 
        address _alarmClockBlueprint
    ) public {
        ethereumAlarmClock = _ethereumAlarmClock;
        alarmClockBlueprint = _alarmClockBlueprint;
    }

    function createAlarmClock(
        IPaymentDelegate delegate,
        IDelegatedWallet wallet,
        ITask task,
        address token,
        uint[10] options,
        uint deposit,
        uint maxIntervals
    ) public returns (AlarmClock alarmClock) {
        alarmClock = AlarmClock(createClone(alarmClockBlueprint));
        alarmClock.initialize(
            ethereumAlarmClock,
            delegate,
            wallet,
            task,
            token,
            options,
            deposit,
            maxIntervals
        );
    }

}