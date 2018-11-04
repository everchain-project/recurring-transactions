pragma solidity ^0.4.23;

import "../../external/Owned.sol";
import "../../components/recurring-alarm-clock/RecurringAlarmClock.sol";
import "../../Interfaces.sol";

// @title RecurringPayment Contract
// @author Joseph Reed
// @dev This contract has a recurring alarm clock that can trigger payments. Must be scheduled to the given payment delegate
contract RecurringPayment is IPayment, ICancellable {
    
    uint public blockCreated;               // records the block when the contract is created
    address public factory;                 // The factory that created this contract

    address public executor;                // The alarm clock that triggers each payment
    IPaymentDelegate public delegate;       // The delegate that pulls funds for each alarm
    IDelegatedWallet public wallet;         // The address which owns the alarm and collects any leftover funds
    address public token;                   // The token to pull when funding an alarm. 0x0 represents native ether
    address public recipient;               // The recipient to send pulled funds to. set to 'this' at initialization
    uint public paymentAmount;              // The amount of tokens to send when the payment is triggered
    
    /// @notice Initializes the recurring alarm clock. Uses 'initialize()' instead of a constructor to make use of the clone 
    ///         factory at https://github.com/optionality/clone-factory. In general, 'initialize()' should be  
    ///         called directly following it's deployment through the use of a factory
    /// @param _executor The alarm clock that triggers each payment
    /// @param _delegate The delegate that pulls funds for each alarm
    /// @param _wallet The address which owns the alarm and collects any leftover funds
    /// @param _token The token to pull when funding an alarm. 0x0 represents native ether
    /// @param _recipient The recipient to send pulled funds to. set to 'this' at initialization
    /// @param _amount The amount of tokens to send when the payment is triggered
    function initialize (
        RecurringAlarmClock _executor,
        IPaymentDelegate _delegate,
        IDelegatedWallet _wallet,
        address _token,
        address _recipient,
        uint _amount
    ) public {
        require(blockCreated == 0, "contract can only be initialized once");

        blockCreated = block.number;    // The block number at the time of deployment
        factory = msg.sender;           // The factory that deployed this recurring alarm clock

        executor = _executor;
        delegate = _delegate;
        wallet = _wallet;
        token = _token;
        recipient = _recipient;
        paymentAmount = _amount;
    }

    /// @notice Calculates the amount of tokens the payment will send
    /// @return The calculated amount
    function amount () public view returns (uint) {
        return paymentAmount;
    }
    
    /// @notice The default function. Triggers a payment when called by the alarm clock
    function () public {
        require(msg.sender == executor, "msg.sender is not the alarm clock");

        delegate.execute();

        // Clean up the payment after the final payment
        RecurringAlarmClock alarmClock = RecurringAlarmClock(executor);
        if(alarmClock.currentInterval() == alarmClock.maximumIntervals())
            delegate.unschedule();
    }

    // Cancels the payment and alarm clock. Only callable by a wallet delegate
    function cancel () public {
        require(wallet.isDelegate(msg.sender), "msg.sender is not a delegate");

        RecurringAlarmClock alarmClock = RecurringAlarmClock(executor);
        alarmClock.cancel();
        delegate.unschedule();
    }
    
}
