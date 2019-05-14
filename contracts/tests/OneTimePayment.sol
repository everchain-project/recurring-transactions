pragma solidity ^0.5.0;

import "../Interfaces.sol";

/// @title OneTimePayment Contract
/// @author Joseph Reed
/// @dev This contract deploys a one time payment that can be registered to a payment scheduler
contract OneTimePayment is IPayment {

    uint public blockCreated;               // Records the block when the contract is created

    address public factory;                 // The factory that deployed this contract
    ITransactionScheduler public scheduler; // The scheduler that pulls funds for the payment
    IDelegatedWallet public wallet;         // The address which owns the alarm and collects any leftover funds
    address public token;                   // The token to pull when funding an alarm. default of 0x0 represents native ether
    address payable public recipient;       // The recipient to send pulled funds to. set to 'this' at initialization

    uint public baseAmount;

    /// @notice Initializes the one time payment
    /// @param _scheduler The scheduler from which to pull payment
    /// @param _wallet The funding wallet
    /// @param _token The token to send when the payment is triggered
    /// @param _recipient The recipient of the payment
    /// @param _amount The amount of tokens to send when the payment is triggered
    function initialize (
        ITransactionScheduler _scheduler,
        IDelegatedWallet _wallet,
        address _token,
        address payable _recipient,
        uint _amount
    ) public {
        blockCreated = block.number;    // The block number at the time of deployment

        factory = msg.sender;
        scheduler = _scheduler;
        wallet = _wallet;
        token = _token;
        recipient = _recipient;
        baseAmount = _amount;

        // scheduler.register(recipient);
    }

    /// @notice The default function. Triggers a payment when called by anyone and it
    ///         automatically unschedules itself up from the payment scheduler
    function () external {
        uint paymentAmount = amount();
        bool success = scheduler.transfer(token, recipient, paymentAmount);
        // scheduler.unregister(recipient);
        scheduler.unschedule();

        emit Payment_event(paymentAmount, success);
    }

    /// @notice The amount of tokens to send when the payment is triggered
    function amount () public returns (uint) {
        return baseAmount;
    }

    /// @notice Cancels the payments and unschedules it from the payment scheduler
    function cancel () public {
        require(wallet.isDelegate(msg.sender), "only a wallet scheduler can cancel the payment");

        // scheduler.unregister(recipient);
        scheduler.unschedule();
    }

    event Payment_event(uint amount, bool success);

}
