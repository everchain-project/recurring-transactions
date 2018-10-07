pragma solidity ^0.4.23;

import "../Interfaces.sol";

contract RecurringPayment is IFuturePayment, ITask {
    
    uint public blockCreated;

    IRecurringAlarmClock public alarmClock;
    IFuturePaymentDelegate public delegate;
    IDelegatedWallet public wallet;
    address public token;
    address public recipient;
    uint public paymentAmount;
    
    function initialize (
        IRecurringAlarmClock _alarmClock,
        IFuturePaymentDelegate _delegate,
        IDelegatedWallet _wallet,
        address _token,
        address _recipient,
        uint _amount
    ) public {
        require(blockCreated == 0, "contract can only be initialized once");

        alarmClock = _alarmClock;
        delegate = _delegate;
        wallet = _wallet;
        token = _token;
        recipient = _recipient;
        paymentAmount = _amount;

        blockCreated = block.number;
    }

    function getOptions () public view returns (address[5], uint) {
        return (
            [
                address(alarmClock),
                delegate,
                wallet,
                token,
                recipient
            ],
            paymentAmount
        );
    }

    function amount () public view returns (uint) {
        return paymentAmount;
    }
    
    function execute(uint currentInterval, uint maxIntervals) public onlyAlarmClock returns (bool success){
        success = delegate.transfer(token, recipient, amount());
        
        if(currentInterval == maxIntervals)
            delegate.unschedule();
    }

    function cancel () public onlyDelegates {
        alarmClock.cancel();
        delegate.unschedule();
    }

    modifier onlyAlarmClock () {
        require(msg.sender == address(alarmClock), "only the alarm can call this function");
        _;
    }

    modifier onlyDelegates () {
        require(wallet.isDelegate(msg.sender), "only a delegate can call this function");
        _;
    }
    
}
