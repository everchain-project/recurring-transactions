pragma solidity ^0.4.23;

import "import/Owned.sol";
import "import/EthereumAlarmClock.sol";

contract IAlarmClock is Owned {
    address public token;
    function setNextAlarm () public payable returns (address);
    function getNextAlarmCost() public view returns (uint);
}

contract IDelegatedWallet is Owned {
    function isDelegate (address account) public view returns (bool);
    function transfer (address token, address to, uint amount) public returns (bool);
    function approve (address token, address to, uint amount) public returns (bool);
    function addDelegate (address account) public;
    function removeDelegate (address account) public;
    function registerTrigger (address caller, address target, bytes4 callData) public;
}

contract IRecurringPayment is Owned {
    IAlarmClock public alarmClock;
    IDelegatedWallet public wallet;
    address public recipient;
    address public spendToken;
    function process () public returns (uint paymentAmount);
}

contract IRecurringPaymentScheduler {
    function schedule (IRecurringPayment payment) public returns (address alarm);
}

contract IPriceFeeds {
    function exists (address tokenA, address tokenB) public view returns (bool);
    function read (address tokenA, address tokenB) public view returns (uint price);
}
