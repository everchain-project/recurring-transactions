pragma solidity ^0.4.23;

// A cancellable contract can be cancelled
contract ICancellable {
    function cancel() public;
}

// A token receiver has a payable default function that can accept ether
contract ITokenReceiver {
    function () public payable;
}

// A token sender can transfer any specified ERC20 token or ether out of the contract
contract ITokenSender {
    function transfer (address token, address recipient, uint amount) public returns (bool);
}

// A delegated wallet implements a transfer function only callable by select delegates
contract IDelegatedWallet is ITokenSender, ITokenReceiver {
    function isDelegate (address _address) public view returns (bool);
}

// A blueprint contract always has a factory to identify the behavior of the contract
contract IBlueprint {
    address public factory;
}

// A payment delegate lets scheduled payments withdraw tokens from the corrosponding wallet
contract IPaymentDelegate is IBlueprint {
    function execute () public returns (bool);
    function schedule (IPayment payment) public;
    function unschedule (IPayment payment) public;
    function unschedule() public;
}

// A payment contains all the necesary details to execute a payment from a payment delegate
contract IPayment is IBlueprint {
    address public executor;
    IPaymentDelegate public delegate;
    IDelegatedWallet public wallet;
    address public recipient;
    address public token;
    function amount () public view returns (uint);
}

// A recurring alarm clock contains all the necesary details to execute a recurring task
contract IRecurringAlarmClock is IPayment {
    uint public currentInterval;
    uint public maximumIntervals;
    address public task;
}
