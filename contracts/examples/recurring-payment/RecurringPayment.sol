pragma solidity ^0.4.23;

import "../../external/Owned.sol";
import "../../Interfaces.sol";

contract RecurringPayment is IPayment {
    
    uint public blockCreated;
    address public factory;

    IRecurringAlarmClock alarmClock;
    IPaymentDelegate public delegate;
    IDelegatedWallet public wallet;
    address public token;
    address public recipient;
    uint public paymentAmount;
    
    function initialize (
        IPaymentDelegate _delegate,
        IDelegatedWallet _wallet,
        address _token,
        address _recipient,
        uint _amount
    ) public {
        require(blockCreated == 0, "contract can only be initialized once");

        blockCreated = block.number;
        factory = msg.sender;

        delegate = _delegate;
        wallet = _wallet;
        token = _token;
        recipient = _recipient;

        paymentAmount = _amount;
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
    
    function () public onlyAlarmClock {
        delegate.execute();

        if(alarmClock.currentInterval() == alarmClock.maximumIntervals())
            delegate.unschedule();
    }

    function cancel () public onlyDelegates {
        alarmClock.cancel();
        delegate.unschedule();
    }

    modifier onlyAlarmClock () {
        require(msg.sender == address(alarmClock), "msg.sender is not the alarm clock");
        _;
    }

    modifier onlyDelegates () {
        require(wallet.isDelegate(msg.sender), "msg.sender is not a delegate");
        _;
    }
    
}
