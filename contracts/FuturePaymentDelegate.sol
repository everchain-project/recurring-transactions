pragma solidity ^0.4.23;

import "./utility/AddressList.sol";
import "./utility/AddressListFactory.sol";
import "./Interfaces.sol";

contract FuturePaymentDelegate is IFuturePaymentDelegate {

    uint public blockCreated;
    
    AddressListFactory public listFactory;
    AddressList public trustedSchedulers;

    mapping (address => IDelegatedWallet) public walletLookup;
    mapping (address => AddressList) public payments;

    function initialize (
        AddressListFactory _listFactory,
        AddressList _trustedSchedulers
    ) public {
        require(blockCreated == 0, "contract can only be initialized once");

        listFactory = _listFactory;
        trustedSchedulers = _trustedSchedulers;

        blockCreated = block.number;
    }

    function transfer (address token, address recipient, uint amount) public returns (bool) {
        IFuturePayment payment = IFuturePayment(msg.sender);
        IDelegatedWallet wallet = walletLookup[payment];
        return wallet.transfer(token, recipient, amount);
    }

    function schedule (IFuturePayment payment, IDelegatedWallet wallet) public onlyTrustedSchedulers returns (bool success) {
        if(payments[wallet] == address(0x0)) {
            address[] memory emptyList;
            payments[wallet] = listFactory.createAddressList(this, emptyList);
        }

        success = payments[wallet].add(payment);
        if(success) {
            walletLookup[payment] = wallet;
            emit schedule_event(msg.sender, wallet, payment);
        }
    }
    
    function unschedule (IFuturePayment payment) public returns (bool success) {
        IDelegatedWallet wallet = walletLookup[payment];
        require(wallet.isDelegate(msg.sender), "only a delegate can unschedule a payment");
        
        success = payments[wallet].remove(payment);
        if(success){
            delete walletLookup[payment];
            emit unschedule_event(payment, wallet, payment);
        }
    }

    function unschedule () public returns (bool success) {
        IFuturePayment payment = IFuturePayment(msg.sender);
        IDelegatedWallet wallet = walletLookup[payment];
        
        success = payments[wallet].remove(payment);
        if(success) {
            delete walletLookup[payment];
            emit unschedule_event(payment, wallet, payment);
        }
    }

    modifier onlyTrustedSchedulers () {
        require(trustedSchedulers.contains(msg.sender), "only a trusted payment factory can schedule a payment");
        _;
    }

    event schedule_event (address indexed delegate, IDelegatedWallet indexed wallet, IFuturePayment payment);
    event unschedule_event (address indexed delegate, IDelegatedWallet indexed wallet, IFuturePayment payment);

}
