pragma solidity ^0.4.23;

import "./libraries/ListLib.sol";
import "./Interfaces.sol";

contract FuturePaymentDelegate is IFuturePaymentDelegate {

    using ListLib for ListLib.AddressList;

    mapping (address => IDelegatedWallet) public futurePayments;
    mapping (address => ListLib.AddressList) paymentList;
    
    function transfer (address token, address recipient, uint amount) public returns (bool) {
        IDelegatedWallet wallet = futurePayments[msg.sender];

        return wallet.transfer(token, recipient, amount);
    }

    function register (IFuturePayment payment, IDelegatedWallet wallet) public returns (bool) {
        require(wallet.isDelegate(msg.sender), "msg.sender must be a delegate");
        require(wallet.isDelegate(this), "this contract must be a delegate");

        futurePayments[payment] = wallet;
        paymentList[wallet].add(payment);
    }
    
    function unregister (IFuturePayment payment) public {
        IDelegatedWallet wallet = futurePayments[payment];
        require(wallet.isDelegate(msg.sender), "msg.sender must be a delegate");

        delete futurePayments[payment];
        paymentList[wallet].add(payment);
    }

    function unregister () public {
        IDelegatedWallet wallet = futurePayments[msg.sender];
        paymentList[wallet].remove(msg.sender);
        delete futurePayments[msg.sender];
    }
    
}
