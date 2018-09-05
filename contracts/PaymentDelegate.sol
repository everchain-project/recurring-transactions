pragma solidity ^0.4.23;

import "./Interfaces.sol";

library PaymentDelegateLib {
    function validate (IPaymentDelegate delegate, IFuturePayment payment) public returns (bool) {
        return delegate.register(payment);
    }
}

contract PaymentDelegate is IPaymentDelegate {

    mapping (address => bool) public valid;
    
    function transfer (address token, address recipient, uint amount) public returns (bool) {
        IFuturePayment payment = IFuturePayment(msg.sender);
        require(valid[payment], "payment is not valid");
        
        return payment.wallet().transfer(token, recipient, amount);
    }

    function register (IFuturePayment payment) public returns (bool) {
        require(payment.wallet().isDelegate(msg.sender), "msg.sender must be a delegate");
        require(payment.wallet().isDelegate(this), "this contract must be a delegate");

        valid[payment] = true;
    }
    
    function unregister (IFuturePayment payment) public {
        require(payment.wallet().isDelegate(msg.sender), "msg.sender must be a delegate");
        
        delete valid[payment];
    }

    function unregister () public {
        delete valid[msg.sender];
    }
    
}
