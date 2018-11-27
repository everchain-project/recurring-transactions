pragma solidity ^0.5.0;

/*
    Bancor Gas Price Limit interface
*/
contract IBancorGasPriceLimit {
    function gasPrice() public view returns (uint256);
    function validateGasPrice(uint256) public view;
}