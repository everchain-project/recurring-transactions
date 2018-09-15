pragma solidity ^0.4.23;

import "../../libraries/FuturePaymentLib.sol";
import "../../RecurringAlarmClockFactory.sol";
import "./RecurringPayment.sol";

contract RecurringPaymentFactory is CloneFactory {
    
    using FuturePaymentLib for IFuturePaymentDelegate;
    
    RecurringAlarmClockFactory public factory;
    RecurringPayment public blueprint;

    constructor (
        RecurringAlarmClockFactory _factory,
        RecurringPayment _blueprint
    ) public {
        factory = _factory;
        blueprint = _blueprint;
    }

    function createRecurringPayment (
        IDelegatedWallet delegatedWallet,
        IFuturePaymentDelegate paymentDelegate,
        address feeRecipient,
        address transferToken,
        address alarmToken,
        address recipient,
        uint[3] recurringAlarmClockOptions,
        uint[10] ethereumAlarmClockOptions,
        uint paymentAmount
    ) public returns (RecurringPayment) {
        RecurringPayment recurringPayment = RecurringPayment(createClone(blueprint));
        
        RecurringAlarmClock recurrungAlarmClock = factory.createRecurringAlarmClock(
            recurringPayment,
            delegatedWallet,
            paymentDelegate,
            feeRecipient,
            alarmToken,
            recurringAlarmClockOptions,
            ethereumAlarmClockOptions
        );
        
        recurringPayment.initialize(
            recurrungAlarmClock,    // the owner of the recurring payment
            paymentDelegate,        // the delegate that pulls funds from the wallet
            transferToken,          // the token to use when making a payment
            recipient,              // the recipient of the payment
            paymentAmount           // how much of the token to send each payment
        );

        paymentDelegate.schedule(recurrungAlarmClock, delegatedWallet);
        paymentDelegate.schedule(recurringPayment, delegatedWallet);
    }
    
}