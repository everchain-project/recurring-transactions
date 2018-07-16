pragma solidity ^0.4.23;

contract PriceFeed {
    function read() public view returns (uint);
}

contract DSValue {
    bool    has;
    bytes32 val;
    function peek () public constant returns (bytes32, bool);
    function read () public constant returns (bytes32);
    function poke (bytes32 wut) public;
    function void () public;
}

contract Eth_Usd is PriceFeed {
    
    DSValue USDperETH = DSValue(0xA944bd4b25C9F186A846fd5668941AA3d3B8425F);
    
    function read () public constant returns (uint) {
        return 1 ether * 1 ether / uint(USDperETH.read());
    }
    
}

contract Usd_Eth is PriceFeed {
    
    DSValue USDperETH = DSValue(0xA944bd4b25C9F186A846fd5668941AA3d3B8425F);
    
    function read () public constant returns (uint) {
        return uint(USDperETH.read());
    }
    
}