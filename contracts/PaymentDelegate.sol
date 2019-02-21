pragma solidity ^0.5.0;

import "./external/AddressListLib.sol";
import "./external/Owned.sol";
import "./Interfaces.sol";

/// @title PaymentDelegate Contract
/// @author Joseph Reed
/// @dev The PaymentDelegate acts as a hub for sending and recieving payments. The payment contract is responsible
///      for registering any recipients it has.
contract BasePaymentDelegate is IPaymentDelegate {

    using AddressListLib for AddressListLib.AddressList;      // Import the data structure AddressList from the AddressListLib contract

    uint public blockCreated = block.number;    // The block the payment delegate was deployed

    mapping (address => AddressListLib.AddressList) outgoingPaymentsFor;  // The list of outgoing payments per account
    mapping (address => AddressListLib.AddressList) incomingPaymentsFor;  // The list of incoming payments per account

    /// @notice Executes the payment associated with the address of 'msg.sender'
    /// @param token The token to send for the payment
    /// @param recipient The recipient of the specified amount of tokens
    /// @param amount The amount of tokens to send to the recipient
    /// @return True if the payment executed successfully
    function transfer (address token, address payable recipient, uint amount) public returns (bool success) {
        IPayment payment = IPayment(msg.sender);
        IDelegatedWallet wallet = payment.wallet();
        require(walletContainsPayment(address(wallet), payment), "payment does not exist in the wallet payment list");

        success = wallet.transfer(token, recipient, amount);
        emit Payment_event(wallet, payment, success);
    }

    /// @notice Schedules a payment. Only callable by a wallet delegate
    /// @param payment The payment contract responsible for holding logic and data about the payment
    function schedule (IPayment payment) public returns (bool success) {
        IDelegatedWallet wallet = payment.wallet();
        require(valid(payment), "payment is not valid");

        success = outgoingPaymentsFor[address(wallet)].add(address(payment));
        if(success)
            emit Schedule_event(wallet, msg.sender, payment);
    }

    /// @notice Unschedules a payment. Only callable by a delegate of the wallet supplied with the payment
    /// @param payment The payment contract responsible for holding logic and data about the payment
    function unschedule (IPayment payment) public returns (bool success) {
        IDelegatedWallet wallet = payment.wallet();
        require(wallet.isDelegate(msg.sender), "scheduler must be a wallet delegate");
        
        success = outgoingPaymentsFor[address(wallet)].remove(address(payment));
        if(success)
            emit Unschedule_event(wallet, msg.sender, payment);
    }

    /// @notice Unschedules a payment. Only callable by the payment contract
    function unschedule () public returns (bool success) {
        IPayment payment = IPayment(msg.sender);
        IDelegatedWallet wallet = payment.wallet();
        success = outgoingPaymentsFor[address(wallet)].remove(address(payment));
        if(success)
            emit Unschedule_event(wallet, address(payment), payment);
    }

    function register (address recipient) public returns (bool success) {
        IPayment payment = IPayment(msg.sender);
        success = incomingPaymentsFor[recipient].add(address(payment));
        if(success)
            emit Register_event(payment, recipient);
    }

    function unregister (address recipient) public returns (bool success) {
        IPayment payment = IPayment(msg.sender);
        success = incomingPaymentsFor[recipient].remove(address(payment));
        if(success)
            emit Unregister_event(payment, recipient);
    }

    function clear (IPayment payment) public returns (bool success) {
        address recipient = msg.sender;
        success = incomingPaymentsFor[recipient].remove(address(payment));
        if(success)
            emit Clear_event(payment, recipient);
    }
    
    /// @notice Fetches the incoming payments of a given recipient
    /// @param recipient The account to search
    /// @return The list of incoming payments associated with the 'recipient'
    function getIncomingPayments (address recipient) public view returns (address[] memory) {
        return incomingPaymentsFor[recipient].get();
    }

    /// @notice Fetches the outgoing payments of a given delegated wallet
    /// @param wallet The delegated wallet for which we are fetching outgoing payment
    /// @return The list of outgoing payments associated with the 'wallet'
    function getOutgoingPayments (IDelegatedWallet wallet) public view returns (address[] memory) {
        return outgoingPaymentsFor[address(wallet)].get();
    }
    
    /// @notice Fetches the total number of incoming payments of a given recipient
    /// @param recipient The account for which we are fetching the number of incoming payment
    /// @return The number of incoming payments associated with the 'recipient'
    function getTotalIncomingPayments (address recipient) public view returns (uint) {
        return incomingPaymentsFor[recipient].getLength();
    }
    
    /// @notice Fetches the total number of outgoing payments of a given delegated wallet
    /// @param wallet The delegated wallet for which we are fetching the number of outgoing payment
    /// @return The number of outgoing payments associated with the 'wallet'
    function getTotalOutgoingPayments (IDelegatedWallet wallet) public view returns (uint) {
        return outgoingPaymentsFor[address(wallet)].getLength();
    }

    /// @notice Fetches the incoming payments of a given recipient at a given index
    /// @param recipient The account to search
    /// @param i The index of the payment to fetch
    /// @return The incoming payment at index 'i'
    function getIncomingPaymentAtIndex (address recipient, uint i) public view returns (IPayment) {
        return IPayment(incomingPaymentsFor[recipient].index(i));
    }

    /// @notice Fetches the outgoing payments of a given delegated wallet at a given index
    /// @param wallet The account to search
    /// @param i The index of the payment to fetch
    /// @return The outgoing payment at index 'i'
    function getOutgoingPaymentAtIndex (IDelegatedWallet wallet, uint i) public view returns (IPayment) {
        return IPayment(outgoingPaymentsFor[address(wallet)].index(i));
    }

    /// @notice Indicated whether an account currently is associated with an incoming payment
    /// @param recipient The account to search
    /// @param payment The payment to check for
    /// @return True if the given 'recipient' contains the given 'payment'
    function recipientContainsPayment (address recipient, IPayment payment) public view returns (bool) {
        return incomingPaymentsFor[recipient].contains(address(payment));
    }

    /// @notice Indicated whether an account currently is associated with an outgoing payment
    /// @param wallet The account to search
    /// @param payment The payment to check for
    /// @return True if the given 'wallet' contains the given 'payment'
    function walletContainsPayment (address wallet, IPayment payment)public view returns (bool) {
        return outgoingPaymentsFor[wallet].contains(address(payment));
    }

    event Payment_event (IDelegatedWallet indexed wallet, IPayment indexed payment, bool success);
    event Schedule_event (IDelegatedWallet indexed wallet, address indexed caller, IPayment indexed payment);
    event Unschedule_event (IDelegatedWallet indexed wallet, address indexed caller, IPayment indexed payment);
    event Register_event (IPayment indexed payment, address indexed recipient);
    event Unregister_event (IPayment indexed payment, address indexed recipient);
    event Clear_event(IPayment payment, address indexed recipient);

}

