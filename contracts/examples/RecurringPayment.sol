pragma solidity ^0.4.23;

import "../external/Owned.sol";
import "../external/CloneFactory.sol";
import "../RecurringAlarmClock.sol";
import "../FuturePaymentDelegate.sol";
import "../Interfaces.sol";

contract RecurringPayment is Owned, IFuturePayment {
    
    bool initialized;
    
    IFuturePaymentDelegate public delegate;
    IDelegatedWallet public wallet;
    address public token;
    address public recipient;

    uint public amount;
    
    function initialize (
        IRecurringAlarmClock alarmClock,
        IDelegatedWallet _wallet,
        IFuturePaymentDelegate _delegate,
        address _token,
        address _recipient,
        uint _amount
    ) public {
        require(!initialized);

        owner = alarmClock;
        delegate = _delegate;
        wallet = _wallet;
        token = _token;
        recipient = _recipient;

        amount = _amount;

        initialized = true;
    }
    
    function execute() public onlyOwner returns (bool success){
        return delegate.transfer(token, recipient, amount);
    }
    
}

