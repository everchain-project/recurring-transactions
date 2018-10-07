pragma solidity ^0.4.23;

import "./utility/AddressListFactory.sol";
import "./Interfaces.sol";

contract FuturePaymentDelegate is IFuturePaymentDelegate {

    uint public blockCreated;
    address[] emptyList;
    
    AddressListFactory public listFactory;
    AddressList public trustedSchedulers;

    mapping (address => AddressList) public incoming;
    mapping (address => AddressList) public outgoing;

    function initialize (AddressListFactory _listFactory, AddressList _trustedSchedulers) public {
        require(blockCreated == 0, "contract can only be initialized once");

        listFactory = _listFactory;
        trustedSchedulers = _trustedSchedulers;

        blockCreated = block.number;
    }

    function transfer (address token, address recipient, uint amount) public returns (bool success) {
        IFuturePayment payment = IFuturePayment(msg.sender);
        success = payment.wallet().transfer(token, recipient, amount);
        emit Payment_event(payment, amount);
    }

    function schedule (IFuturePayment payment) public onlyTrustedSchedulers returns (bool) {
        address recipient = payment.recipient();
        IDelegatedWallet wallet = payment.wallet();

        if(incoming[recipient] == address(0x0))
            incoming[recipient] = listFactory.createAddressList(this, emptyList);

        if(outgoing[wallet] == address(0x0))
            outgoing[wallet] = listFactory.createAddressList(this, emptyList);

        require(incoming[recipient].add(payment));
        require(outgoing[wallet].add(payment));

        emit Schedule_event(msg.sender, wallet, payment);

        return true;
    }
    
    function unschedule (IFuturePayment payment) public returns (bool) {
        IDelegatedWallet wallet = payment.wallet();
        require(wallet.isDelegate(msg.sender), "only a delegate can unschedule a payment");
        require(outgoing[wallet].remove(payment));
        require(incoming[payment.recipient()].remove(payment));

        emit Unschedule_event(payment, wallet, payment);

        return true;
    }

    function unschedule () public returns (bool) {
        IFuturePayment payment = IFuturePayment(msg.sender);
        IDelegatedWallet wallet = payment.wallet();
        outgoing[wallet].remove(payment);
        incoming[payment.recipient()].remove(payment);

        emit Unschedule_event(payment, wallet, payment);

        return true;
    }

    modifier onlyTrustedSchedulers () {
        require(trustedSchedulers.contains(msg.sender), "only a trusted payment factory can schedule a payment");
        _;
    }

    event Schedule_event (address indexed delegate, IDelegatedWallet indexed wallet, IFuturePayment payment);
    event Unschedule_event (address indexed delegate, IDelegatedWallet indexed wallet, IFuturePayment payment);
    event Payment_event (IFuturePayment indexed payment, uint amount);

}
