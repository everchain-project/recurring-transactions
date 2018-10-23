pragma solidity ^0.4.23;

import "../../external/CloneFactory.sol";
import "../../Interfaces.sol";
import "./RecurringPayment.sol";

contract RecurringPaymentFactory is CloneFactory {

    uint public blockCreated;

    RecurringPayment public blueprint;

    constructor (RecurringPayment _blueprint) public {
        blockCreated = block.number;
        blueprint = _blueprint;
    }

    function createRecurringPayment (
        IRecurringAlarmClock alarmClock,
        IPaymentDelegate delegate,
        IDelegatedWallet wallet,
        address token,
        address recipient,
        uint paymentAmount
    ) public returns (RecurringPayment paymentTask) {
        paymentTask = RecurringPayment(createClone(blueprint));
        paymentTask.initialize(
            alarmClock,     // the alarm clock that acts as the executor of the payment
            delegate,       // the payment delegate that forwards each payment
            wallet,         // the delegated wallet the payment originates from
            token,          // the token to use when making a payment
            recipient,      // the recipient of the payment
            paymentAmount   // how much of the token to send each payment
        );

        emit CreatePayment_event(msg.sender, paymentTask);
    }

    event CreatePayment_event (address indexed creator, RecurringPayment recurringPayment);
    
}
