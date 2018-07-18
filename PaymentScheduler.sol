pragma solidity ^0.4.23;

import "import/Owned.sol";
import "import/LibList.sol";
import "components/Interfaces.sol";

library PaymentSchedulerLib {
    function create(IPaymentScheduler scheduler, IRecurringPayment payment) public {
        scheduler.schedule(payment);
    }
}

contract IPaymentScheduler {
    function schedule (IRecurringPayment payment) public returns (address alarm);
    function trigger (address alarm) public returns (address nextAlarm);
}

contract PaymentScheduler is IPaymentScheduler {
    
    using LibList for LibList.AddressList;
    
    bytes4 constant CALL_DATA = bytes4(keccak256("trigger(address)"));
    address constant ETHER = address(0x0);
    
    mapping (address => LibList.AddressList) outgoingPayments;
    mapping (address => LibList.AddressList) incomingPayments;
    mapping (address => IRecurringPayment) payments;
    
    function schedule (IRecurringPayment payment) public returns (address alarm) {
        alarm = scheduleAlarmFor(payment);
        require(alarm != address(0x0));
        
        outgoingPayments[payment.wallet()].add(alarm);
        incomingPayments[payment.recipient()].add(alarm);
    }
    
    function trigger (address alarm) public returns (address nextAlarm) {
        IRecurringPayment payment = payments[alarm];
        require(msg.sender == address(payment.wallet()));
        
        delete payments[alarm];
        outgoingPayments[payment.wallet()].remove(alarm);
        incomingPayments[payment.recipient()].remove(alarm);
        
        payment.wallet().transfer(
            payment.recipient(),
            payment.spendToken(),
            payment.process()
        );
        
        nextAlarm = scheduleAlarmFor(payment);
        if(nextAlarm != address(0x0)) {
            payments[nextAlarm] = payment;
            outgoingPayments[payment.wallet()].add(nextAlarm);
            incomingPayments[payment.recipient()].add(nextAlarm);
        }
    }
    
    function scheduleAlarmFor (IRecurringPayment payment) internal returns (address alarm) {
        uint alarmCost = payment.alarmClock().getNextAlarmCost();
        if(payment.wallet().transfer(this, ETHER, alarmCost))
            alarm = payment.alarmClock().setNextAlarm.value(alarmCost)();
            
        payment.wallet().registerTrigger(alarm, payment.wallet(), CALL_DATA);
    }
    
}
