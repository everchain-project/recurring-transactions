pragma solidity ^0.4.23;

import "../../external/Owned.sol";
import "../../libraries/ListLib.sol";
import "../../Interfaces.sol";

contract PaymentDelegate is Owned, IPaymentDelegate, ITokenSender {

    using ListLib for ListLib.AddressList;

    uint public blockCreated;
    address public factory;

    ListLib.AddressList schedulers;

    mapping (address => ListLib.AddressList) incoming;
    mapping (address => ListLib.AddressList) outgoing;

    function initialize (address _owner) public {
        require(blockCreated == 0, "block created can only be set once");

        blockCreated = block.number;
        
        factory = msg.sender;
        owner = _owner;
    }

    function transfer (address token, address recipient, uint amount) public validPayment returns (bool success) {
        IPayment payment = IPayment(msg.sender);
        success = payment.wallet().transfer(token, recipient, amount);
        emit Payment_event(payment, amount, success);
    }

    function execute () public validPayment returns (bool success) {
        IPayment payment = IPayment(msg.sender);
        uint paymentAmount = payment.amount();
        success = payment.wallet().transfer(
            payment.token(), 
            payment.recipient(), 
            paymentAmount
        );

        emit Payment_event(payment, paymentAmount, success);
    }

    function schedule (IPayment payment) public onlySchedulers {
        require(outgoing[payment.wallet()].add(payment), "failed to add payment to wallet payment list");
        require(incoming[payment.recipient()].add(payment), "failed to add payment to recipient payment list");

        emit Schedule_event(msg.sender, payment.wallet(), payment.recipient(), payment);
    }

    function unschedule (IPayment payment) public {
        require(payment.wallet().isDelegate(msg.sender), "only a delegate can unschedule a payment");
        require(outgoing[payment.wallet()].remove(payment), "failed to remove payment from wallet payment list");
        require(incoming[payment.recipient()].remove(payment), "failed to remove payment from recipient payment list");

        emit Unschedule_event(msg.sender, payment);
    }

    function unschedule () public {
        IPayment payment = IPayment(msg.sender);
        require(outgoing[payment.wallet()].remove(payment), "failed to remove payment from wallet payment list");
        require(incoming[payment.recipient()].remove(payment), "failed to remove payment from recipient payment list");

        emit Unschedule_event(payment, payment);
    }
    
    function getIncomingPayments (address recipient) public view returns (address[]) {
        return incoming[recipient].get();
    }

    function getOutgoingPayments (IDelegatedWallet wallet) public view returns (address[]) {
        return outgoing[wallet].get();
    }
    
    function getTotalIncomingPayments (address recipient) public view returns (uint) {
        return incoming[recipient].getLength();
    }
    
    function getTotalOutgoingPayments (IDelegatedWallet wallet) public view returns (uint) {
        return outgoing[wallet].getLength();
    }

    function getIncomingPaymentAtIndex (address recipient, uint i) public view returns (IPayment) {
        return IPayment(incoming[recipient].index(i));
    }

    function getOutgoingPaymentAtIndex (IDelegatedWallet wallet, uint i) public view returns (IPayment) {
        return IPayment(outgoing[wallet].index(i));
    }

    function recipientContainsPayment (address recipient, IPayment payment) public view returns (bool) {
        return incoming[recipient].contains(payment);
    }

    function walletContainsPayment (address wallet, IPayment payment) public view returns (bool) {
        return outgoing[wallet].contains(payment);
    }

    function addScheduler (address newScheduler) public onlyOwner returns (bool) {
        return schedulers.add(newScheduler);
    }
    
    function removeScheduler (address newScheduler) public onlyOwner returns (bool) {
        return schedulers.remove(newScheduler);
    }

    function getSchedulers () public view returns (address[]) {
        return schedulers.get();
    }

    modifier validPayment () {
        IPayment payment = IPayment(msg.sender);
        require(outgoing[payment.wallet()].contains(payment), "payment does not exist in the wallet payment list");
        require(incoming[payment.recipient()].contains(payment), "payment does not exist in the recipient payment list");
        _;
    }

    modifier onlySchedulers () {
        require(schedulers.contains(msg.sender));
        _;
    }
    
    event Payment_event (IPayment indexed payment, uint amount, bool success);
    event Schedule_event (address indexed scheduler, address indexed wallet, address indexed recipient, IPayment payment);
    event Unschedule_event (address indexed caller, IPayment payment);

}
