pragma solidity ^0.4.23;

import "PaymentScheduler.sol";

contract SimplePayment is IRecurringPayment {
    
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

contract SimplePaymentScheduler {
    
    using PaymentSchedulerLib for IPaymentScheduler;
    
    IPaymentScheduler public paymentScheduler = IPaymentScheduler(0x0);
    SchedulerInterface public EthereumAlarmClock = SchedulerInterface(0x31bBbf5180f2bD9C213e2E1D91a439677243268A);
    IPriceOracle public priceOracle = new PriceOracle();
    
    function scheduleSimplePayment (
        uint[6] alarmOptions,
        IDelegatedWallet wallet,
        address recipient,
        address spendToken,
        uint amount
    ) public {
        AlarmClock alarmClock = new AlarmClock();
        alarmClock.init(wallet, alarmOptions);
        alarmClock.transferOwnership(paymentScheduler);
        
        SimplePayment payment = new SimplePayment();
        payment.init(alarmClock, wallet, recipient, spendToken, amount);
        payment.transferOwnership(paymentScheduler);
        
        paymentScheduler.create(payment);
    }
    
}