pragma solidity ^0.4.23;

import "../../external/Owned.sol";
import "../../Interfaces.sol";

contract RecurringPayment is IFuturePayment {
    
    uint public blockCreated;

    ITask alarmClock;
    IFuturePaymentDelegate public delegate;
    IDelegatedWallet public wallet;
    address public token;
    address public recipient;
    uint public paymentAmount;
    
    function initialize (
        IFuturePaymentDelegate _delegate,
        IDelegatedWallet _wallet,
        address _token,
        address _recipient,
        uint _amount
    ) public {
        require(blockCreated == 0, "contract can only be initialized once");

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
    
    function () public onlyAlarmClock {
        delegate.execute();
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
