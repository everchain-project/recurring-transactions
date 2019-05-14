pragma solidity ^0.5.0;

import "../external/AddressListLib.sol";
import "../external/Owned.sol";
import "../Interfaces.sol";

/// @title PaymentDelegate Contract
/// @author Joseph Reed
/// @dev The PaymentDelegate acts as a hub for sending and recieving payments. The payment contract is responsible
///      for registering any recipients it has.
contract TransactionScheduler is ITransactionScheduler {

    using AddressListLib for AddressListLib.AddressList;      // Import the data structure AddressList from the AddressListLib contract

    uint public blockCreated = block.number;    // The block the payment delegate was deployed

    mapping (address => AddressListLib.AddressList) futureTransactions;

    /// @notice Executes the payment associated with the address of 'msg.sender'
    /// @param token The token to send for the payment
    /// @param recipient The recipient of the specified amount of tokens
    /// @param amount The amount of tokens to send to the recipient
    /// @return True if the payment executed successfully
    function transfer (address token, address payable recipient, uint amount) public returns (bool success) {
        IFutureTransaction ftx = IFutureTransaction(msg.sender);
        IDelegatedWallet wallet = ftx.wallet();
        require(futureTransactions[address(wallet)].contains(address(ftx)), "payment does not exist in the wallet payment list");

        success = wallet.transfer(token, recipient, amount);
        emit Payment_event(wallet, ftx, success);
    }

    function call (address callAddress, uint callValue, bytes memory callData) public returns (bool success, bytes memory returnData) {
        IFutureTransaction ftx = IFutureTransaction(msg.sender);
        IDelegatedWallet wallet = ftx.wallet();
        require(futureTransactions[address(wallet)].contains(address(ftx)), "payment does not exist in the wallet payment list");

        (success, returnData) = wallet.call(callAddress, callValue, callData);
        emit Payment_event(wallet, ftx, success);
    }

    /// @notice Schedules a payment. Only callable by a wallet delegate
    /// @param ftx The payment contract responsible for holding logic and data about the payment
    function schedule (IFutureTransaction ftx) public returns (bool success) {
        IDelegatedWallet wallet = ftx.wallet();
        require(valid(ftx), "future transaction is not valid");

        success = futureTransactions[address(wallet)].add(address(ftx));
        if(success)
            emit Schedule_event(wallet, msg.sender, ftx);
    }

    /// @notice Allows a wallet delegate to unschedules a future transaction
    /// @param ftx The payment contract responsible for holding logic and data about the payment
    function unschedule (IFutureTransaction ftx) public returns (bool success) {
        IDelegatedWallet wallet = ftx.wallet();
        require(wallet.isDelegate(msg.sender), "scheduler must be a wallet delegate");

        success = futureTransactions[address(wallet)].remove(address(ftx));
        if(success)
            emit Unschedule_event(wallet, msg.sender, ftx);
    }

    /// @notice Allows a future transaction to unschedule itself
    function unschedule () public returns (bool success) {
        IFutureTransaction ftx = IFutureTransaction(msg.sender);
        IDelegatedWallet wallet = ftx.wallet();
        success = futureTransactions[address(wallet)].remove(address(ftx));
        if(success)
            emit Unschedule_event(wallet, address(ftx), ftx);
    }

    /// @notice Determines if a future transaction is valid
    function valid (IFutureTransaction ftx) public view returns (bool) {
		IDelegatedWallet wallet = ftx.wallet();
        if(!wallet.isDelegate(address(this))) return false;
        if(!wallet.isDelegate(msg.sender)) return false;

        return true;
	}

    /// @notice Fetches the outgoing payments of a given delegated wallet
    /// @param wallet The delegated wallet for which we are fetching outgoing payment
    /// @return The list of outgoing payments associated with the 'wallet'
    function getOutgoingPayments (IDelegatedWallet wallet) public view returns (address[] memory) {
        return futureTransactions[address(wallet)].get();
    }

    /// @notice Fetches the total number of outgoing payments of a given delegated wallet
    /// @param wallet The delegated wallet for which we are fetching the number of outgoing payment
    /// @return The number of outgoing payments associated with the 'wallet'
    function getTotalFutureTransactions (IDelegatedWallet wallet) public view returns (uint) {
        return futureTransactions[address(wallet)].getLength();
    }

    /// @notice Fetches the outgoing payments of a given delegated wallet at a given index
    /// @param wallet The account to search
    /// @param i The index of the payment to fetch
    /// @return The outgoing payment at index 'i'
    function getFutureTransactionAtIndex (IDelegatedWallet wallet, uint i) public view returns (IFutureTransaction) {
        return IFutureTransaction(futureTransactions[address(wallet)].index(i));
    }

    /// @notice Indicated whether an account currently is associated with an outgoing payment
    /// @param wallet The account to search
    /// @param ftx The future transaction to check for
    /// @return True if the given 'wallet' contains the given 'payment'
    function walletContainsPayment (address wallet, IFutureTransaction ftx)public view returns (bool) {
        return futureTransactions[wallet].contains(address(ftx));
    }

    event Payment_event (IDelegatedWallet indexed wallet, IFutureTransaction indexed payment, bool success);
    event Schedule_event (IDelegatedWallet indexed wallet, address indexed caller, IFutureTransaction indexed ftx);
    event Unschedule_event (IDelegatedWallet indexed wallet, address indexed caller, IFutureTransaction indexed ftx);

}
