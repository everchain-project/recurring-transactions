pragma solidity ^0.4.23;

import "../../external/CloneFactory.sol";
import "./DelegatedWallet.sol";

/// @title DelegatedWalletFactory Contract
/// @author Joseph Reed
/// @dev The DelegatedWalletFactory makes it easy to deploy delegated wallet. It provides several
///      helper functions to deploy a wallet in several ways
contract DelegatedWalletFactory is CloneFactory {
    
    uint public blockCreated;           // The block the factory was deployed
    DelegatedWallet public blueprint;   // The delegated wallet blueprint to supply the clone factory

    /// @notice Constructor to create a DelegatedWalletFactory
    /// @param _blueprint The delegated wallet blueprint 
    constructor (DelegatedWallet _blueprint) public {
        blockCreated = block.number;    // The block number at the time of deployment
        
        blueprint = _blueprint;
    }

    /// @notice Creates a delegated wallet with the owner set to 'msg.sender' and no delegates
    /// @return The delegated wallet address
    function createWallet () public returns (DelegatedWallet wallet) {
        wallet = DelegatedWallet(createClone(blueprint));
        wallet.initialize(msg.sender);
        
        emit CreateWallet_event(msg.sender, msg.sender, wallet);
    }

    /// @notice Creates a delegated wallet with the owner set to 'owner' and no delegates
    /// @param owner The owner of the delegated wallet
    /// @return The delegated wallet address
    function createWallet (address owner) public returns (DelegatedWallet wallet) {
        wallet = DelegatedWallet(createClone(blueprint));
        wallet.initialize(owner);
        
        emit CreateWallet_event(msg.sender, owner, wallet);
    }

    /// @notice Creates a delegated wallet with the owner set to 'msg.sender' and predefined 'delegates'
    /// @param delegates The owner of the delegated wallet
    /// @return The delegated wallet address
    function createWallet (address[] delegates) public returns (DelegatedWallet wallet) {
        wallet = DelegatedWallet(createClone(blueprint));
        wallet.initialize(this);

        for(uint i = 0; i < delegates.length; i++)
            wallet.addDelegate(delegates[i]);
        
        wallet.transferOwnership(msg.sender);

        emit CreateWallet_event(msg.sender, msg.sender, wallet);
    }

    /// @notice Creates a delegated wallet with the owner set to 'owner' and predefined 'delegates'
    /// @param owner The owner of the delegated wallet
    /// @param delegates The owner of the delegated wallet
    /// @return The delegated wallet address
    function createWallet (address owner, address[] delegates) public returns (DelegatedWallet wallet) {
        wallet = DelegatedWallet(createClone(blueprint));
        wallet.initialize(this);

        for(uint i = 0; i < delegates.length; i++)
            wallet.addDelegate(delegates[i]);
        
        wallet.transferOwnership(owner);

        emit CreateWallet_event(msg.sender, owner, wallet);
    }
    
    event CreateWallet_event (address indexed caller, address indexed owner, address wallet);
    
}
