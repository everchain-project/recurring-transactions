pragma solidity ^0.5.0;

import "./external/CloneFactory.sol";
import "./RecurringTransaction.sol";
import "./Interfaces.sol";

/// @title RecurringTransactionFactory Contract
/// @author Joseph Reed
/// @dev This contract's goal is to create a recurring transactions
contract RecurringTransactionFactory is CloneFactory {

    uint public blockCreated = block.number;

    RequestFactoryInterface public EAC;  // The Ethereum Alarm Clock deploys decentralized alarms
    address public blueprint;            // The recurring transaction blueprint to supply the clone factory

    mapping (address => bool) public created;

    /// @notice Constructor to create a DelegatedWalletFactory
    /// @param _EAC The contract responsible for deploying decentralized alarms 
    /// @param _blueprint The recurring transaction blueprint 
    constructor (
        RequestFactoryInterface _EAC, 
        address _blueprint
    ) public {
        EAC = _EAC;
        blueprint = _blueprint;
    }

    /// @notice Creates a recurring transaction smart contract
    /// @param delegate The delegate from which to pull transaction costs
    /// @param wallet The funding wallet, change address, and owner of the deployed alarms
    /// @return The recurring transaction contract address
    function create (
        IDelegatedWallet wallet,
        IPaymentDelegate delegate
    ) public returns (RecurringTransaction rtx) {
        // for converting to payable addresses see: 
        // https://solidity.readthedocs.io/en/v0.5.0/050-breaking-changes.html?highlight=address_make_payable
        address payable clone = address(uint160(createClone(blueprint)));
        rtx = RecurringTransaction(clone);
        rtx.initialize(EAC, wallet, delegate);

        created[clone] = true;

        emit Create_event(msg.sender, rtx);
    }

    event Create_event(address indexed caller, RecurringTransaction rtx);

}
