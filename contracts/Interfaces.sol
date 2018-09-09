pragma solidity ^0.4.23;

contract ITokenSender {
    function transfer (address token, address recipient, uint amount) public returns (bool);
}

contract IDelegated {
    function isDelegate (address) public view returns (bool);
    function getDelegates () public view returns (address[]);
    function totalDelegates () public view returns (uint);
    function addDelegate (address) public;
    function removeDelegate (address) public;
}

contract IDelegatedWallet is IDelegated, ITokenSender {
    ITokenSender public tokenCore;
}

contract ITask {
    function execute() public returns (bool success);
}

contract IFuturePayment is ITask {
    IFuturePaymentDelegate public delegate; // The delegate that pulls the funds from the wallet
    IDelegatedWallet public wallet;         // The wallet that funds each alarm deposit
    address public token;                   // The token to pull from the delegated wallet
}

contract IFuturePaymentDelegate is ITokenSender {
    function register (IFuturePayment) public returns(bool);
    function unregister (IFuturePayment) public;
    function unregister () public;
}

contract IRecurringAlarmClock is IFuturePayment {
    ITask public task;  // The task to execute when the alarm is triggered
}
