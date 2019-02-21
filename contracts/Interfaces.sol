pragma solidity ^0.5.0;

import "./external/RequestFactoryInterface.sol";
import "./external/IDelegatedWallet.sol";

contract IUintFeed {
    function read() public view returns (uint);
}

contract IGasPriceOracle {
    function current() public view returns (uint);
    function future(uint timestamp) public view returns (uint);
}

// A cancellable contract can be cancelled
contract ICancellable {
    function cancel() public;
}

// A payment delegate lets scheduled payments withdraw tokens from the corrosponding wallet
contract IPaymentDelegate {
    function transfer (address token, address payable recipient, uint amount) public returns (bool);
    function schedule (IPayment payment) public returns (bool success);
    function unschedule (IPayment payment) public returns (bool success);
    function unschedule() public returns (bool success);
    function register (address recipient) public returns (bool success);
    function unregister (address recipient) public returns (bool success);
    function clear (IPayment payment) public returns (bool success);
    function valid (IPayment payment) internal returns (bool);
}

// A payment contains all the necesary details to execute a payment from a payment delegate
contract IPayment {
    address public factory;
    IPaymentDelegate public delegate;
    IDelegatedWallet public wallet;
}

// A recurring alarm clock contains all the necesary details to execute a recurring task
contract IRecurringTransaction is IPayment {
    IGasPriceOracle public gasPrice;
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
    function start (address payable _callAddress, bytes memory _callData, uint[7] memory _callOptions) public;
    function destroy () public;
    function setPriorityCaller (address _priorityCaller) public;
    function setExecutionLimits (uint[3] memory _limits) public;
    function setGasPriceOracle (IGasPriceOracle _oracle) public;
}
