pragma solidity ^0.5.0;

import "./external/BokkyPooBahsDateTimeLibrary.sol";
import "./Interfaces.sol";

/// @title Recurring Transaction Contract
/// @author Joseph Reed
/// @dev This contract's allows decentralized execution of on-chain recurring tasks. It requires three main components:
///     1. An external source for calling transactions at future time. This contract uses the Ethereum Alarm Clock (EAC)
///     2. A transaction scheduler with the Recurring Transaction scheduled
///     3. A funded delegated wallet with the transaction scheduler set as a delegate
/// The owner sets a maximum cost that they are willing to spend on a given transaction execution in their preferred token.
/// To calculate the cost a gas price oracle determines the current network price times the transaction gas cost. A new
/// transaction will fail if the cost to schedule is too high. As long as the delegated wallet has enough funds, the
/// recurring transactions will continue to execute.
contract RecurringTransaction is IRecurringTransaction {

    using BokkyPooBahsDateTimeLibrary for uint; // A Date/Time library for manipulating timestamps
    uint public blockInitialized;               // The block this contract was initialized

    // IFutureTransaction
    address public factory;                     // The factory that deployed this contract
    ITransactionScheduler public scheduler;     // The delegate that pulls transaction costs
    IDelegatedWallet public wallet;             // Transaction costs are paid by the wallet

    // IPayment
    address public recipient;                   // The destination address for future payments
    address constant token = address(0x0);      // The token to pull for payments. Ether = 0x0

    // Ethereum Alarm Clock Options
    RequestFactoryInterface public EAC;         // Interface provided by the Ethereum Alarm Clock
    address public priorityCaller;              // The priority recipient receives a bonus when the transaction is executed
    address public txRequest;                   // The next scheduled transaction request contract
    uint[3] public limits;                      // The execution limits used when calling the transaction
    uint public windowStart;                    // The start of the execution window for the current interval
    uint public windowSize;                     // The span of time during which a transaction can be executed

    // Recurring Transaction Options
    uint public blockStarted;                   // The block the current recurring transaction started
    uint public intervalValue;                  // The value of the time unit when calculating the next transaction timestamp
    uint public intervalUnit;                   // The time unit used when calculating the next window start:
                                                // 0 = seconds, 1 = minutes, 2 = hours, 3 = days, 4 = months, 5 = years
    uint public maxIntervals;                   // The number of times this recurring transaction will go off. 0 = infinite
    uint public currentInterval;                // Keeps track of how many transactions have been called
    uint public callGas;                        // The amount of extra gas to add when calling each transaction

    // Cost Options
    IUintFeed public gasPrice;                  // Fetches the current gas price of the network
    IUintFeed public tokenPrice;                // Fetches the current token price
    uint public baseGasCost;                    // The minimum amount of gas it takes to run a recurring transaction not including the task
    uint public totalGasCost;                   // The total amount of gas used for the entire transaction
    uint public maximumCost;                    // The maximum token cost the user is willing to pay // 0 == infinite

    // Execution Options
    address payable public callAddress;         // The address of the contract to call
    bytes public callData;                      // The data to send with the contract call
    uint public callValue;                      // The amount of ether to send with the contract call

    /// @notice The constructor must force the master copy to be initialized to ensure the master copy can never
    /// be owned and/or self destructed using the destroy function.
    constructor() public {
        blockInitialized = block.number;
    }

    /// @notice Uses 'initialize()' instead of a constructor to make use of the clone
    ///         factory at https://github.com/optionality/clone-factory. In general, 'initialize()' should be
    ///         called directly following the recurring transaction deployment through the use of a factory.
    /// @param _EAC The Ethereum Alarm Clock smart contract responsible for decentralized execution of future transactions.
    /// @param _wallet The funding wallet, change address, and owner of the deployed recurring transactions
    /// @param _scheduler The delegate from which to pull transaction costs and execute transaction calls
    function initialize (
        RequestFactoryInterface _EAC,
        IDelegatedWallet _wallet,
        ITransactionScheduler _scheduler
    ) public {
        require(blockInitialized == 0, "contract already initialized");

        factory = msg.sender;
        blockInitialized = block.number;
        baseGasCost = 700000;

        EAC = _EAC;
        wallet = _wallet;
        scheduler = _scheduler;
        recipient = address(this);
    }

    function start (
        address payable _callAddress,
        bytes memory _callData,
        uint[8] memory _callOptions
    ) public onlyDelegates {
        require(_callAddress != address(0x0), "call address must not be empty");
        require(_callOptions[2] > now, "start timestamp cannot be in the past");
        require(_callOptions[3] != 0, "window size cannot be zero");

        callAddress = _callAddress;
        callData = _callData;
        callValue = _callOptions[0];
        callGas = _callOptions[1];
        windowStart = _callOptions[2];
        windowSize = _callOptions[3];
        intervalValue = _callOptions[4];
        intervalUnit = _callOptions[5];
        maxIntervals = _callOptions[6];
        maximumCost = _callOptions[7];

        blockStarted = block.number;
        totalGasCost = baseGasCost + callGas;
        currentInterval = 1;

        scheduleTransaction();

        emit Start_event(msg.sender, _callAddress, _callData, _callOptions);
    }

    /// @notice The default function collects ether sent by the TransactionScheduler and is also called by
    /// each 'txRequest' during execution
    function () external payable {
        if(msg.value > 0)
            emit AlarmPaid_event(msg.sender, msg.value);
        else
            executeTransaction();
    }

    /// @notice The heart of the recurring transaction.
    ///     1. Check if the caller is the current tx request
    ///     2. Execute the transaction
    ///     3. Schedule a new tx request
    function executeTransaction () internal {
        require(msg.sender == txRequest, "msg.sender must be tx request");

        if(callValue != 0)
            scheduler.transfer(address(0x0), address(this), callValue);

        bool success; bytes memory result;
        if(address(this).balance >= callValue)
            (success, result) = callAddress.call.value(callValue).gas(callGas)(callData);

        emit Execute_event(txRequest, callAddress, callValue, callData, currentInterval, maxIntervals, success, result);

        if(currentInterval < maxIntervals || maxIntervals == 0) {
                 if(intervalUnit == 0) windowStart = windowStart.addSeconds(intervalValue);
            else if(intervalUnit == 1) windowStart = windowStart.addMinutes(intervalValue);
            else if(intervalUnit == 2) windowStart = windowStart.addHours(intervalValue);
            else if(intervalUnit == 3) windowStart = windowStart.addDays(intervalValue);
            else if(intervalUnit == 4) windowStart = windowStart.addMonths(intervalValue);
            else if(intervalUnit == 5) windowStart = windowStart.addYears(intervalValue);

            scheduleTransaction();
        } else {
            delete txRequest;
        }

        currentInterval++;
    }

    function amount () public returns (uint) {
        return totalGasCost * gasPrice.read();
    }

    function tokenCost () public returns (uint) {
        return amount() * tokenPrice.read() / 10^18;
    }

    /// @notice Schedules a new transaction request with the Ethereum Alarm Clock
    function scheduleTransaction () internal {
        uint costInWei = amount();
        if(maximumCost == 0 || tokenCost() > maximumCost)
            scheduler.transfer(token, address(this), costInWei);

        if(address(this).balance >= costInWei){
            uint endowment = address(this).balance;         // Commit all available ether to the next transaction
            uint priorityFee = endowment / 100;             // Set one percent aside for the priority caller
            uint timeBounty = endowment - priorityFee;      // Set the remaining ether aside for the time bounty

            address[3] memory addressOptions = [
                address(wallet),    // Owner of the txRequest and any change left after execution
                priorityCaller,     // The base reward sent to the priority caller
                address(this)       // The contract to call at execution
            ];

            uint[12] memory uintOptions = [
                priorityFee,        // A fee that goes to the fee recipient
                timeBounty,         // The bounty for the account that triggers this transaction request
                limits[0],          // claimWindowSize
                limits[1],          // freezeintervalDuration
                limits[2],          // reservedWindowSize
                2,                  // 1 = use block based scheduling, 2 = Use timestamp based scheduling
                windowSize,         // The size of the execution window
                windowStart,        // The start of the execution window
                totalGasCost,       // The amount of gas to be sent with the transaction
                0,                  // The amount of ether to be sent
                0,                  // The minimum gas price for the transaction when called
                endowment           // The required deposit by the claimer
            ];

            txRequest = EAC.createValidatedRequest.value(endowment)(addressOptions, uintOptions, "");

            if(txRequest != address(0x0))
                emit ValidRequest_event(txRequest);
            else
                emit InvalidRequest_event(EAC.validateRequestParams(addressOptions, uintOptions, endowment));
        }
    }

    /// @notice Cleans up and destroys the recurring transaction. Any leftover ether is sent to the wallet.
    function destroy () public onlyDelegates {
        scheduler.unschedule();
        emit Destroy_event(msg.sender);

        selfdestruct(address(wallet));
    }

    /// @notice Sets the priority caller that receives the base reward when a transaction is called.
    /// @param _priorityCaller The address that receives the base reward
    function setPriorityCaller (address _priorityCaller) public onlyDelegates {
        priorityCaller = _priorityCaller;
    }

    /// @notice Sets the execution limits for when a future transaction can be claimed, called, or cancelled.
    /// @param _limits The execution limits applied to each recurring transaction
    function setExecutionLimits (uint[3] memory _limits) public onlyDelegates {
        limits = _limits;
    }

    function setGasPriceFeed (IUintFeed newGasPriceFeed) public onlyDelegates {
        gasPrice = newGasPriceFeed;
    }

    function setTokenPriceFeed (IUintFeed newPriceFeed) public onlyDelegates {
        tokenPrice = newPriceFeed;
    }

    function setMaximumCost (uint newMaximumCost) public onlyDelegates {
        maximumCost = newMaximumCost;
    }

    modifier onlyDelegates () {
        require(wallet.isDelegate(msg.sender), "msg sender must be a delegate");
        _;
    }

    event AlarmPaid_event (address indexed msgSender, uint msgValue);
    event ValidRequest_event (address txRequest);
    event InvalidRequest_event (bool[6] reason);
    event Start_event(
        address indexed delegate,
        address indexed callAddress,
        bytes callData,
        uint[8] callOptions
    );
    event Execute_event(
        address txRequest,
        address indexed callAddress,
        uint callValue,
        bytes callData,
        uint currentInterval,
        uint maxIntervals,
        bool success,
        bytes result
    );
    event Destroy_event(address indexed delegate);

}
