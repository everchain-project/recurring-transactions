pragma solidity ^0.4.23;

import "../external/CloneFactory.sol";
import "../utility/AddressListFactory.sol";
import "../DelegatedWallet.sol";

contract DelegatedWalletFactory is CloneFactory {
    
    uint public blockCreated;

    AddressListFactory public ListFactory;
    DelegatedWallet public blueprint;

    constructor (DelegatedWallet _blueprint, AddressListFactory listFactory) public {
        blockCreated = block.number;
        ListFactory = listFactory;
        blueprint = _blueprint;
    }

    function createWallet (address owner, address[] delegateList) public returns (DelegatedWallet wallet) {
        AddressList delegates = ListFactory.createAddressList(owner, delegateList);
        wallet = DelegatedWallet(createClone(blueprint));
        wallet.initialize(delegates);
        
        emit CreateWallet_event(msg.sender, owner, wallet);
    }

    function createWallet (AddressList delegates) public returns (DelegatedWallet wallet) {
        wallet = DelegatedWallet(createClone(blueprint));
        wallet.initialize(delegates);
        
        emit CreateWallet_event(msg.sender, delegates.owner(), wallet);
    }
    
    event CreateWallet_event (address indexed caller, address indexed owner, address walletAddress);
    
}
