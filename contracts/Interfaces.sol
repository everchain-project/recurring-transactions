pragma solidity ^0.5.0;

import "./external/RequestFactoryInterface.sol";
import "./external/IDelegatedWallet.sol";

contract IUintFeed {
    function read() public view returns (uint);
}

// A cancellable contract can be cancelled
contract ICancellable {
    function cancel() public;
}

// A payment delegate lets scheduled payments withdraw tokens from the corrosponding wallet
contract IPaymentDelegate {
    function execute () public returns (bool);
    function schedule (IPayment payment) public;
    function unschedule (IPayment payment) public;
    function unschedule() public;
}

// A payment contains all the necesary details to execute a payment from a payment delegate
contract IPayment {
    IPaymentDelegate public delegate;
    IDelegatedWallet public wallet;
    address payable public recipient;
    address public token;
    function amount () public view returns (uint);
}

// A recurring alarm clock contains all the necesary details to execute a recurring task
contract IRecurringAlarmClock is IPayment {
    uint public currentInterval;
    uint public maximumIntervals;
    address public task;
}
