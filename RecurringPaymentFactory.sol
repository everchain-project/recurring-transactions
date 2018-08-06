pragma solidity ^0.4.23;

import "Interfaces.sol";
import "import/CloneFactory.sol";
import "components/AlarmClock.sol";

contract SimpleRecurringPayment is IRecurringPayment {
    
    IAlarmClock public alarmClock;
    IDelegatedWallet public wallet;
    address public recipient;
    address public spendToken;
    uint public amount;
    
    function init (
        IAlarmClock _alarmClock,
        IDelegatedWallet _wallet,
        address _recipient,
        address _spendToken, 
        uint _amount
    ) public {
        alarmClock = _alarmClock;
        wallet = _wallet;
        recipient = _recipient;
        spendToken = _spendToken;
        amount = _amount;
    }
    
    function process () public onlyOwner returns (uint paymentAmount) {
        return amount;
    }
    
}

contract SimpleRecurringPaymentFactory is CloneFactory {
    
    IRecurringPaymentScheduler public recurringScheduler = IRecurringPaymentScheduler(0x6C21887FFCDDC1bE5Bad4E3686cBE32Fa98Ef3A2);
    SchedulerInterface public ethereumAlarmClock = SchedulerInterface(0x31bBbf5180f2bD9C213e2E1D91a439677243268A);
    
    address public alarmClockBlueprint;
    address public simpleRecurringPaymentBlueprint;
    
    function scheduleRecurringPayment (
        uint[7] alarmOptions,
        IDelegatedWallet wallet,
        address recipient,
        address spendToken,
        uint amount
    ) public {
        AlarmClock alarmClock = AlarmClock(createClone(alarmClockBlueprint));
        alarmClock.init(ethereumAlarmClock, wallet, alarmOptions, "");
        alarmClock.transferOwnership(recurringScheduler);
        
        SimpleRecurringPayment payment = SimpleRecurringPayment(
            createClone(simpleRecurringPaymentBlueprint)
        );
        payment.init(alarmClock, wallet, recipient, spendToken, amount);
        payment.transferOwnership(recurringScheduler);
        
        recurringScheduler.schedule(payment);
    }
    
}
