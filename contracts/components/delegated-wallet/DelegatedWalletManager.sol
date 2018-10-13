pragma solidity ^0.4.23;

import "../../components/delegated-wallet/DelegatedWalletFactory.sol";

contract DelegatedWalletManager {

    using ListLib for ListLib.AddressList;

    DelegatedWalletFactory public DefaultFactory;
    mapping (address => ListLib.AddressList) wallets;

    constructor (DelegatedWalletFactory defaultFactory) public {
        DefaultFactory = defaultFactory;
    }

    function addWallet (IDelegatedWallet wallet) public returns (bool success) {
        success = wallets[msg.sender].add(wallet);
        if(success)
            emit AddWallet_event(msg.sender, wallet);
    }

    function addWallet (address[] delegates) public returns (bool success) {
        IDelegatedWallet wallet = DefaultFactory.createWallet(msg.sender, delegates);
        success = wallets[msg.sender].add(wallet);
        if(success)
            emit AddWallet_event(msg.sender, wallet);
    }

    function addWallet (DelegatedWalletFactory CustomFactory, address[] delegates) public returns (bool success) {
        IDelegatedWallet wallet = CustomFactory.createWallet(msg.sender, delegates);
        success = wallets[msg.sender].add(wallet);
        if(success)
            emit AddWallet_event(msg.sender, wallet);
    }

    function removeWallet (IDelegatedWallet wallet) public returns (bool success) {
        success = wallets[msg.sender].remove(wallet);
        if(success)
            emit RemoveWallet_event(msg.sender, wallet);
    }

    function getWallets (address account) public view returns (address[]) {
        return wallets[account].get();
    }
    
    function totalWallets (address account) public view returns (uint) {
        return wallets[account].getLength();
    }
    
    function contains (address account, IDelegatedWallet wallet) public view returns (bool) {
        return wallets[account].contains(wallet);
    }

    function index (address account, uint i) public view returns (IDelegatedWallet) {
        return IDelegatedWallet(wallets[account].index(i));
    }

    function indexOf (address account, IDelegatedWallet wallet) public view returns (uint) {
        return wallets[account].indexOf(wallet);
    }

    event AddWallet_event(address indexed owner, address wallet);
    event RemoveWallet_event(address indexed owner, address wallet);

}
