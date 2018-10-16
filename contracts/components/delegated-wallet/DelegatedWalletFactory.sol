pragma solidity ^0.4.23;

import "../../external/CloneFactory.sol";
import "./DelegatedWallet.sol";

contract DelegatedWalletFactory is CloneFactory {
    
    uint public blockCreated;

    DelegatedWallet public blueprint;

    constructor (DelegatedWallet _blueprint) public {
        blockCreated = block.number;
        blueprint = _blueprint;
    }

    function createWallet () public returns (DelegatedWallet wallet) {
        wallet = DelegatedWallet(createClone(blueprint));
        wallet.initialize(msg.sender);
        
        emit CreateWallet_event(msg.sender, msg.sender, wallet);
    }
    
    event CreateWallet_event (address indexed caller, address indexed owner, address wallet);
    
}
