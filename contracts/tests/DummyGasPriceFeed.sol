pragma solidity ^0.5.0;

import "../external/Owned.sol";
import "../Interfaces.sol";

contract DummyGasPriceFeed is Owned, IUintFeed {

	uint public gasPrice = 1000000000;

    function read() public view returns (uint) {
        return gasPrice;
    }

    function set(uint newGasPrice) public onlyOwner {
    	gasPrice = newGasPrice;
    }

}