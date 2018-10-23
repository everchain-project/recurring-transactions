pragma solidity ^0.4.23;

contract ITokenReceiver {
    function () public payable;
}

contract ITokenSender {
    function transfer (address token, address recipient, uint amount) public returns (bool);
}

// implements a transfer function only callable by delegates
contract IDelegatedWallet is ITokenSender, ITokenReceiver {
    function isDelegate (address _address) public view returns (bool);
}

contract IPaymentDelegate {
    function execute () public returns (bool);
    function schedule (IPayment payment) public;
    function unschedule (IPayment payment) public;
    function unschedule() public;
}

contract ITask {
    address public factory;
    address public executor;
    function cancel() public;
}

contract IPayment is ITask {
    IPaymentDelegate public delegate;
    IDelegatedWallet public wallet;
    address public recipient;
    address public token;
    function amount () public view returns (uint);
}

contract IRecurringAlarmClock is IPayment {
    uint public currentInterval;
    uint public maximumIntervals;
    ITask public task;
}
