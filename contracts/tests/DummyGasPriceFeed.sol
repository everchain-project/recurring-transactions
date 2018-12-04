pragma solidity ^0.5.0;

import "../Interfaces.sol";

contract DummyGasPriceFeed is IUintFeed {

    function read() public view returns (uint gasPrice) {
        return tx.gasprice;
    }

}