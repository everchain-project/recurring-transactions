pragma solidity ^0.4.23;

import "../../external/CloneFactory.sol";
import "../../FuturePaymentDelegate.sol";
import "../../RecurringAlarmClock.sol";
import "../../Interfaces.sol";

contract RecurringPayment is IFuturePayment, ITask {
    
    bool initialized;
    
    RecurringAlarmClock public alarm;
    IFuturePaymentDelegate public delegate;
    address public token;
    address public recipient;
    uint public paymentAmount;
    
    function initialize (
        RecurringAlarmClock _recurringAlarmClock,
        IFuturePaymentDelegate _futurePaymentDelegate,
        address _token,
        address _recipient,
        uint _amount
    ) public {
        require(!initialized);

        alarm = _recurringAlarmClock;
        delegate = _futurePaymentDelegate;
        token = _token;
        recipient = _recipient;
        paymentAmount = _amount;

        initialized = true;
    }
    
    function execute(bool finalPayment) public onlyAlarm returns (bool success){
        success = delegate.transfer(token, recipient, amount());
        
        if(finalPayment)
            delegate.unregister();
    }

    function amount () public view returns (uint) {
        return paymentAmount;
    }

    modifier onlyAlarm () {
        require(msg.sender == address(alarm));
        _;
    }
    
}

