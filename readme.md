# Recurring Alarm Clock

The **Recurring Alarm Clock** is a suite of smart contracts for creating recurring alarms on the Ethereum Network. Whenever the alarm clock goes off, it executes a customized task, schedules a new alarm, and then waits for the next alarm to trigger.

Features include:

- Decentralized alarms provided by [Ethereum Alarm Clock](https://www.ethereum-alarm-clock.com/)
- Static time intervals (ie: every 7 days)
- Arbitrary time intervals (ie: on the first of each month) made possible by [bokkypoobah](https://github.com/bokkypoobah/BokkyPooBahsDateTimeLibrary)

## Creating A Recurring Alarm Clock Using The Factory

Prerequisites:

1. The caller must be a delegate of the wallet
2. The payment delegate must be delegate of the wallet
3. The factory must be allowed to schedule payments with the payment delegate

```
function createAlarmClock(
	IDelegatedWallet wallet,
	IPaymentDelegate delegate,
	IGasPriceOracle gasPriceOracle,
	address priorityCaller,
	address payable callAddress,
	bytes memory callData,
	uint[10] memory callOptions,    // callValue, callGas, startTimestamp, intervalValue, intervalUnit, maxIntervals, claimWindowSize, freezeintervalDuration, reservedWindowSize, executionWindow
) public returns (RecurringAlarmClock alarmClock)
```

## Deployed Contracts

| Kovan Contract | Contract Address |
| --- | --- |
| BokkyPooBahsDateTimeLibrary | 0xE5fabf4199cd5fbBC9780c521d5f069667D5729f |
| GasPriceOracle | 0xF1FAAE551452ECb017F4806c334c686568A073C3 |
| DecentralizedPaymentDelegate | 0x53c4951a03e26e870Ffa35D95b7825cdD17F2556 |
| RecurringAlarmClockBlueprint | 0x653C49f2FaeF9B40E966c0E97cB371b68Cc72b04 |
| RecurringAlarmClockFactory | 0xF21703F563529827FF5dc18ea0271BC1A4c477D8 |
| RecurringAlarmClockWizard | 0xB1Cad5a9de483e8cdD25C3B9E962e5fDC3b565BE |

| Live Contract | Contract Address |
| --- | --- |
| GasPriceOracle | coming soon |
| PaymentDelegate | coming soon |
| RecurringAlarmClock | coming soon |
| RecurringAlarmClockFactory | coming soon |
