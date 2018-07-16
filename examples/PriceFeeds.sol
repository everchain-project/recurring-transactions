pragma solidity ^0.4.23;

import "PaymentScheduler.sol";

contract PriceFeeds is IPriceFeeds, Owned {
    
    mapping (address => mapping (address => PriceFeed)) public priceFeeds;
    
    function exists (address priceToken, address spendToken) public view returns (bool) {
        return (priceFeeds[priceToken][spendToken] == address(0x0));    
    }
    
    function read (address priceToken, address spendToken) public view returns (uint price) {
        return uint(priceFeeds[priceToken][spendToken].read());
    }
    
    function updatePriceFeed (address tokenA, address tokenB, address priceFeed) public onlyOwner {
        priceFeeds[tokenA][tokenB] = PriceFeed(priceFeed);
    }
    
}