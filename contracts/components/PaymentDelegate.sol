pragma solidity ^0.5.0;

import "../external/Owned.sol";
import "../external/ListLib.sol";
import "../Interfaces.sol";

/// @title PaymentDelegate Contract
/// @author Joseph Reed
/// @dev The PaymentDelegate has a list of trusted payment schedulers with permission to add payments to user's accounts.
///      The PaymentDelegate can be centralized so more advanced payment types can be added efficiently and have the 
///      option to make it more decentralized later, or a user can control their own Payment Delegate and be responsible 
///      for updating it themselves. If using a personal Payment Delegate, the user must send the address of the 
///      PaymentDelegate to the recipient for them to know about the payment.
contract PaymentDelegate is Owned, IPaymentDelegate {

    using ListLib for ListLib.AddressList;  // Import the data structure AddressList from the ListLib contract

    uint public blockCreated;               // The block the payment delegate was deployed
    address public factory;                 // The factory that deployed this PaymentDelegate
    ListLib.AddressList trustedSchedulers;  // The list of schedulers with permission to schedule a payment

    mapping (address => ListLib.AddressList) incoming;  // The list of incoming payments per account
    mapping (address => ListLib.AddressList) outgoing;  // The list of outgoing payments per account

    /// @notice Initializes the payment delegate. Uses 'initialize()' instead of a constructor to make use of the clone 
    ///         factory at https://github.com/optionality/clone-factory. In general, 'initialize()' should be  
    ///         called directly following it's deployment through the use of a factory.
    /// @param _owner The address with permission to add and remove schedulers
    function initialize (address _owner) public {
        require(blockCreated == 0, "block created can only be set once");

        blockCreated = block.number;
        
        factory = msg.sender;
        owner = _owner;
    }

    /// @notice Executes the payment associated with the address of 'msg.sender'
    /// @return True if the payment executed successfully
    function execute () public returns (bool success) {
        IPayment payment = IPayment(msg.sender);
        require(outgoing[address(payment.wallet())].contains(address(payment)), "payment does not exist in the wallet payment list");
        require(incoming[payment.recipient()].contains(address(payment)), "payment does not exist in the recipient payment list");

        uint paymentAmount = payment.amount();
        success = payment.wallet().transfer(
            payment.token(), 
            payment.recipient(), 
            paymentAmount
        );

        emit Payment_event(payment, paymentAmount, success);
    }

    /// @notice Schedules a payment. Only callable by a trusted payment scheduler
    /// @param payment The payment contract responsible for holding logic and data about the payment
    function schedule (IPayment payment) public {
        require(trustedSchedulers.contains(msg.sender), "only a trusted scheduler can schedule a payment");
        
        outgoing[address(payment.wallet())].add(address(payment));
        incoming[payment.recipient()].add(address(payment));

        emit Schedule_event(msg.sender, address(payment.wallet()), payment.recipient(), payment);
    }

    /// @notice Unschedules a payment. Only callable by a delegate of the wallet supplied with the payment
    /// @param payment The payment contract responsible for holding logic and data about the payment
    function unschedule (IPayment payment) public {
        require(payment.wallet().isDelegate(msg.sender), "only a delegate can unschedule a payment");

        outgoing[address(payment.wallet())].remove(address(payment));
        incoming[payment.recipient()].remove(address(payment));

        emit Unschedule_event(msg.sender, payment);
    }

    /// @notice Unschedules a payment. Only callable by the payment contract
    function unschedule () public {
        IPayment payment = IPayment(msg.sender);
        outgoing[address(payment.wallet())].remove(address(payment));
        incoming[payment.recipient()].remove(address(payment));

        emit Unschedule_event(address(payment), payment);
    }
    
    /// @notice Fetches the incoming payments of a given recipient
    /// @param recipient The account to search
    /// @return The list of incoming payments associated with the 'recipient'
    function getIncomingPayments (address recipient) public view returns (address[] memory) {
        return incoming[recipient].get();
    }

    /// @notice Fetches the outgoing payments of a given delegated wallet
    /// @param wallet The delegated wallet for which we are fetching outgoing payment
    /// @return The list of outgoing payments associated with the 'wallet'
    function getOutgoingPayments (IDelegatedWallet wallet) public view returns (address[] memory) {
        return outgoing[address(wallet)].get();
    }
    
    /// @notice Fetches the total number of incoming payments of a given recipient
    /// @param recipient The account for which we are fetching the number of incoming payment
    /// @return The number of incoming payments associated with the 'recipient'
    function getTotalIncomingPayments (address recipient) public view returns (uint) {
        return incoming[recipient].getLength();
    }
    
    /// @notice Fetches the total number of outgoing payments of a given delegated wallet
    /// @param wallet The delegated wallet for which we are fetching the number of outgoing payment
    /// @return The number of outgoing payments associated with the 'wallet'
    function getTotalOutgoingPayments (IDelegatedWallet wallet) public view returns (uint) {
        return outgoing[address(wallet)].getLength();
    }

    /// @notice Fetches the incoming payments of a given recipient at a given index
    /// @param recipient The account to search
    /// @param i The index of the payment to fetch
    /// @return The incoming payment at index 'i'
    function getIncomingPaymentAtIndex (address recipient, uint i) public view returns (IPayment) {
        return IPayment(incoming[recipient].index(i));
    }

    /// @notice Fetches the outgoing payments of a given delegated wallet at a given index
    /// @param wallet The account to search
    /// @param i The index of the payment to fetch
    /// @return The outgoing payment at index 'i'
    function getOutgoingPaymentAtIndex (IDelegatedWallet wallet, uint i) public view returns (IPayment) {
        return IPayment(outgoing[address(wallet)].index(i));
    }

    /// @notice Indicated whether an account currently is associated with an incoming payment
    /// @param recipient The account to search
    /// @param payment The payment to check for
    /// @return True if the given 'recipient' contains the given 'payment'
    function recipientContainsPayment (address recipient, IPayment payment) public view returns (bool) {
        return incoming[recipient].contains(address(payment));
    }

    /// @notice Indicated whether an account currently is associated with an outgoing payment
    /// @param wallet The account to search
    /// @param payment The payment to check for
    /// @return True if the given 'wallet' contains the given 'payment'
    function walletContainsPayment (address wallet, IPayment payment) public view returns (bool) {
        return outgoing[wallet].contains(address(payment));
    }

    /// @notice Get the list of schedulers
    /// @return The list of trusted schedulers
    function getSchedulers () public view returns (address[] memory) {
        return trustedSchedulers.get();
    }

    /// @notice Determine if a scheduler is trusted
    /// @param scheduler the scheduler to check
    /// @return True if the given 'scheduler' is trusted
    function containsScheduler (address scheduler) public view returns (bool) {
        return trustedSchedulers.contains(scheduler);
    }

    /// @notice Add a scheduler to the trusted scheduler list. Can only be called by the 'owner'
    /// @param newScheduler the scheduler to add to the list
    function addScheduler (address newScheduler) public onlyOwner {
        require(trustedSchedulers.add(newScheduler), "failed to add scheduler");

        emit AddedScheduler_event(owner, newScheduler);
    }
    
    /// @notice Remove a scheduler to the trusted scheduler list. Can only be called by the 'owner'
    /// @param oldScheduler the scheduler to add to the list
    function removeScheduler (address oldScheduler) public onlyOwner {
        require(trustedSchedulers.remove(oldScheduler), "failed to remove scheduler");

        emit RemovedScheduler_event(owner, oldScheduler);
    }
    
    event Payment_event (IPayment indexed payment, uint amount, bool success);
    event Schedule_event (address indexed scheduler, address indexed wallet, address indexed recipient, IPayment payment);
    event Unschedule_event (address indexed caller, IPayment payment);
    event AddedScheduler_event (address indexed caller, address newScheduler);
    event RemovedScheduler_event (address indexed caller, address oldScheduler);

}
