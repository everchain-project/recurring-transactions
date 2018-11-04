pragma solidity ^0.4.23;

import "./DelegatedWalletFactory.sol";

/// @title DelegatedWalletManager Contract
/// @author Joseph Reed
/// @dev This contract's goal is to make it easy for anyone to manage existing and new delagated wallets
contract DelegatedWalletManager {

    using ListLib for ListLib.AddressList;              // Import the data structure AddressList from the ListLib contract

    uint public blockCreated;                           // The block the factory was deployed
    DelegatedWalletFactory public DefaultFactory;       // The default factory when creating a wallet if a custom factory is not supplied
    mapping (address => ListLib.AddressList) wallets;   // The list of wallets added by each account

    /// @notice Constructor to create a DelegatedWalletManager
    /// @param defaultFactory The defeault factory when creating a wallet
    constructor (DelegatedWalletFactory defaultFactory) public {
        blockCreated = block.number;
        DefaultFactory = defaultFactory;
    }

    /// @notice Adds a wallet to the account list.
    /// @param wallet The delegated wallet to add to the account list
    /// @return True if the wallet was successfully added
    function addWallet (DelegatedWallet wallet) public returns (bool success) {
        success = wallets[msg.sender].add(wallet);
        if(success)
            emit AddWallet_event(msg.sender, wallet);
    }

    /// @notice Adds a wallet to the account list.
    /// @param customFactory If not '0x0', deploys a new delegated wallet from 'customFactory'
    /// @param delegates A list of predefined delegates to add to the wallet
    /// @return True if the wallet was successfully created
    function createWallet (DelegatedWalletFactory customFactory, address[] delegates) public returns (bool success) {
        DelegatedWalletFactory Factory;
        if(customFactory == address(0x0))
            Factory = DefaultFactory;
        else
            Factory = customFactory;
            
        DelegatedWallet wallet = Factory.createWallet(msg.sender, delegates);
        if(wallet != address(0x0))
            success = wallets[msg.sender].add(wallet);

        if(success)
            emit AddWallet_event(msg.sender, wallet);
    }

    /// @notice Removes a wallet from the account list.
    /// @param wallet The delegated wallet to remove from the account list
    /// @return True if the wallet was successfully removed
    function removeWallet (DelegatedWallet wallet) public returns (bool success) {
        success = wallets[msg.sender].remove(wallet);
        if(success)
            emit RemoveWallet_event(msg.sender, wallet);
    }

    /// @notice Fetches a wallet list from a given account.
    /// @param account The given account from which to fetch the wallet list
    /// @return an address array of wallets owned by 'account'
    function getWallets (address account) public view returns (address[]) {
        return wallets[account].get();
    }
    
    /// @notice Fetches a how many wallets are in the list from a given account.
    /// @param account The given account from which to fetch the wallet list
    /// @return the total number of wallets
    function totalWallets (address account) public view returns (uint) {
        return wallets[account].getLength();
    }
    
    /// @notice Shows if a wallet exists in the wallet list from a given account.
    /// @param account The given account to check
    /// @param wallet The given wallet to check for
    /// @return True if the given wallet exists an accounts wallet list
    function contains (address account, DelegatedWallet wallet) public view returns (bool) {
        return wallets[account].contains(wallet);
    }

    /// @notice Fetches the wallet at index 'i' from the 'account' wallet list
    /// @param i The index to check
    /// @return The wallet address that exists at index 'i' in the 'account' wallet list
    function index (address account, uint i) public view returns (DelegatedWallet) {
        return DelegatedWallet(wallets[account].index(i));
    }

    /// @notice Fetches the index of a given 'wallet' from a given 'account' wallet list
    /// @param account The given account to check
    /// @param wallet The given wallet to check
    /// @return The current index of 'wallet' in 'account' wallet list
    function indexOf (address account, DelegatedWallet wallet) public view returns (uint) {
        return wallets[account].indexOf(wallet);
    }

    event AddWallet_event(address indexed owner, address wallet);
    event RemoveWallet_event(address indexed owner, address wallet);

}
