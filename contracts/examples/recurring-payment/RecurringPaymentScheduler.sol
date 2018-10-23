pragma solidity ^0.4.23;

import "../../Interfaces.sol";
import "../recurring-payment/RecurringPaymentFactory.sol";
import "../recurring-payment/RecurringPayment.sol";
import "../RecurringAlarmClockAssistant.sol";

contract RecurringPaymentScheduler {

    uint public blockCreated;

    RecurringAlarmClockAssistant public Assistant;
    RecurringPaymentFactory public Factory;
    
    constructor (
        RecurringAlarmClockAssistant assistant,
        RecurringPaymentFactory factory
    ) public {
        blockCreated = block.number;
        Assistant = assistant;
        Factory = factory;
    }

    function createRecurringPayment (
        IPaymentDelegate delegate,
        IDelegatedWallet wallet,
        address token,
        address recipient,
        uint paymentAmount,
        uint startTimestamp,
        uint totalPayments,
        uint period,
        uint gas
    ) public returns (RecurringPayment paymentTask) {
        require(wallet.isDelegate(delegate), "payment delegate is not a delegate for the provided wallet");
        require(wallet.isDelegate(msg.sender), "msg.sender is not a delegate for the provided wallet");
        
        RecurringAlarmClock alarmClock = Assistant.createRecurringAlarmClock(
            delegate,       // the delegate that executes the payment
            wallet,         // the change address for excess ether not used during alarm execution and also the owner of the alarm
            startTimestamp, // the starting timestamp (in seconds)
            totalPayments,  // how many payments to execute
            period,         // how long between each payment (in seconds)
            gas             // how much gas to use when executing each alarm,
        );

        paymentTask = Factory.createRecurringPayment(
            alarmClock,     // the executor that calls each payment
            delegate,       // the delegate that executes the payment
            wallet,         // supplies delegates that can cancel the task
            token,          // the token to use when making a payment
            recipient,      // the recipient of the payment
            paymentAmount   // how much of the token to send each payment
        );

        delegate.schedule(alarmClock);  // schedules the alarm clock with the future payment delegate
        delegate.schedule(paymentTask); // schedules the payment task with the future payment delegate
        alarmClock.start(paymentTask);  // assigns the payment task to the alarm clock and starts the alarm

        emit CreatePayment_event(msg.sender, paymentTask);
    }

    event CreatePayment_event (address indexed owner, RecurringPayment recurringPayment);
    
}
