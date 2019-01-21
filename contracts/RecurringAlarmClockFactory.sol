pragma solidity ^0.5.0;

import "./external/CloneFactory.sol";
import "./RecurringAlarmClock.sol";
import "./Interfaces.sol";

/// @title RecurringAlarmClockFactory Contract
/// @author Joseph Reed
/// @dev This contract's goal is to create a recurring alarm clocks
contract RecurringAlarmClockFactory is CloneFactory {

    uint public blockCreated = block.number;

    RequestFactoryInterface public EAC;  // The Ethereum Alarm Clock deploys decentralized alarms
    address public blueprint;            // The recurring alarm clock blueprint to supply the clone factory

    /// @notice Constructor to create a DelegatedWalletFactory
    /// @param _EAC The contract responsible for deploying decentralized alarms 
    /// @param _blueprint The recurring alarm clock blueprint 
    constructor (
        RequestFactoryInterface _EAC, 
        address _blueprint
    ) public {
        EAC = _EAC;
        blueprint = _blueprint;
    }

    /// @notice Creates a recurring alarm clock smart contract
    /// @param delegate The delegate from which to pull alarm payments
    /// @param wallet The funding wallet, change address, and owner of the deployed alarms
    /// @return The recurring alarm clock contract address
    function createAlarmClock(
        IDelegatedWallet wallet,
        IPaymentDelegate delegate
    ) public returns (RecurringAlarmClock alarmClock) {
        // for converting to payable addresses see: 
        // https://solidity.readthedocs.io/en/v0.5.0/050-breaking-changes.html?highlight=address_make_payable
        address payable clone = address(uint160(createClone(blueprint)));
        alarmClock = RecurringAlarmClock(clone);
        alarmClock.initialize(EAC, wallet, delegate);

        emit CreateAlarmClock_event(msg.sender, address(alarmClock));
    }

    event CreateAlarmClock_event(address indexed caller, address alarmClock);

}
