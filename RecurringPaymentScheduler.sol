pragma solidity ^0.4.23;

import "import/Owned.sol";
import "import/LibList.sol";
import "Interfaces.sol";

library RecurringPaymentSchedulerLib {
    function schedule(IRecurringPaymentScheduler scheduler, IRecurringPayment payment) public {
        scheduler.schedule(payment);
    }
}

contract RecurringPaymentScheduler is IRecurringPaymentScheduler {
    
    using LibList for LibList.AddressList;
    
    bytes4 constant CALL_DATA = bytes4(keccak256("trigger(address)"));
    address constant ETHER = address(0x0);
    
    mapping (address => LibList.AddressList) outgoingPayments;
    mapping (address => LibList.AddressList) incomingPayments;
    mapping (address => IRecurringPayment) payments;
    
    function schedule (IRecurringPayment payment) public returns (address alarm) {
        alarm = scheduleAlarmFor(payment);
        require(alarm != address(0x0));
        
        payments[alarm] = payment;
        
        outgoingPayments[payment.wallet()].add(alarm);
        incomingPayments[payment.recipient()].add(alarm);
    }
    
    function trigger (address alarm) public returns (address nextAlarm) {
        IRecurringPayment payment = payments[alarm];
        require(msg.sender == address(payment.wallet()));
        
        delete payments[alarm];
        outgoingPayments[payment.wallet()].remove(alarm);
        incomingPayments[payment.recipient()].remove(alarm);
        
        uint paymentAmount = payment.process();
        payment.wallet().transfer(
            payment.spendToken(),
            payment.recipient(),
            paymentAmount
        );
        
        nextAlarm = scheduleAlarmFor(payment);
        if(nextAlarm != address(0x0)) {
            payments[nextAlarm] = payment;
            outgoingPayments[payment.wallet()].add(nextAlarm);
            incomingPayments[payment.recipient()].add(nextAlarm);
        }
    }
    
    function scheduleAlarmFor (IRecurringPayment payment) internal returns (address alarm) {
        IAlarmClock alarmClock = payment.alarmClock();
        IDelegatedWallet wallet = payment.wallet();
        uint alarmCost = alarmClock.getNextAlarmCost();
        address alarmToken = alarmClock.token();
        bool alarmPaid = wallet.transfer(
            alarmToken, 
            this, 
            alarmCost
        );
        
        if(alarmPaid){
            if(alarmToken == ETHER) {
                alarm = alarmClock.setNextAlarm.value(alarmCost)();
            } else {
                payment.wallet().transfer(alarmToken, alarmClock, alarmCost);
                alarm = alarmClock.setNextAlarm();
            }
            
            if(alarm != address(0x0))
                payment.wallet().registerTrigger(alarm, wallet, CALL_DATA);
        }
    }
    
    function getIncomingPayments (address account) public view returns (address[]) {
        return incomingPayments[account].array;
    }
    
    function getOutgoingPayments (address account) public view returns (address[]) {
        return outgoingPayments[account].array;
    }
    
}
