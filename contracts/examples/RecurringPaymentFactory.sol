pragma solidity ^0.4.23;

import "../libraries/FuturePaymentLib.sol";
import "../RecurringAlarmClockFactory.sol";
import "../examples/RecurringPayment.sol";

contract RecurringPaymentFactory is CloneFactory {
    
    using FuturePaymentLib for IFuturePaymentDelegate;
    
    RecurringPayment public blueprint;
    RecurringAlarmClockFactory public factory;

    constructor (
        RecurringPayment _blueprint,
        RecurringAlarmClockFactory _factory
    ) public {
        blueprint = _blueprint;
        factory = _factory;
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
            delegatedWallet,        // wallet to pull alarm funds from
            paymentDelegate,        // the delegate that pulls funds from the wallet
            transferToken,          // the token to use when making a payment
            recipient,              // the recipient of the payment
            paymentAmount           // how much of the token to send each payment
        );

        paymentDelegate.schedule(recurrungAlarmClock);
        paymentDelegate.schedule(recurringPayment);
    }
    
}