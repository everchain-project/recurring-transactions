pragma solidity ^0.4.23;

import "../../external/Owned.sol";
import "../../Interfaces.sol";
import "../../RecurringAlarmClockWizard.sol";
import "./RecurringPayment.sol";

contract RecurringPaymentFactory is Owned, CloneFactory {

    RecurringAlarmClockWizard public wizard;
    RecurringPayment public blueprint;

    uint public gas;

    constructor (
        RecurringAlarmClockWizard _wizard,
        RecurringPayment _blueprint,
        uint _initialGas
    ) public {
        wizard = _wizard;
        blueprint = _blueprint;
        gas = _initialGas;
    }

    function createRecurringPayment (
        IFuturePaymentDelegate delegate,
        IDelegatedWallet wallet,
        address token,
        address recipient,
        uint paymentAmount,
        uint startTimestamp,
        uint totalPayments,
        uint period
    ) public returns (RecurringPayment paymentTask) {
        require(wallet.isDelegate(delegate), "future payment delegate is not a delegate for the provided wallet");
        require(wallet.isDelegate(msg.sender), "msg.sender is not a delegate for the provided wallet");
        
        RecurringAlarmClock alarmClock = wizard.createRecurringAlarmClock(
            delegate,       
            wallet,         
            startTimestamp,
            totalPayments,
            period,
            gas
        );

        paymentTask = RecurringPayment(createClone(blueprint));
        paymentTask.initialize(
            alarmClock,     // the owner of the recurring payment
            delegate,       // the wallet that executes the payment
            wallet,         // supplies delegates that can cancel the task
            token,          // the token to use when making a payment
            recipient,      // the recipient of the payment
            paymentAmount   // how much of the token to send each payment
        );

        delegate.schedule(alarmClock, wallet);
        delegate.schedule(paymentTask, wallet);
        
        alarmClock.start(paymentTask);

        emit CreatePayment_event(msg.sender, delegate, paymentTask);
    }

    function setGas (uint newGas) public onlyOwner {
        gas = newGas;
    }

    event CreatePayment_event (
        address indexed owner,
        IFuturePaymentDelegate indexed delegate,
        RecurringPayment recurringPayment
    );
    
}
