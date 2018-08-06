# Components

Each components represent a customizable piece of each recurring payment. A few components are required for every recurring payments, where as some are optional and used to provide more advanced payment options.

## Delegated Wallet

A **Delegated Wallet** is a smart contract that allows any account assigned as a *delegate* to transfer funds out of the wallet. In addition, delegates can register triggers which can only be called by an account assigned by the delegate. Triggers don't move funds, but does allow the wallet to call another smart contract that could move funds (such as a delegate).

```
contract IDelegatedWallet is Owned {
    function isDelegate (address account) public view returns (bool);
    function transfer (address token, address to, uint amount) public returns (bool);
    function approve (address token, address to, uint amount) public returns (bool);
    function addDelegate (address account) public;
    function removeDelegate (address account) public;
    function registerTrigger (address caller, address target, bytes4 callData) public;
}
```

## Alarm Clock (required)

The **Alarm Clock** is the smart contract responsible for creating the alarms that trigger each payment according to the schedule set by smart contract.

```
contract IAlarmClock {
    function setNextAlarm () public payable returns (address);
    function getNextAlarmCost() public view returns (uint);
}
```

The **Scheduler Interface** is an alarm scheduler such as the [Ethereum Alarm Clock](https://ethereum-alarm-clock.readthedocs.io/en/latest/). The **Gas Price Oracle** is responsible for predicting the future cost (in ether) of an alarm. This smart contract can be centralized or decentralized depending on if you want reliable and efficient payments versus safe and less efficient payments. The **Gas Price Oracle** in this case is a simple contract where the owner of the contract can set the gas price at will. In the future, this can possibly be replaced by a 'GasDao' or integrated into a user's daily use wallet so it always has an up to date gas price. [ChronoLogic](https://blog.chronologic.network/how-to-picking-the-right-gas-price-for-scheduled-transactions-94e740328ec9) is doing continuing research in the area of finding the ideal gas price.

```
contract IGasPriceOracle {
    function gasPrice (uint futureTimestamp) public view returns (uint);
}
```

## Price Feed (optional)

(To do)