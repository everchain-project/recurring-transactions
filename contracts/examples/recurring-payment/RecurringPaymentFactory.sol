pragma solidity ^0.4.23;

import "../../external/CloneFactory.sol";
import "../../Interfaces.sol";
import "./RecurringPayment.sol";

contract RecurringPaymentFactory is CloneFactory {

    RecurringPayment public blueprint;

    constructor (RecurringPayment _blueprint) public {
        blueprint = _blueprint;
    }

    function createRecurringPayment (
        IFuturePaymentDelegate delegate,
        IDelegatedWallet wallet,
        address token,
        address recipient,
        uint paymentAmount
    ) public returns (RecurringPayment paymentTask) {
        paymentTask = RecurringPayment(createClone(blueprint));
        paymentTask.initialize(
            delegate,       // the wallet that executes the payment
            wallet,         // supplies delegates that can cancel the task
            token,          // the token to use when making a payment
            recipient,      // the recipient of the payment
            paymentAmount   // how much of the token to send each payment
        );

        emit CreatePayment_event(msg.sender, paymentTask);
    }

    event CreatePayment_event (address indexed creator, RecurringPayment recurringPayment);
    
}
