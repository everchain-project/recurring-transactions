pragma solidity ^0.4.23;

import "../Interfaces.sol";

library FuturePaymentLib {
    function schedule (IFuturePaymentDelegate delegate, IFuturePayment payment) public returns (bool) {
        return delegate.register(payment);
    }
}