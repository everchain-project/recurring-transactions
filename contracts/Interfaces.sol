pragma solidity ^0.4.23;

contract ITokenReceiver {
    function () public payable;
}

contract ITokenSender {
    function transfer (address token, address recipient, uint amount) public returns (bool);
}

contract IDelegated {
    function isDelegate (address _address) public view returns (bool);
}

contract IDelegatedWallet is IDelegated, ITokenSender, ITokenReceiver {
    // implements a transfer function only callable by delegates
}

contract IFuturePayment {
    IFuturePaymentDelegate public delegate;
    IDelegatedWallet public wallet;
    address public recipient;
    address public token;
    function amount () public view returns (uint);
    function cancel () public;
}

contract IFuturePaymentDelegate is ITokenSender {
    function schedule (IFuturePayment payment) public returns (bool);
    function unschedule (IFuturePayment payment) public returns (bool);
    function unschedule() public returns (bool);
}

// The recurring alarm clock can easily be updated to perform any customized
// task and does not have to follow this particular interface
contract IRecurringTask {
    function execute(uint currentInterval, uint maxIntervals) public returns (bool success);
    function cancel() public;
}

contract IRecurringAlarmClock is IFuturePayment {
    IRecurringTask public task;
}
