pragma solidity ^0.5.0;

import "../external/ListLib.sol";
import "../Interfaces.sol";

/// @title PaymentDelegate Contract
/// @author Joseph Reed
/// @dev The PaymentDelegate acts as a central location for sending and recieving payments. A scheduler must be a 
///      delegate of the supplied wallet to schedule a payment with it. If using a personal Payment Delegate, the  
///      user must send the address of the PaymentDelegate to the recipient for them to know about the payment or
///      have the payment notify a seperate payment delegate known by the recipient.
contract PaymentDelegate is IPaymentDelegate {

    using ListLib for ListLib.AddressList;  // Import the data structure AddressList from the ListLib contract

    uint public blockCreated = block.number;            // The block the payment delegate was deployed
    mapping (address => ListLib.AddressList) outgoing;  // The list of outgoing payments per account
    mapping (address => ListLib.AddressList) incoming;  // The list of incoming payments per account

    /// @notice Executes the payment associated with the address of 'msg.sender'
    /// @param token a
    /// @param recipient b
    /// @param amount c
    /// @return True if the payment executed successfully
    function transfer (address token, address payable recipient, uint amount) public returns (bool success) {
        IPayment payment = IPayment(msg.sender);
        IDelegatedWallet wallet = payment.wallet();
        require(outgoing[address(wallet)].contains(address(payment)), "payment does not exist in the wallet payment list");

        success = wallet.transfer(token, recipient, amount);

        emit Payment_event(payment, success);
    }

    /// @notice Schedules a payment. Only callable by a trusted payment scheduler
    /// @param payment The payment contract responsible for holding logic and data about the payment
    function schedule (IPayment payment) internal {
        IDelegatedWallet wallet = payment.wallet();
        outgoing[address(wallet)].add(address(payment));

        emit Schedule_event(msg.sender, payment);
    }

    /// @notice Unschedules a payment. Only callable by a delegate of the wallet supplied with the payment
    /// @param payment The payment contract responsible for holding logic and data about the payment
    function unschedule (IPayment payment) public {
        address wallet = msg.sender;
        outgoing[wallet].remove(address(payment));

        emit Unschedule_event(msg.sender, payment);
    }

    /// @notice Unschedules a payment. Only callable by the payment contract
    function unschedule () public {
        IPayment payment = IPayment(msg.sender);
        address wallet = address(payment.wallet());
        outgoing[wallet].remove(address(payment));

        emit Unschedule_event(address(payment), payment);
    }

    function register (address recipient) public returns (bool success) {
        IPayment payment = IPayment(msg.sender);
        success = incoming[recipient].add(address(payment));

        if(success)
            emit Register_event(payment, recipient);
    }

    function unregister (address recipient) public returns (bool success) {
        IPayment payment = IPayment(msg.sender);
        success = incoming[recipient].remove(address(payment));

        if(success)
            emit Unregister_event(payment, recipient);
    }

    function clear (IPayment payment) public {
        address recipient = msg.sender;
        incoming[recipient].remove(address(payment));

        emit Clear_event(payment, recipient);
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

    event Payment_event (IPayment indexed payment, bool success);
    event Schedule_event (address indexed delegate, IPayment payment);
    event Unschedule_event (address indexed caller, IPayment payment);
    event Register_event (IPayment payment, address recipient);
    event Unregister_event (IPayment payment, address recipient);
    event Clear_event(IPayment payment, address recipient);
    event DelegateClear_event(address delegate, IPayment payment, address recipient);

}
