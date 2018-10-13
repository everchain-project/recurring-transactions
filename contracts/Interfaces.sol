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

contract ITask {
    function cancel() public;
}

contract IFuturePayment is ITask {
    IFuturePaymentDelegate public delegate;
    IDelegatedWallet public wallet;
    address public recipient;
    address public token;
    function amount () public view returns (uint);
}

contract IFuturePaymentDelegate {
    function execute () public returns (bool);
    function schedule (IFuturePayment payment) public;
    function unschedule (IFuturePayment payment) public;
    function unschedule() public;
}
