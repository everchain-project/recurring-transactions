pragma solidity ^0.4.23;

import "../../external/Owned.sol";
import "../../Interfaces.sol";

contract RecurringPayment is IPayment {
    
    uint public blockCreated;
    address public factory;

    address public executor;
    IPaymentDelegate public delegate;
    IDelegatedWallet public wallet;
    address public token;
    address public recipient;
    uint public paymentAmount;
    
    function initialize (
        address _executor,
        IPaymentDelegate _delegate,
        IDelegatedWallet _wallet,
        address _token,
        address _recipient,
        uint _amount
    ) public {
        require(blockCreated == 0, "contract can only be initialized once");

        blockCreated = block.number;
        factory = msg.sender;

        executor = _executor;
        delegate = _delegate;
        wallet = _wallet;
        token = _token;
        recipient = _recipient;

        paymentAmount = _amount;
    }

    function getOptions () public view returns (address[5], uint) {
        return (
            [
                executor,
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
    
    function () public {
        require(msg.sender == executor, "msg.sender is not the alarm clock");

        delegate.execute();
        IRecurringAlarmClock alarmClock = IRecurringAlarmClock(executor);
        if(alarmClock.currentInterval() == alarmClock.maximumIntervals())
            delegate.unschedule();
    }

    function cancel () public {
        require(wallet.isDelegate(msg.sender), "msg.sender is not a delegate");

        IRecurringAlarmClock(executor).cancel();
        delegate.unschedule();
    }
    
}
