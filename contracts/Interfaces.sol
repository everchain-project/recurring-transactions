pragma solidity ^0.4.23;

contract ITokenSender {
    function transfer (address token, address recipient, uint amount) public returns (bool);
}

contract IDelegates {
    function getDelegates () public view returns (address[]);
    function totalDelegates () public view returns (uint);
    function isDelegate (address account) public view returns (bool);
    function addDelegate (address account) public;
    function removeDelegate (address account) public;
}

contract IDelegatedWallet is ITokenSender {
    IDelegates public delegates;
    ITokenSender public tokenCore;
    function isDelegate (address account) public view returns (bool);
}

contract IPaymentDelegate is ITokenSender {
    function register (IFuturePayment) public returns(bool);
    function unregister (IFuturePayment) public;
    function unregister () public;
}

contract IFuturePayment {
    IPaymentDelegate public scheduler;  // The delegate that pulls the funds from the wallet
    IDelegatedWallet public wallet;     // The wallet that funds each alarm deposit
    address public token;
}

contract ITask {
    function execute() public returns (bool success);
}

contract IAlarmClock is IFuturePayment {
    ITask public task;  // The task to execute when the alarm is triggered
}