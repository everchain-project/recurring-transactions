pragma solidity ^0.5.0;

import "../external/Owned.sol";
import "../Interfaces.sol";

contract DummyGasPriceFeed is IUintFeed {

	function read() public view returns (uint) {
        return tx.gasprice;
    }

}