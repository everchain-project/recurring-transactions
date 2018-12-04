pragma solidity ^0.5.0;

import "../external/Owned.sol";
import "../external/BokkyPooBahsDateTimeLibrary.sol";
import "../external/IBancorGasPriceLimit.sol";
import "../Interfaces.sol";

contract BancorGasPriceFeed is IUintFeed {

    IBancorGasPriceLimit public oracle;

    constructor (IBancorGasPriceLimit _oracle) public {
        oracle = _oracle;
    }
    
    function read() public view returns (uint) {
        return oracle.gasPrice();
    }

}

contract GasPriceOracle is Owned, IGasPriceOracle {

    IUintFeed public gasPrice;

    // 10000 == 100% 
    // 100 == 1%
    // 1 == 0.01%

    uint public day = 20000;
    uint public week = 300000;
    uint public month = 500000;
    uint public quarter = 100000;
    uint public year = 150000;
    uint public beyond = 200000;

    constructor (IUintFeed _gasPrice) public {
        gasPrice = _gasPrice;
    }

    function current () public view returns (uint) {
        return gasPrice.read();
    }

    function future (uint timestamp) public view returns (uint) {
        uint interval = BokkyPooBahsDateTimeLibrary.diffDays(now, timestamp);
        uint currentPrice = current();

        if(interval > 365)
            return currentPrice * beyond / 10000;
        if(interval > 90)
            return currentPrice * year / 10000;
        else if (interval > 30)
            return currentPrice * quarter / 10000;
        else if (interval > 7)
            return currentPrice * month / 10000;
        else if (interval > 1)
            return currentPrice * week / 10000;
        else if (interval > 0)
            return currentPrice * day / 10000;
        else
            return currentPrice;
    }

    function setDayMultiplier(uint _multiplier) public onlyOwner {
        day = _multiplier;
    }

    function setWeekMultiplier(uint _multiplier) public onlyOwner {
        week = _multiplier;
    }

    function setMonthMultiplier(uint _multiplier) public onlyOwner {
        month = _multiplier;
    }

    function setQuarterMultiplier(uint _multiplier) public onlyOwner {
        quarter = _multiplier;
    }

    function setYearMultiplier(uint _multiplier) public onlyOwner {
        year = _multiplier;
    }

    function changeFeed(IUintFeed newFeed) public {
        gasPrice = newFeed;
    }

}
