# Everchain Payment Scheduler

The **Everchain Payment Scheduler** is a decentralized payment scheduler on the Ethereum Blockchain for creating recurring on-chain payments in Ether or any ERC20 token.

```
contract IPaymentScheduler {
    function schedule (IRecurringPayment payment) public returns (address alarm);
    function trigger (address alarm) public returns (address nextAlarm);
}
```

Features include:

- Static or arbitrary payment amounts
- Static or arbitrary payment intervals
- Decentralization as a spectrum


## Scheduling A Recurring Payment

To schedule a payment with the **Payment Scheduler** you must supply a **Recurring Payment** smart contract. The **Recurring Payment** must containt all the components necessary for the Payment Scheduler and any extra information needed when the `process()` function is called by the **Payment Scheduler**.

```
contract IRecurringPayment {
    IAlarmClock public alarmClock;
    IDelegatedWallet public wallet;
    address public recipient;
    address public spendToken;
    function process () public returns (uint paymentAmount);
}
```

### Alarm Clock

The **Alarm Clock** is the smart contract responsible for creating the alarms that trigger each payment.

```
contract IAlarmClock {
    SchedulerInterface public alarmScheduler;
    IPriceOracle public  priceOracle;
        
    uint public windowStart; // The payment can be executed after the 'windowStart' timestamp
    uint public windowSize;  // The payment has 'windowSize' seconds to be executed or it fails
    uint public gas;         // The amount of gas to call the transaction with
    
    function setNextAlarm () public payable returns (address);
    function getNextAlarmCost() public view returns (uint);
}
```

The **Scheduler Interface** is an alarm scheduler such as the [Ethereum Alarm Clock](https://ethereum-alarm-clock.readthedocs.io/en/latest/). The **Price Oracle** is responsible for predicting the future cost (in ether) of an alarm. This smart contract can be centralized or decentralized depending on if you want reliable and efficienct payments versus safe and less efficient payments.

```
contract IPriceOracle {
    function gasPrice (uint futureTimestamp) public view returns (uint);
    function alarmFee (uint futureTimestamp) public view returns (uint);
    function protocolFee (uint futureTimestamp) public view returns (uint);
    function claimDeposit (uint futureTimestamp) public view returns (uint);
}
```

### Delegated Wallet

A **Delegated Wallet** is a smart contract that allows any account assigned as a *delegate* to transfer funds out of the wallet. In addition, delegates can register triggers which can only be called by an account assigned by the delegate. Triggers don't move funds, but does allow the wallet to call another smart contract that could move funds (such as a delegate).

```
contract IDelegatedWallet {
    function transfer (address token, address to, uint amount) public returns (bool);
    function registerTrigger (address caller, address target, bytes4 callData) public;
    function isDelegate (address account) public returns (bool);
}
```

### Recipient

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

### Spend Token

The **Spend Token** is the address of the ERC20 token that is being sent for a particular payment. If the payment is in ether, the address will be `0x0`

