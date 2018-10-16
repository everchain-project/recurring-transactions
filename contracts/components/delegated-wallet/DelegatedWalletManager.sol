pragma solidity ^0.4.23;

import "../../components/delegated-wallet/DelegatedWalletFactory.sol";

contract DelegatedWalletManager {

    using ListLib for ListLib.AddressList;

    DelegatedWalletFactory public DefaultFactory;
    mapping (address => ListLib.AddressList) wallets;

    constructor (DelegatedWalletFactory defaultFactory) public {
        DefaultFactory = defaultFactory;
    }

    function addWallet (DelegatedWallet wallet) public returns (bool success) {
        success = wallets[msg.sender].add(wallet);
        if(success)
            emit AddWallet_event(msg.sender, wallet);
    }

    function addWallet (address[] delegates) public returns (bool success) {
        DelegatedWallet wallet = DefaultFactory.createWallet();
        for(uint i = 0; i < delegates.length; i++)
            wallet.addDelegate(delegates[i]);
        
        wallet.transferOwnership(msg.sender);
        success = wallets[msg.sender].add(wallet);
        if(success)
            emit AddWallet_event(msg.sender, wallet);
    }

    function removeWallet (DelegatedWallet wallet) public returns (bool success) {
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
    
    function contains (address account, DelegatedWallet wallet) public view returns (bool) {
        return wallets[account].contains(wallet);
    }

    function index (address account, uint i) public view returns (DelegatedWallet) {
        return DelegatedWallet(wallets[account].index(i));
    }

    function indexOf (address account, DelegatedWallet wallet) public view returns (uint) {
        return wallets[account].indexOf(wallet);
    }

    event AddWallet_event(address indexed owner, address wallet);
    event RemoveWallet_event(address indexed owner, address wallet);

}
