pragma solidity ^0.4.23;

import "../../external/Owned.sol";
import "../../libraries/ListLib.sol";
import "../../Interfaces.sol";

contract FuturePaymentDelegate is Owned, IFuturePaymentDelegate {

    using ListLib for ListLib.AddressList;

    uint public blockCreated;

    ListLib.AddressList schedulers;

    mapping (address => ListLib.AddressList) incoming;
    mapping (address => ListLib.AddressList) outgoing;

    function initialize () public {
        require(blockCreated == 0, "block created can only be set once");

        blockCreated = block.number;
    }

    function execute () public validPayment returns (bool success) {
        IFuturePayment payment = IFuturePayment(msg.sender);
        uint paymentAmount = payment.amount();
        success = payment.wallet().transfer(
            payment.token(), 
            payment.recipient(), 
            paymentAmount
        );

        emit Payment_event(payment, paymentAmount, success);
    }

    function schedule (IFuturePayment payment) public onlySchedulers {
        require(incoming[payment.recipient()].add(payment), "failed to add payment to recipient incoming payment list");
        require(outgoing[payment.wallet()].add(payment), "failed to add payment to wallet outgoing payment list");
        
        emit Schedule_event(msg.sender, payment.wallet(), payment);
    }

    function unschedule (IFuturePayment payment) public {
        require(payment.wallet().isDelegate(msg.sender), "only a delegate can unschedule a payment");
        require(outgoing[payment.wallet()].remove(payment), "payment does not exist in wallet outgoing payment list");
        require(incoming[payment.recipient()].remove(payment), "payment does not exist in recipient incoming payment list");

        emit Unschedule_event(msg.sender, payment.wallet(), payment);
    }

    function unschedule () public {
        IFuturePayment payment = IFuturePayment(msg.sender);
        require(outgoing[payment.wallet()].remove(payment), "payment does not exist in wallet outgoing payment list");
        require(incoming[payment.recipient()].remove(payment), "payment does not exist in recipient incoming payment list");

        emit Unschedule_event(payment, payment.wallet(), payment);
    }

    function addScheduler (address newScheduler) public onlyOwner returns (bool) {
        return schedulers.add(newScheduler);
    }
    
    function removeScheduler (address newScheduler) public onlyOwner returns (bool) {
        return schedulers.remove(newScheduler);
    }

    modifier validPayment () {
        IFuturePayment payment = IFuturePayment(msg.sender);
        require(outgoing[payment.wallet()].contains(payment), "the payment does not exist in the outgoing payment list");
        require(incoming[payment.recipient()].contains(payment), "the payment does not exist in the incoming recipient list");
        _;
    }

    modifier onlySchedulers () {
        require(schedulers.contains(msg.sender));
        _;
    }
    
    event Schedule_event (address indexed scheduler, IDelegatedWallet indexed wallet, IFuturePayment payment);
    event Unschedule_event (address indexed caller, IDelegatedWallet indexed wallet, IFuturePayment payment);
    event Payment_event (IFuturePayment indexed payment, uint amount, bool success);

}
