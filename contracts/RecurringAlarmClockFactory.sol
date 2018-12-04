pragma solidity ^0.5.0;

import "./external/CloneFactory.sol";
import "./RecurringAlarmClock.sol";
import "./Interfaces.sol";

/// @title RecurringAlarmClockFactory Contract
/// @author Joseph Reed
/// @dev This contract's goal is to create a recurring alarm clocks
contract RecurringAlarmClockFactory is CloneFactory, IRecurringAlarmClockFactory {

    uint public blockCreated = block.number;

    RequestFactoryInterface public ethereumAlarmClock;  // The contract responsible for deploying decentralized alarms
    address public blueprint;                           // The recurring alarm clock blueprint to supply the clone factory

    /// @notice Constructor to create a DelegatedWalletFactory
    /// @param _ethereumAlarmClock The contract responsible for deploying decentralized alarms 
    /// @param _blueprint The recurring alarm clock blueprint 
    constructor (
        RequestFactoryInterface _ethereumAlarmClock, 
        address _blueprint
    ) public {
        ethereumAlarmClock = _ethereumAlarmClock;
        blueprint = _blueprint;
    }

    /// @notice Creates a delegated wallet with the owner set to 'owner' and no delegates
    /// @param delegate The delegate from which to pull alarm payments
    /// @param wallet The funding wallet, change address, and owner of the deployed alarms
    /// @param priorityCaller The priority caller receives a base amount of the alarm fee regardless of if they call the alarm.
    /// @param gasPrice The feed that supplies the current network gas price
    /// @param safetyMultiplier The feed that supplies a safety multiplier used when calculating alarm costs
    /// @param ethereumAlarmClockOptions The options used for creating decentralized alarms.
    /// @return The recurring alarm clock contract
    function createAlarmClock(
        IDelegatedWallet wallet,
        IPaymentDelegate delegate,
        IGasPriceOracle gasPriceOracle,
        address priorityCaller,
        uint[5] memory ethereumAlarmClockOptions
    ) public returns (IRecurringAlarmClock) {
        // see https://solidity.readthedocs.io/en/v0.5.0/050-breaking-changes.html?highlight=address_make_payable
        // for converting to payable addresses
        address payable clone = address(uint160(createClone(blueprint)));
        RecurringAlarmClock alarmClock = RecurringAlarmClock(clone);
        alarmClock.initialize(
            address(this),
            wallet,
            delegate,
            gasPriceOracle,
            ethereumAlarmClock,
            priorityCaller,
            ethereumAlarmClockOptions
        );

        emit AlarmClock_event(msg.sender, address(alarmClock));

        return alarmClock;
    }

    event AlarmClock_event(address indexed caller, address alarmClock);

}
