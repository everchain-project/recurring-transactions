pragma solidity ^0.4.23;

import "../external/Owned.sol";
import "../Interfaces.sol";
import "../utility/AddressListFactory.sol";
import "../utility/RecurringAlarmClockScheduler.sol";
import "./RecurringPaymentFactory.sol";
import "./RecurringPayment.sol";

contract RecurringPaymentScheduler is Owned, CloneFactory {

    address[] emptyList;

    RecurringAlarmClockScheduler public scheduler;
    RecurringPaymentFactory public paymentFactory;
    
    constructor (
        RecurringAlarmClockScheduler _scheduler,
        RecurringPaymentFactory _paymentFactory
    ) public {
        scheduler = _scheduler;
        paymentFactory = _paymentFactory;
    }

    function createRecurringPayment (
        IFuturePaymentDelegate delegate,
        IDelegatedWallet wallet,
        address token,
        address recipient,
        uint paymentAmount,
        uint startTimestamp,
        uint totalPayments,
        uint period,
        uint gas
    ) public returns (RecurringPayment paymentTask) {
        require(wallet.isDelegate(delegate), "future payment delegate is not a delegate for the provided wallet");
        require(wallet.isDelegate(msg.sender), "msg.sender is not a delegate for the provided wallet");
        
        RecurringAlarmClock alarmClock = scheduler.createRecurringAlarmClock(
            delegate,       
            wallet,         
            startTimestamp,
            totalPayments,
            period,
            gas
        );

        paymentTask = paymentFactory.createRecurringPayment(
            alarmClock,     // the owner of the recurring payment
            delegate,       // the wallet that executes the payment
            wallet,         // supplies delegates that can cancel the task
            token,          // the token to use when making a payment
            recipient,      // the recipient of the payment
            paymentAmount   // how much of the token to send each payment
        );

        delegate.schedule(alarmClock);
        delegate.schedule(paymentTask);
        alarmClock.start(paymentTask);

        emit CreatePayment_event(msg.sender, paymentTask);
    }

    event CreatePayment_event (
        address indexed owner, 
        RecurringPayment recurringPayment
    );
    
}
