pragma solidity ^0.4.23;

import "../Interfaces.sol";

library FuturePaymentLib {
    function schedule (IFuturePaymentDelegate delegate, IFuturePayment payment, IDelegatedWallet wallet) public returns (bool) {
        return delegate.register(payment, wallet);
    }
}