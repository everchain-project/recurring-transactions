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
    function schedule (IPayment payment) internal;
    function unschedule (IPayment payment) public;
    function unschedule() public;
    function register (address recipient) public returns (bool success);
    function unregister (address recipient) public returns (bool success);
    function clear (IPayment payment) public;
}

// A payment contains all the necesary details to execute a payment from a payment delegate
contract IPayment {
    IPaymentDelegate public delegate;
    IDelegatedWallet public wallet;
}

// A recurring alarm clock contains all the necesary details to execute a recurring task
contract IRecurringAlarmClock is IPayment {
    uint public currentInterval;
    uint public maximumIntervals;
    address public task;
    function start(
        address _task, 
        bytes memory _callData,
        uint _windowStart,
        uint _intervalValue, 
        uint _intervalUnit, 
        uint _maxIntervals
    ) public;
}

contract IRecurringAlarmClockFactory {
    function createAlarmClock(
        IDelegatedWallet wallet,
        IPaymentDelegate delegate,
        IGasPriceOracle gasPrice,
        address priorityCaller,
        uint[5] memory ethereumAlarmClockOptions
    ) public returns (IRecurringAlarmClock recurringAlarmClock);
}
