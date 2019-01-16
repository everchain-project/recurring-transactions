# Recurring Alarm Clock 

The **Recurring Alarm Clock** is a smart contracts for automatically triggering repeat tasks on the Ethereum Network. Whenever the Alarm Clock goes off, it executes a customized task, schedules a new alarm, and then waits for the next alarm to trigger. Features include:

- Decentralized alarms provided by [Ethereum Alarm Clock](https://www.ethereum-alarm-clock.com/)
- Static (ie: every 7 days) or smart intervals (ie: on the first of each month) made possible by [bokkypoobah](https://github.com/bokkypoobah/BokkyPooBahsDateTimeLibrary)
- An easy to use [Alarm Clock Manager](https://everchain-project.github.io/recurring-alarm-clock/) for creating and managing Alarm Clocks.
- Flexible [wallet architecture](https://github.com/everchain-project/delegated-wallet) allows for plug-n-play like access to your wallet funds.

### Current Smart Contract Addresses

These are the currently deployed smart contracts for creating and managing recurring Alarm Clock.

| Kovan | Contract Address |
| --- | --- |
| BokkyPooBahsDateTimeLibrary | 0x915e2C28bcf9266a35bDb10C47ef55485eba47Fe |
| GasPriceOracle | 0x11A1fB1A26081D004e14A2B4c5e2Ed818F3531ac |
| DecentralizedPaymentDelegate | 0xc5f942eBeEC23b7A17125423fA78CEAEa9Cf481E |
| RecurringAlarmClockBlueprint | 0xDAE1F2A8B277F3fC59e251Dca2E57e9C35eE27F5 |
| RecurringAlarmClockFactory | 0x532194e9F7d0AcE493ABf9aBcc5dC86d67Be8bC7 |
| RecurringAlarmClockWizard | 0x86da3B8369774B74fA7d0edE05C110efAe3c3ba3 |

| Live | Contract Address |
| --- | --- |
| BokkyPooBahsDateTimeLibrary | coming soon |
| GasPriceOracle | coming soon |
| DecentralizedPaymentDelegate | coming soon |
| RecurringAlarmClockBlueprint | coming soon |
| RecurringAlarmClockFactory | coming soon |
| RecurringAlarmClockWizard | coming soon |

### Creating a Recurring Alarm Clock using the Alarm Clock Factory

Creating an Alarm Clock using the Alarm Clock Factory requires only two arguments:

```
function createAlarmClock(
    IDelegatedWallet wallet,
    IPaymentDelegate delegate
) public returns (RecurringAlarmClock alarmClock)
```

The provided Payment Delegate **must** be a delegate of the provided Wallet in order for the Alarm Clock to function. A delegate of the Wallet must then also schedule the created Alarm Clock with the Payment Delegate.

```
/// @notice Schedules a payment. Only callable by a wallet delegate
/// @param payment The payment contract responsible for holding logic and data about the payment
function schedule (IPayment payment) public returns (bool success)
```
The Payment Delegate is responsible for pulling funds for each alarm created by the alarm clock.

### Starting an Alarm Clock

Once the Alarm Clock is deployed, it can be started (and restarted) by a wallet delegate at any time:

```
function start (
    address payable _callAddress, 	// The address of the contract to call
    bytes memory _callData, 		// The data to send with the contract call
    uint[7] memory _callOptions
) public onlyDelegates
```

where:

```
callValue = _callOptions[0]; 		// The amount of ether to send with the contract call
callGas = _callOptions[1];			// The amount of extra gas to add to the BASE_GAS_COST when scheduling an alarm
alarmStart = _callOptions[2];		// The start of the execution window for the current alarm
windowSize = _callOptions[3];		// The number of seconds after the alarm start in which the alarm can be executed
intervalValue = _callOptions[4];	// The value of the time unit when calculating the next alarm timestamp
intervalUnit = _callOptions[5];		// The time unit used when calculating the next alarm timestamp: 0 = seconds, 1 = minutes, 2 = hours, 3 = days, 4 = months, 5 = years
maxIntervals = _callOptions[6];		// The number of times this alarm clock will go off. 0 = infinite
```

### Using the Alarm Clock Wizard

The above process is fairly tedious and thus the Alarm Clock Wizard does all of the heavy lifting by scheduling and starting the alarm in one function. It uses as many default options as possible in order to be the most convenient way to deploy an Alarm Clock:

```
/// @notice Creates and starts an alarm clock belonging to the specified wallet with the specified call options
/// @param wallet The funding wallet, change address, and owner of the deployed alarms
/// @param delegate The delegate from which to pull alarm payments
/// @param callAddress The address the alarm clock will call each time it is triggered
/// @param callData The data the alarm clock will send with the call
/// @param callOptions The options defining how and when to trigger the alarm clock
/// @return The recurring alarm clock contract address
function createAndStartAlarmClock(
    IDelegatedWallet wallet,
    IPaymentDelegate delegate,
    address payable callAddress,
    bytes memory callData,
    uint[7] memory callOptions      // callValue, callGas, startTimestamp, windowSize, intervalValue, intervalUnit, maxIntervals
) public returns (RecurringAlarmClock alarmClock)
```

The Alarm Clock Wizard also provides a way to create a raw Alarm Clock without defaults:

```
/// @notice Creates an alarm clock
/// @param delegate The delegate from which to pull alarm payments
/// @param wallet The funding wallet, change address, and owner of the deployed alarms
/// @param customCaller The custom caller receives a base amount of the alarm fee regardless of if they call the alarm.
/// @param customOracle The feed that supplies the current network gas price
/// @param customLimits The ethereum alarm clock limits used when calling decentralized alarms.
/// @param callAddress The address the alarm clock will call each time it is triggered
/// @param callData The data the alarm clock will send with the call
/// @param callOptions The options defining how and when to trigger the alarm clock
/// @return The recurring alarm clock contract address
function createAndStartRawAlarmClock(
    IDelegatedWallet wallet,
    IPaymentDelegate delegate,
    IGasPriceOracle customOracle,
    address customCaller,
    uint[3] memory customLimits,
    address payable callAddress,
    bytes memory callData,
    uint[7] memory callOptions      // callValue, callGas, startTimestamp, windowSize, intervalValue, intervalUnit, maxIntervals
) public returns (RecurringAlarmClock alarmClock)
```
