pragma solidity ^0.4.23;

contract ITokenSender {
    function transfer (address token, address recipient, uint amount) public returns (bool);
}

contract IDelegatedWallet is ITokenSender {
    // implements a transfer function that can only be called by delegates
    function isDelegate (address) public view returns (bool);
    function getDelegates () public view returns (address[]);
    function totalDelegates () public view returns (uint);
    function addDelegate (address) public;
    function removeDelegate (address) public;
}

contract IFuturePaymentDelegate is ITokenSender {
    function register (IFuturePayment, IDelegatedWallet) public returns (bool);
    function unregister (IFuturePayment) public;
    function unregister () public;
}

contract ITask {
    function execute(bool) public returns (bool success);
}

contract IFuturePayment {
    IFuturePaymentDelegate delegate;
    address token;
    function amount () public view returns (uint);
}

contract IAlarmClock is IFuturePayment {
    ITask public task;
}
