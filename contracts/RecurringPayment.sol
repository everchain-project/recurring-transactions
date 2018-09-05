pragma solidity ^0.4.23;

import "./external/Owned.sol";
import "./external/CloneFactory.sol";
import "./PaymentDelegate.sol";
import "./AlarmClock.sol";
import "./Interfaces.sol";

contract RecurringPayment is IFuturePayment, ITask, Owned {
    
    bool initialized;
    
    IPaymentDelegate public delegate;
    IDelegatedWallet public wallet;
    address public token;
    address public recipient;

    uint public amount;
    
    function initialize (
        IAlarmClock alarmClock,
        IPaymentDelegate _delegate,
        IDelegatedWallet _wallet,
        address _token,
        address _recipient,
        uint _amount
    ) public {
        require(!initialized);

        owner = alarmClock;
        delegate = IPaymentDelegate(_delegate);
        wallet = IDelegatedWallet(_wallet);
        token = _token;
        recipient = _recipient;

        amount = _amount;

        initialized = true;
    }
    
    function execute() public onlyOwner returns (bool success){
        return delegate.transfer(token, recipient, amount);
    }
    
}

contract RecurringPaymentFactory is CloneFactory {
    
    using PaymentDelegateLib for PaymentDelegate;
    
    address public paymentBlueprint;

    function create (
        AlarmClockFactory alarmClockfactory,
        IPaymentDelegate paymentDelegate,
        IDelegatedWallet delegatedWallet,
        address alarmToken,
        address transferToken,
        address recipient,
        uint amount,
        uint[10] alarmOptions,
        uint alarmDeposit,
        uint maxIntervals
    ) public returns (RecurringPayment recurringPayment) {
        recurringPayment = RecurringPayment(createClone(paymentBlueprint));

        AlarmClock alarmClock = alarmClockfactory.createAlarmClock(
            paymentDelegate,
            delegatedWallet,
            recurringPayment,
            alarmToken,
            alarmOptions,
            alarmDeposit,
            maxIntervals
        );
        
        recurringPayment.initialize(
            alarmClock,         // the owner of the recurring payment
            paymentDelegate,    // the delegate that pulls funds from the wallet
            delegatedWallet,    // wallet to pull alarm funds from
            transferToken,      // the token to use when making a payment
            recipient,          // the recipient of the payment
            amount              // how much of the token to send each payment
        );

        PaymentDelegate(paymentDelegate).validate(alarmClock);
        PaymentDelegate(paymentDelegate).validate(recurringPayment);
    }
    
}
