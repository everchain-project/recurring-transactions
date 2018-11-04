pragma solidity ^0.4.23;

import "../../components/recurring-alarm-clock/RecurringAlarmClockAssistant.sol";
import "../../Interfaces.sol";
import "../recurring-payment/RecurringPaymentFactory.sol";
import "../recurring-payment/RecurringPayment.sol";

/// @title RecurringPaymentScheduler Contract
/// @author Joseph Reed
/// @dev The RecurringPaymentScheduler makes it easy to deploy a recurring payment using the least amount of inputs as possible.
///      However this introduces an third party risk of ***unresearched*** severity (todo)
contract RecurringPaymentScheduler {

    uint public blockCreated;                       // The block the factory was deployed

    RecurringAlarmClockAssistant public Assistant;  // The assistant the helps to easily deploy a recurring alarm clock
    RecurringPaymentFactory public Factory;         // The factory that helps to easily deploy a recurring payment
    uint public gas = 100000;                       // The amount of extra gas to send with the alarm

    /// @notice Constructor to create a DelegatedWalletFactory
    /// @param assistant The assistant the helps to easily deploy a recurring alarm clock 
    /// @param factory The factory that helps to easily deploy a recurring payment 
    constructor (
        RecurringAlarmClockAssistant assistant,
        RecurringPaymentFactory factory
    ) public {
        blockCreated = block.number;    // The block number at the time of deployment

        Assistant = assistant;
        Factory = factory;
    }

    /// @notice Create a recurring payment
    /// @param delegate The delegate that pulls funds for each alarm
    /// @param wallet The delegated wallet the payment originates from, owns the scheduled alarms, and collects leftover change
    /// @param token The token to pull when funding an alarm. 0x0 represents native ether
    /// @param recipient The recipient to send pulled funds to. set to 'this' at initialization
    /// @param paymentAmount The amount of tokens to send when the payment is triggered
    /// @param startTimestamp The starting timestamp (in seconds)
    /// @param totalPayments How many payments to execute
    /// @param period How long between each payment (in seconds)
    /// @return The address of the recurring payment contract
    function createRecurringPayment (
        IPaymentDelegate delegate,
        IDelegatedWallet wallet,
        address token,
        address recipient,
        uint paymentAmount,
        uint startTimestamp,
        uint totalPayments,
        uint period,
        uint extraGas
    ) public returns (RecurringPayment paymentTask) {
        require(wallet.isDelegate(msg.sender), "msg.sender is not a delegate for the provided wallet");
        require(wallet.isDelegate(delegate), "payment delegate is not a delegate for the provided wallet");
        
        RecurringAlarmClock alarmClock = Assistant.createRecurringAlarmClock(
            delegate,       // The delegate that executes the payment
            wallet,         // The change address for excess ether not used during alarm execution and also the owner of the alarm
            startTimestamp, // The starting timestamp (in seconds)
            totalPayments,  // How many payments to execute
            period,         // How long between each payment (in seconds)
            gas + extraGas  // How much extra gas to send when executing each alarm. Should cover the gas cost of the payment task
        );

        paymentTask = Factory.createRecurringPayment(
            alarmClock,     // The executor that calls each payment
            delegate,       // The delegate that executes the payment
            wallet,         // supplies delegates that can cancel the task
            token,          // The token to use when making a payment
            recipient,      // The recipient of the payment
            paymentAmount   // How much of the token to send each payment
        );

        delegate.schedule(paymentTask); // schedules the payment task with the payment delegate
        alarmClock.start(paymentTask);  // assigns the payment task to the alarm clock and starts the alarm

        emit CreatePayment_event(msg.sender, paymentTask);
    }

    event CreatePayment_event (address indexed owner, RecurringPayment recurringPayment);
    
}