contract DecentralizedPaymentDelegate is BasePaymentDelegate {

	function valid (IPayment payment) internal returns (bool) {
		IDelegatedWallet wallet = payment.wallet();
        if(!wallet.isDelegate(address(this))) return false;
        if(!wallet.isDelegate(msg.sender)) return false;

        return true;
	}

}

contract CentralizedPaymentDelegate is Owned, BasePaymentDelegate {

	AddressListLib.AddressList trustedSchedulers;

    /// @notice todo
    function valid (IPayment payment) internal returns (bool) {
        IDelegatedWallet wallet = payment.wallet();
        if(!wallet.isDelegate(address(this))) return false;
        if(!trustedSchedulers.contains(msg.sender)) return false;

        return true;
    }

    /// @notice Add a scheduler to the trusted scheduler list. Can only be called by the 'owner'
    /// @param newScheduler the scheduler to add to the list
	function addScheduler (address newScheduler) public onlyOwner returns (bool success) {
        success = trustedSchedulers.add(newScheduler);
        if(success)
        	emit AddScheduler_event(newScheduler);
    }

    /// @notice Remove a scheduler to the trusted scheduler list. Can only be called by the 'owner'
    /// @param oldScheduler the scheduler to add to the list
    function removeScheduler (address oldScheduler) public onlyOwner returns (bool success) {
        success = trustedSchedulers.remove(oldScheduler);
        if(success)
        	emit RemoveScheduler_event(oldScheduler);
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

    event AddScheduler_event(address scheduler);
    event RemoveScheduler_event(address scheduler);

}
