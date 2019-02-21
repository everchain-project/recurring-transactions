pragma solidity ^0.5.0;

import "./external/Owned.sol";
import "./external/BokkyPooBahsDateTimeLibrary.sol";
import "./external/IBancorGasPriceLimit.sol";
import "./Interfaces.sol";

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
    
    uint public day     =   50000; //  5x
    uint public week    =   60000; //  6x
    uint public month   =   70000; //  7x
    uint public quarter =   80000; //  8x
    uint public year    =   90000; //  9x
    uint public beyond  =  100000; // 10x

    constructor (IUintFeed _gasPrice) public {
        gasPrice = _gasPrice;
    }

    function current () public view returns (uint) {
        return gasPrice.read();
    }

    function future (uint timestamp) public view returns (uint) {
        uint interval = BokkyPooBahsDateTimeLibrary.diffDays(now, timestamp);
        uint currentPrice = gasPrice.read();

        if(interval > 365)
            return currentPrice * beyond / 10000;
        else if(interval > 90)
            return currentPrice * year / 10000;
        else if (interval > 30)
            return currentPrice * quarter / 10000;
        else if (interval > 7)
            return currentPrice * month / 10000;
        else if (interval > 1)
            return currentPrice * week / 10000;
        else 
            return currentPrice * day / 10000;
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

    function setBeyondMultiplier(uint _multiplier) public onlyOwner {
        year = _multiplier;
    }

    function changeFeed(IUintFeed newFeed) public {
        gasPrice = newFeed;
    }

}
