pragma solidity ^0.5.0;

import "../external/Owned.sol";
import "../external/IBancorGasPriceLimit.sol";
import "../Interfaces.sol";

contract SafetyMultiplierOracle is Owned, IUintFeed {

    uint public safetyMultiplier;

    function read () public view returns (uint) {
        return safetyMultiplier;
    }

    function changeFeed(uint _safetyMultiplier) public onlyOwner {
        safetyMultiplier = _safetyMultiplier;
    }

}
