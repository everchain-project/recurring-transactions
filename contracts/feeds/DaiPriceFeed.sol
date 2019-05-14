pragma solidity ^0.5.0;

import "../Interfaces.sol";

contract DSValueInterface {
    function read() public view returns (bytes32);
}

contract DaiPriceFeed is IUintFeed {

    DSValueInterface public ethPerDai;

	function read() public view returns (uint) {
        return uint(ethPerDai.read());
    }

}
