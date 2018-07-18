# Everchain Payment Scheduler

The **Everchain Payment Scheduler** is a decentralized payment scheduler on the Ethereum Blockchain for creating recurring on-chain payments in Ether or any ERC20 token.

Features include:

- Capable of static or arbitrary payment amounts
- Capable of static or arbitrary payment intervals
- Alarms can be centralized or decentralized depending on use case (safety vs efficiency)

```
contract IPaymentScheduler {
    function schedule (IRecurringPayment payment) public returns (address alarm);
    function trigger (address alarm) public returns (address nextAlarm);
}
```

## Scheduling A Recurring Payment

To schedule a payment with the **Payment Scheduler** you must supply a **Recurring Payment** smart contract. The **Recurring Payment** must containt all the components necessary for the Payment Scheduler and any extra information needed when the `process()` function is called by the **Payment Scheduler**.

```
contract IRecurringPayment is Owned {
    IAlarmClock public alarmClock;
    IDelegatedWallet public wallet;
    address public recipient;
    address public spendToken;
    function process () public returns (uint paymentAmount);
}
```

### Alarm Clock

see [components](../components).

### Delegated Wallet

see [components](../components).

### Recipient Address

The **Recipient** can be any basic ethereum account or compatible smart contract. Any smart contract can receive ERC20 tokens, however, a smart contract must have a payable fallback function to receive Ether.

```
contract ExampleReceivingContract is Owned {
    
    function collect () public onlyOwner {
        owner.transfer(this.balance);
    }
    
    function () public payable {
        emit EtherDeposit_event(msg.sender, msg.value);
    }
    
    event EtherDeposit_event(address sender, uint value);
}
```

### Spend Token Address

The **Spend Token** is the address of the ERC20 token that is being sent for a particular payment. If the payment is in ether, the address will be `0x0`

### Process Payment Amount

When an alarm is triggered the **Payment Scheduler** calls the `process()` function of the **Recurring Payment** smart contract. The **Recurring Payment** smart contract then calculates the proper send amount and passes it back to the **Payment Scheduler**. The **Payment Scheduler** then transfers the send amount from the **Delegated Wallet** to the payment Recipient. Note that the **Payment Scheduler** *must* be a delegate of the wallet. Regardless of if the payment goes through, the **Payment Scheduler** will attempt to schedule the next alarm. First the **Payment Scheduler** fetches the cost of the next alarm from the supplied **Alarm Clock**, it then pulls that amount from the **Delegated Wallet** and uses it to schedule the next alarm.
