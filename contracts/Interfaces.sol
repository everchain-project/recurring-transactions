pragma solidity ^0.5.0;

import "./external/Interfaces.sol";

contract ICancellable {
    function cancel() public;
}

contract IUintFeed {
    function read() public view returns (uint);
}

contract ITransactionScheduler {
    function transfer (address token, address payable recipient, uint amount) public returns (bool);
    function call (address callAddress, uint callValue, bytes memory callData) public returns (bool success, bytes memory data);
    function schedule (IFutureTransaction ftx) public returns (bool success);
    function unschedule (IFutureTransaction ftx) public returns (bool success);
    function unschedule () public returns (bool success);
}

contract IFutureTransaction {
    address public factory;
    ITransactionScheduler public scheduler;
    IDelegatedWallet public wallet;
}

contract IPayment is IFutureTransaction {
    address payable public recipient;
    ERC20 public token;

    function amount () public returns (uint);
}

contract IRecurringTransaction is IPayment {
    IUintFeed public gasPrice;
    address public priorityCaller;
    uint[3] public limits;
    uint public alarmStart;
    uint public windowSize;
    uint public intervalValue;
    uint public intervalUnit;
    uint public maxIntervals;
    uint public currentInterval;
    address public txRequest;
    address payable public callAddress;
    bytes public callData;
    uint public callValue;
    uint public callGas;

    function () external payable;
    function setExecutionLimits (uint[3] memory _limits) public;
    function setPriorityCaller (address _priorityCaller) public;
    function setGasPriceFeed (IUintFeed newGasPriceFeed) public;
    function start (address payable _callAddress, bytes memory _callData, uint[8] memory _callOptions) public;
    function destroy () public;
}
