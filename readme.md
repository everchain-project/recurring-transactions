# On-chain Recurring Tranactions

A **Recurring Transaction (RTx)** is a smart contracts for automatically triggering repetitive tasks on the Ethereum Blockchain. Whenever a Recurring Transaction goes off, it executes a custom task, schedules a new transaction, and then waits for it to trigger. 

Features:

- Decentralized alarms provided by [Ethereum Alarm Clock](https://www.ethereum-alarm-clock.com/)
- Static (ie: every 7 days) or smart intervals (ie: on the first of each month) made possible by [bokkypoobah](https://github.com/bokkypoobah/BokkyPooBahsDateTimeLibrary)
- An easy to use [RTx Manager](https://everchain-project.github.io/recurring-transactions/) for creating and managing Recurring Transactions.
- Flexible [wallet architecture](https://github.com/everchain-project/delegated-wallet) gives dapps plug-n-play access to your wallet funds.

### Current Smart Contract Addresses

These are the currently deployed smart contracts for creating and managing Recurring Transactions.

| Kovan | Contract Address |
| --- | --- |
| BokkyPooBahs Date/Time Library | 0xB8e2BbeC99f645E4E6861Bd94402B5bf7f53A45B |
| Gas Price Oracle | 0xb861aA7245cd7c05915B72B8682FD0f98bb54856 |
| Payment Delegate | 0xA4d7DAbfC0f35F21BA3aF20FA247be7A843E0439 |
| Recurring Transaction Blueprint | 0xE9438F699fb89014eD7311D14706048fe26da600 |
| Recurring Transaction Factory | 0x62dDD8e77D56c2E7b61E5c4E078fBfDd4fAfA459 |
| Recurring Transaction Deployer | 0x112989Fa4B2EC6AA263659F35E3021B30D8C51c9 |

| Live | Contract Address |
| --- | --- |
| BokkyPooBahs Date/Time Library | coming soon |
| Gas Price Oracle | coming soon |
| Payment Delegate | coming soon |
| Recurring Transaction Blueprint | coming soon |
| Recurring Transaction Factory | coming soon |
| Recurring Transaction Deployer | coming soon |

### Creating a Recurring Transaction Using the Factory

Creating an Recurring Transaction using the Factory requires only two arguments:

```
function create (
    IDelegatedWallet wallet,
    IPaymentDelegate delegate
) public returns (RecurringTransaction rtx)
```

The provided Payment Delegate **must** be a delegate of the provided Wallet in order for the Recurring Transaction to function. A delegate of the Wallet must then also schedule the created Recurring Transaction with the Payment Delegate.

```
function schedule (IPayment payment) public returns (bool success)
```
The Payment Delegate is responsible for pulling funds for each alarm created by the recurring transaction.

### Creating a Recurring Transaction Using the Recurring Transaction Deployer

The above process is fairly tedious and thus the Recurring Transaction Deployer does all of the heavy lifting by scheduling and/or starting the alarm in one function. It uses as many default options as possible in order to be the most convenient way to deploy an Recurring Transaction:

```
/// @notice Creates an recurring transaction belonging to the specified wallet
/// @param wallet The funding wallet, change address, and owner of the deployed alarms
/// @return The recurring recurring transaction contract address
function deploy (IDelegatedWallet wallet) public returns (RecurringTransaction rtx)
```

The Recurring Transaction Deployer also provides a way to deploy and start an Recurring Transaction using the default settings:

```
function deployAndStart (
    IDelegatedWallet wallet,
    address payable callAddress,
    bytes memory callData,
    uint[7] memory callOptions    // callValue, callGas, startTimestamp, windowSize, intervalValue, intervalUnit, maxIntervals
) public returns (RecurringTransaction rtx)
```

where:

```
_callOptions[0] = callValue;        // The amount of ether to send with the contract call
_callOptions[1] = callGas;          // The amount of extra gas to add to the BASE_GAS_COST when scheduling an alarm
_callOptions[2] = alarmStart;       // The start of the execution window for the current alarm
_callOptions[3] = windowSize;       // The number of seconds after the alarm start in which the alarm can be executed
_callOptions[4] = intervalValue;    // The value of the time unit when calculating the next alarm timestamp
_callOptions[5] = intervalUnit;     // The time unit used when calculating the next alarm timestamp: 
                                    // 0 = seconds, 1 = minutes, 2 = hours, 3 = days, 4 = months, 5 = years
_callOptions[6] = maxIntervals;     // The number of times this recurring transaction will go off. 0 = infinite
```

### Starting/Resetting a Recurring Transaction

Once the Recurring Transaction is deployed, it can be started (and reset) by a wallet delegate at any time:

```
function start (
    address payable _callAddress,   // The address of the contract to call
    bytes memory _callData,         // The data to send with the contract call
    uint[7] memory _callOptions     // The options to use when calling the transaction
) public onlyDelegates
```
