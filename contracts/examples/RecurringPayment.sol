pragma solidity ^0.4.23;

import "../external/Owned.sol";
import "../external/CloneFactory.sol";
import "../RecurringAlarmClock.sol";
import "../PaymentDelegate.sol";
import "../Interfaces.sol";

contract RecurringPayment is IFuturePayment, ITask, Owned {
    
    bool initialized;
    
    IPaymentDelegate public delegate;
    IDelegatedWallet public wallet;
    address public token;
    address public recipient;

    uint public amount;
    
    function initialize (
        IRecurringAlarmClock alarmClock,
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
        IPaymentDelegate paymentDelegate,
        address feeRecipient,
        address transferToken,
        address alarmToken,
        address recipient,
        uint[3] racOptions,
        uint[10] eacOptions,
        uint paymentAmount
    ) public returns (RecurringPayment) {
        RecurringPayment recurringPayment = RecurringPayment(createClone(blueprint));
        
        RecurringAlarmClock alarmClock = factory.createRecurringAlarmClock(
            recurringPayment,
            delegatedWallet,
            paymentDelegate,
            feeRecipient,
            alarmToken,
            racOptions,
            eacOptions
        );
        
        recurringPayment.initialize(
            alarmClock,         // the owner of the recurring payment
            paymentDelegate,    // the delegate that pulls funds from the wallet
            delegatedWallet,    // wallet to pull alarm funds from
            transferToken,      // the token to use when making a payment
            recipient,          // the recipient of the payment
            paymentAmount       // how much of the token to send each payment
        );

        PaymentDelegate(paymentDelegate).validate(alarmClock);
        PaymentDelegate(paymentDelegate).validate(recurringPayment);
    }
    
}
