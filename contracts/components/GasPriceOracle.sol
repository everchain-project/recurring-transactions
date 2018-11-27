pragma solidity ^0.5.0;

import "../external/Owned.sol";
import "../external/IBancorGasPriceLimit.sol";
import "../Interfaces.sol";

contract BancorGasPriceFeed is IUintFeed {

    IBancorGasPriceLimit public oracle;
    
    function read() public view returns (uint) {
        return oracle.gasPrice();
    }

}

contract GasPriceOracle is Owned, IUintFeed {

    IUintFeed public gasPrice;

    function read () public view returns (uint) {
        return gasPrice.read();
    }

    function changeFeed(IUintFeed newFeed) public {
        gasPrice = newFeed;
    }

}
