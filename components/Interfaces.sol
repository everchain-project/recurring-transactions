pragma solidity ^0.4.23;

import "import/Owned.sol";
import "import/EthereumAlarmClock.sol";
import "import/PriceFeed.sol";

contract IRecurringPayment is Owned {
    IAlarmClock public alarmClock;
    IDelegatedWallet public wallet;
    address public recipient;
    address public spendToken;
    function process () public returns (uint paymentAmount);
}

contract IDelegatedWallet is Owned {
    function transfer (address to, address token, uint amount) public returns (bool);
    function registerTrigger (address caller, address target, bytes4 callData) public;
    function addDelegate (address newDelegate) public;
    function removeDelegate (uint index) public;
    function isDelegate (address account) public view returns (bool);
}

contract IPriceOracle {
    function gasPrice (uint futureTimestamp) public view returns (uint);
}

contract IAlarmClock is Owned {
    SchedulerInterface public alarmScheduler;
    IPriceOracle public priceOracle;
    IDelegatedWallet public wallet;   // The wallet to call when the alarm goes off
    
    uint public windowStart; // The payment can be executed after the 'windowStart' timestamp
    uint public windowSize;  // The payment has 'windowSize' seconds to be executed or it fails
    uint public gas;         // The amount of gas to call the transaction with
    
    bytes4 public callData;
    
    function setNextAlarm () public payable returns (address);
    function getNextAlarmCost() public view returns (uint);
}

contract IPriceFeeds {
    function exists (address priceToken, address spendToken) public view returns (bool);
    function read (address priceToken, address spendToken) public view returns (uint price);
}
