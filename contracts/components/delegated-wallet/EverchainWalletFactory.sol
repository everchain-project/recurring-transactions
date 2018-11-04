pragma solidity ^0.4.23;

import "./DelegatedWalletFactory.sol";

/// @title EverchainWalletFactory Contract
/// @author Joseph Reed
/// @dev The EverchainWalletFactory makes it easy to deploy delegated wallet with prepackaged delegates.
contract EverchainWalletFactory {
    
    uint public blockCreated;           // The block the factory was deployed
    DelegatedWalletFactory public DefaultFactory;   // The delegated wallet blueprint to supply the clone factory

    /*
    /// @notice Constructor to create a DelegatedWalletFactory
    /// @param _blueprint The delegated wallet blueprint 
    constructor (DelegatedWalletFactory _DefaultFactory) public {
        blockCreated = block.number;    // The block number at the time of deployment
        
        DefaultFactory = _DefaultFactory;
    }

    function createWallet (DelegatedWalletFactory CustomFactory) public returns (DelegatedWallet wallet) {
        DelegatedWalletFactory WalletFactory;
        if(CustomFactory != address(0x0))
            WalletFactory = CustomFactory;
        else
            WalletFactory = DefaultFactory;

        wallet = WalletFactory.create

        emit CreateWallet_event(msg.sender, msg.sender, wallet);
    }
    */

    event CreateWallet_event (address indexed caller, address indexed owner, address wallet);
    
}
