pragma solidity ^0.5.0;

import "../external/AddressListLib.sol";
import "../Interfaces.sol";

contract PaymentHub {

    using AddressListLib for AddressListLib.AddressList;      // Import the data structure AddressList from the AddressListLib contract

    mapping (address => AddressListLib.AddressList) incomingPaymentsFor;  // Incoming payments per account

    function register (address recipient) public returns (bool success) {
        IFutureTransaction payment = IFutureTransaction(msg.sender);
        success = incomingPaymentsFor[recipient].add(address(payment));
        if(success)
            emit Register_event(payment, recipient);
    }

    function unregister (address recipient) public returns (bool success) {
        IFutureTransaction payment = IFutureTransaction(msg.sender);
        success = incomingPaymentsFor[recipient].remove(address(payment));
        if(success)
            emit Unregister_event(payment, recipient);
    }

    function clear (IFutureTransaction payment) public returns (bool success) {
        success = incomingPaymentsFor[msg.sender].remove(address(payment));
        if(success)
            emit Clear_event(payment, msg.sender);
    }

    /// @notice Fetches the incoming payments of a given recipient
    /// @param recipient The account to search
    /// @return The list of incoming payments associated with the 'recipient'
    function getIncomingPayments (address recipient) public view returns (address[] memory) {
        return incomingPaymentsFor[recipient].get();
    }

    /// @notice Fetches the total number of incoming payments of a given recipient
    /// @param recipient The account for which we are fetching the number of incoming payment
    /// @return The number of incoming payments associated with the 'recipient'
    function getTotalIncomingPayments (address recipient) public view returns (uint) {
        return incomingPaymentsFor[recipient].getLength();
    }

    /// @notice Fetches the incoming payments of a given recipient at a given index
    /// @param recipient The account to search
    /// @param i The index of the payment to fetch
    /// @return The incoming payment at index 'i'
    function getIncomingPaymentAtIndex (address recipient, uint i) public view returns (IFutureTransaction) {
        return IFutureTransaction(incomingPaymentsFor[recipient].index(i));
    }

    /// @notice Indicated whether an account currently is associated with an incoming payment
    /// @param recipient The account to search
    /// @param payment The payment to check for
    /// @return True if the given 'recipient' contains the given 'payment'
    function recipientContainsPayment (address recipient, IFutureTransaction payment) public view returns (bool) {
        return incomingPaymentsFor[recipient].contains(address(payment));
    }

    event Register_event (IFutureTransaction indexed payment, address indexed recipient);
    event Unregister_event (IFutureTransaction indexed payment, address indexed recipient);
    event Clear_event(IFutureTransaction ftx, address indexed recipient);

}

contract RecurringPayment is IPayment {

}
