pragma solidity ^0.4.23;

import "../../external/CloneFactory.sol";
import "../../Interfaces.sol";
import "./RecurringPayment.sol";

// @title RecurringPaymentFactory Contract
// @author Joseph Reed
// @dev This contract creates recurring payments that can be scheduled to a payment delegate
contract RecurringPaymentFactory is CloneFactory {

    uint public blockCreated;           // records the block when the contract is created

    RecurringPayment public blueprint;  // The recurring payment blueprint to supply the clone factory
    uint public paymentGasCost;         // The amount of gas this payment costs to call

    /// @notice Constructor to create a RecurringPaymentFactory
    /// @param _blueprint The recurring payment blueprint
    /// @param _paymentGasCost The amount of gas it costs to call the alarm
    constructor (RecurringPayment _blueprint, uint _paymentGasCost) public {
        blockCreated = block.number;        // The block number at the time of deployment
        paymentGasCost = _paymentGasCost;   // Sets the payment gas cost. This amount needs precalculated

        blueprint = _blueprint;
    }

    /// @notice Create a recurring payment
    /// @param alarmClock The alarm clock that triggers each payment
    /// @param delegate The delegate that pulls funds for each alarm
    /// @param wallet the delegated wallet the payment originates from
    /// @param token The token to pull when funding an alarm. 0x0 represents native ether
    /// @param recipient The recipient to send funds to
    /// @param paymentAmount The amount of tokens to send when the payment is triggered
    /// @return The address of the recurring payment contract
    function createRecurringPayment (
        RecurringAlarmClock alarmClock,    // the alarm clock that acts as the executor of the payment
        IPaymentDelegate delegate,          // the payment delegate that forwards each payment
        IDelegatedWallet wallet,            // the delegated wallet the payment originates from
        address token,                      // the token to use when making a payment
        address recipient,                  // the recipient of the payment
        uint paymentAmount                  // how much of the token to send each payment
    ) public returns (RecurringPayment paymentTask) {
        paymentTask = RecurringPayment(createClone(blueprint));
        paymentTask.initialize(
            alarmClock,     
            delegate,       
            wallet,         
            token,          
            recipient,      
            paymentAmount   
        );

        emit CreatePayment_event(msg.sender, paymentTask);
    }

    event CreatePayment_event (address indexed creator, RecurringPayment recurringPayment);
    
}
