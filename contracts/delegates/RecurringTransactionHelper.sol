pragma solidity ^0.5.0;

import "../RecurringTransactionFactory.sol";
import "./TransactionScheduler.sol";

/// @title RecurringTransactionDeployer
/// @author Joseph Reed
/// @dev This contract's goal is to make it super easy to create a recurring transaction by setting several default values
contract RecurringTransactionHelper {

    uint public blockCreated = block.number;

    TransactionScheduler defaultScheduler;
    RecurringTransactionFactory public defaultFactory;
    IUintFeed public defaultGasPriceFeed;
    IUintFeed public defaultTokenPriceFeed;
    address public defaultPriorityCaller;
    uint[3] public defaultLimits;

    /// @notice Constructor to create a smart contract which aids in creating a recurring transaction
    /// @param _defaultScheduler The default payment delegate contract responsible for handling payments
    /// @param _defaultFactory The default factory contract responsible for deploying decentralized transactions
    /// ... todo
    constructor (
        TransactionScheduler _defaultScheduler,
        RecurringTransactionFactory _defaultFactory,
        IUintFeed _defaultGasPriceFeed,
        IUintFeed _defaultTokenPriceFeed
    ) public {
        defaultScheduler = _defaultScheduler;
        defaultFactory = _defaultFactory;
        defaultGasPriceFeed = _defaultGasPriceFeed;
        defaultTokenPriceFeed = _defaultTokenPriceFeed;
        defaultPriorityCaller = msg.sender;

        defaultLimits[0] = 180 minutes;     // claimWindowSize
        defaultLimits[1] = 3 minutes;       // freezeIntervalDuration
        defaultLimits[2] = 180 minutes;     // reservedWindowSize
    }

    /// @notice Creates a recurring transaction belonging to the specified wallet
    /// @param wallet The funding wallet, change address, and owner of the deployed alarms
    /// @return The recurring transaction contract address
    function deploy (IDelegatedWallet wallet) public returns (RecurringTransaction rtx) {
        require(wallet.isDelegate(msg.sender), "the caller must be a wallet delegate");

        rtx = defaultFactory.create(wallet, defaultScheduler);
        rtx.setExecutionLimits(defaultLimits);
        rtx.setGasPriceFeed(defaultGasPriceFeed);
        rtx.setTokenPriceFeed(defaultTokenPriceFeed);
        rtx.setPriorityCaller(defaultPriorityCaller);

        emit Deploy_event(msg.sender, address(rtx));
    }

    /// @notice Creates and starts a recurring transaction belonging to the specified wallet with the specified call options
    /// @param wallet The funding wallet, change address, and owner of the deployed alarms
    /// @param callAddress The address the transaction will call each time it is triggered
    /// @param callData The data the transaction will send with the call
    /// @param callOptions The options defining how and when to trigger the transaction
    ///        [callValue, callGas, startTimestamp, windowSize, intervalValue, intervalUnit, maxIntervals]
    /// @return The recurring transaction contract address
    function deployAndStart (
        IDelegatedWallet wallet,
        address payable callAddress,
        bytes memory callData,
        uint[8] memory callOptions
    ) public returns (RecurringTransaction rtx) {
        require(wallet.isDelegate(msg.sender), "the caller must be a wallet delegate");
        require(wallet.isDelegate(address(defaultScheduler)), "the default scheduler must be a wallet delegate");

        rtx = deploy(wallet);
        defaultScheduler.schedule(rtx);
        rtx.start(callAddress, callData, callOptions);
    }

    event Deploy_event(address indexed caller, address rtx);

}
