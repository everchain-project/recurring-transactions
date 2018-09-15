pragma solidity ^0.4.23;

import "../../external/Owned.sol";
import "../../external/CloneFactory.sol";
import "../../libraries/ListLib.sol";
import "../../Interfaces.sol";
import "./DelegatedWallet.sol";
import "./DelegatedWalletFactory.sol";

contract DelegatedWalletManager is Owned {
    
    using ListLib for ListLib.AddressList;

    mapping (address => ListLib.AddressList) wallets;

    function createWallet (DelegatedWalletFactory factory, address[] delegateList) public returns (DelegatedWallet) {
        DelegatedWallet wallet = factory.createWallet(msg.sender, delegateList);
        wallets[msg.sender].add(wallet);
        
        return wallet;
    }

    function addWallet (DelegatedWallet wallet) public {
        wallets[msg.sender].add(wallet);
    }

    function removeWallet (DelegatedWallet wallet) public {
        wallets[msg.sender].remove(wallet);
    }

    function getWallets (address account) public view returns (address[]) {
        return wallets[account].array;
    }
    
}