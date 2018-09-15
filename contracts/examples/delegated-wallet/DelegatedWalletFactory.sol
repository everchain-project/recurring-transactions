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
    
    function createWallet (address owner, address[] delegateList) public returns (DelegatedWallet) {
        DelegatedWallet wallet = DelegatedWallet(createClone(blueprint));
        wallet.initialize();
        
        for(uint i = 0; i < delegateList.length; i++)
            wallet.addDelegate(delegateList[i]);
        
        wallet.transferOwnership(owner);
        
        emit NewWallet_event(owner, wallet);

        return wallet;
    }
    
    event NewWallet_event (address indexed owner, address walletAddress);
    
}
