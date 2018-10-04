pragma solidity ^0.4.23;

import "../../utility/AddressListFactory.sol";
import "./DelegatedWalletFactory.sol";

contract DelegatedWalletManager is Owned {
    
    AddressListFactory public listFactory;
    DelegatedWalletFactory public walletFactory;

    mapping (address => AddressList) public wallets;

    constructor (
        AddressListFactory _listFactory,
        DelegatedWalletFactory _walletFactory
    ) public {
        listFactory = _listFactory;
        walletFactory = _walletFactory;
    }

    function createWallet (DelegatedWalletFactory factory, address[] delegateList) public returns (bool success) {
        address[] memory emptyList;
        if(wallets[msg.sender] == address(0x0))
            wallets[msg.sender] = listFactory.createAddressList(this, emptyList);

        DelegatedWallet wallet = factory.createWallet(msg.sender, delegateList);
        return wallets[msg.sender].add(wallet);
    }

    function addWallet (DelegatedWallet wallet) public returns (bool success) {
        return wallets[msg.sender].add(wallet);
    }

    function removeWallet (DelegatedWallet wallet) public returns (bool success) {
        return wallets[msg.sender].remove(wallet);
    }
    
}
