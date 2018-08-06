# Everchain Payment Scheduler

The **Everchain Payment Scheduler** is a decentralized payment scheduler on the Ethereum Blockchain for creating automatic recurring on-chain payments in Ether or any ERC20 token.

Features include:

- Capable of static or arbitrary payment amounts
- Capable of static or arbitrary payment intervals
- Alarms can be centralized or decentralized depending on use case (safety vs efficiency)

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

A scheduled Recurring Payment requires a minimum of five components:

1. An Alarm Clock smart contract that calculates when to schedule each payment. The Alarm Clock can be customized to allow different payment intervals but it must define at least an Alarm Token so the scheduler knows what token to pull from the delegated wallet, a Get Next Alarm Cost function to calculate how much Ether is required to pay for the next alarm, and a Set Next Alarm function to calculate the next alarm timestamp and then schedule it. 
2. A Delegated Wallet smart contract that holds user’s funds. It must have the EPS set as a delegate so it can execute payment transfers and withdraw alarm costs.
3. A Recipient Ethereum Address or compatible receiving smart contract. 
4. A Spend Token which is either an ERC20 token or native Ether.
5. A Process function to calculate the amount of tokens to send with the current payment. Code executed here is completely customizable depending on the type of payment being created.
More complex payments will require separate components than the five above and thus creating a raw Recurring Payment is tedious if done piece by piece. A Recurring Payment Factory (RPF) should be created to help form each unique payment type.

### Alarm Clock

see [components](../components).

### Delegated Wallet

see [components](../components).

### Recipient Address

The **Recipient** can be any basic ethereum account or compatible smart contract. Any smart contract can receive ERC20 tokens, however, a smart contract must have a payable fallback function to receive Ether.

```
contract ExampleRecipientContract is Owned {
    
    function collectEther () public onlyOwner {
        owner.transfer(this.balance);
    }

    function collectToken (ERC20 token) public onlyOwner {
        token.transfer(owner, token.balanceOf(this));
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

When an alarm is triggered the **Payment Scheduler** calls the `process()` function of the **Recurring Payment** smart contract. The **Recurring Payment** smart contract then calculates the proper send amount and passes it back to the **Payment Scheduler**. The **Payment Scheduler** then transfers the send amount from the **Delegated Wallet** to the payment **Recipient**. Note that the **Payment Scheduler** *must* be a delegate of the wallet. Regardless of if the payment goes through, the **Payment Scheduler** will attempt to schedule the next alarm. First the **Payment Scheduler** fetches the cost of the next alarm from the supplied **Alarm Clock**, it then pulls that amount from the **Delegated Wallet** and uses it to schedule the next alarm.
