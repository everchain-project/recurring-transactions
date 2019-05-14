pragma solidity ^0.5.0;

import "../Interfaces.sol";

/// @notice Bancor Gas Price Limit interface
contract IBancorGasPriceLimit {
    function gasPrice() public view returns (uint256);
    function validateGasPrice(uint256) public view;
}

contract BancorGasPriceFeed is IUintFeed {

    IBancorGasPriceLimit public oracle;

    constructor (IBancorGasPriceLimit _oracle) public {
        oracle = _oracle;
    }

    function read() public view returns (uint) {
        return oracle.gasPrice();
    }

}
