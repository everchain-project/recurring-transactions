pragma solidity ^0.5.0;

import "./RecurringTransactionFactory.sol";
import "./GasPriceOracle.sol";
import "./PaymentDelegate.sol";

/// @title RecurringTransactionDeployer
/// @author Joseph Reed
/// @dev This contract's goal is to make it super easy to create a recurring transaction by setting several default values
contract RecurringTransactionDeployer is Owned {

    uint public blockCreated = block.number;
    
    DecentralizedPaymentDelegate defaultPaymentDelegate;
    RecurringTransactionFactory public defaultFactory;
    GasPriceOracle public defaultOracle;
    address public defaultCaller;
    uint[3] public defaultLimits;

    /// @notice Constructor to create a smart contract which aids in creating a recurring transaction
    /// @param _defaultPaymentDelegate The default payment delegate contract responsible for handling payments
    /// @param _defaultFactory The default factory contract responsible for deploying decentralized transactions
    /// @param _defaultOracle The default gas price oracle responsible for predicting future gas costs
    constructor (
        DecentralizedPaymentDelegate _defaultPaymentDelegate,
        RecurringTransactionFactory _defaultFactory,
        GasPriceOracle _defaultOracle
    ) public {
        defaultPaymentDelegate = _defaultPaymentDelegate;
        defaultFactory = _defaultFactory;
        defaultOracle = _defaultOracle;
        defaultCaller = msg.sender;
        
        defaultLimits[0] = 60 minutes;  // claimWindowSize
        defaultLimits[1] = 3 minutes;   // freezeIntervalDuration
        defaultLimits[2] = 5 minutes;   // reservedWindowSize
    }

    function setDefaultOracle (GasPriceOracle newDefaultOracle) public onlyOwner {
        defaultOracle = newDefaultOracle;
    }

    function setDefaultCaller (address newDefaultCaller) public onlyOwner {
        defaultCaller = newDefaultCaller;
    }

    /// @notice Creates a recurring transaction belonging to the specified wallet
    /// @param wallet The funding wallet, change address, and owner of the deployed alarms
    /// @return The recurring transaction contract address
    function deploy (IDelegatedWallet wallet) public returns (RecurringTransaction rtx) {
        require(wallet.isDelegate(msg.sender), "the caller must be a wallet delegate");
        
        rtx = defaultFactory.create(wallet, defaultPaymentDelegate);
        rtx.setExecutionLimits(defaultLimits);
        rtx.setGasPriceOracle(defaultOracle);
        rtx.setPriorityCaller(defaultCaller);

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
        uint[7] memory callOptions
    ) public returns (RecurringTransaction rtx) {
        require(wallet.isDelegate(msg.sender), "the caller must be a wallet delegate");
        require(wallet.isDelegate(address(defaultPaymentDelegate)), "the default payment delegate must be a wallet delegate");

        rtx = deploy(wallet);
        defaultPaymentDelegate.schedule(rtx);
        rtx.start(callAddress, callData, callOptions);

        emit Deploy_event(msg.sender, address(rtx));
    }    

    event Deploy_event(address indexed caller, address rtx);

}
