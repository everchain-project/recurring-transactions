pragma solidity ^0.4.23;

import "../external/CloneFactory.sol";
import "../utility/AddressListFactory.sol";
import "../DelegatedWallet.sol";

contract DelegatedWalletFactory is CloneFactory {
    
    uint public blockCreated;
    
    DelegatedWallet public blueprint;
    AddressListFactory public listFactory;
    
    constructor (DelegatedWallet _blueprint, AddressListFactory _listFactory) public {
        blockCreated = block.number;

        blueprint = _blueprint;
        listFactory = _listFactory;
    }
    
    function createWallet (address owner, address[] delegateList) public returns (DelegatedWallet wallet) {
        AddressList delegates = listFactory.createAddressList(owner, delegateList);
        wallet = DelegatedWallet(createClone(blueprint));
        wallet.initialize(owner, delegates);
        
        emit CreateWallet_event(msg.sender, owner, wallet);
    }
    
    event CreateWallet_event (
        address indexed caller, 
        address indexed owner, 
        address walletAddress
    );
    
}
