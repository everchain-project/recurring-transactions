pragma solidity ^0.5.0;

import "../Interfaces.sol";

/// @title OneTimePayment Contract
/// @author Joseph Reed
/// @dev This contract deploys a one time payment that can be registered to a payment delegate
contract OneTimePayment is IPayment {

    uint public blockCreated;           // Records the block when the contract is created
    
    address public factory;
    IPaymentDelegate public delegate;   // The delegate that pulls funds for the payment
    IDelegatedWallet public wallet;     // The address which owns the alarm and collects any leftover funds
    address public token;               // The token to pull when funding an alarm. default of 0x0 represents native ether
    address payable public recipient;   // The recipient to send pulled funds to. set to 'this' at initialization
    uint public amount;                 // The amount of tokens to send when the payment is triggered

    /// @notice Initializes the one time payment
    /// @param _delegate The delegate from which to pull payment
    /// @param _wallet The funding wallet
    /// @param _token The token to send when the payment is triggered
    /// @param _recipient The recipient of the payment
    /// @param _amount The amount of tokens to send when the payment is triggered
    function initialize (
        IPaymentDelegate _delegate,
        IDelegatedWallet _wallet,
        address _token,
        address payable _recipient,
        uint _amount
    ) public {
        blockCreated = block.number;    // The block number at the time of deployment

        factory = msg.sender;
        delegate = _delegate;
        wallet = _wallet;
        token = _token;
        recipient = _recipient;
        amount = _amount;

        delegate.register(recipient);
    }

    /// @notice The default function. Triggers a payment when called by anyone and it
    ///         automatically unschedules itself up from the payment delegate
    function () external {
        bool success = delegate.transfer(token, recipient, amount);
        delegate.unregister(recipient);
        delegate.unschedule();

        emit Payment_event(amount, success);
    }

    /// @notice Cancels the payments and unschedules it from the payment delegate
    function cancel () public {
        require(wallet.isDelegate(msg.sender), "only a wallet delegate can cancel the payment");

        delegate.unregister(recipient);
        delegate.unschedule();
    }

    event Payment_event(uint amount, bool success);

}