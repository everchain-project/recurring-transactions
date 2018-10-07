pragma solidity ^0.4.23;

import "../utility/AddressListFactory.sol";
import "../utility/DelegatedWalletFactory.sol";
import "../utility/FuturePaymentDelegateFactory.sol";
import "./RecurringPaymentScheduler.sol";

contract EverchainWalletManager is Owned {

    string public version = "everchain_0.1.0";
    
    AddressListFactory public ListFactory;
    DelegatedWalletFactory public WalletFactory;
    FuturePaymentDelegateFactory public PaymentDelegateFactory;
    RecurringPaymentScheduler public PaymentScheduler;

    mapping (address => AddressList) public wallets;

    constructor (
        AddressListFactory listFactory,
        DelegatedWalletFactory walletFactory,
        FuturePaymentDelegateFactory paymentDelegateFactory,
        RecurringPaymentScheduler paymentScheduler
    ) public {
        ListFactory = listFactory;
        WalletFactory = walletFactory;
        PaymentDelegateFactory = paymentDelegateFactory;
        PaymentScheduler = paymentScheduler;
    }

    function createWallet () public returns (DelegatedWallet wallet) {
        address[] memory trustedSchedulers = new address[](1);
        trustedSchedulers[0] = PaymentScheduler;
        FuturePaymentDelegate paymentDelegate = PaymentDelegateFactory.createDelegate(msg.sender, trustedSchedulers);
        address[] memory delegateList = new address[](2);
        delegateList[0] = msg.sender;
        delegateList[1] = paymentDelegate;
        AddressList delegates = ListFactory.createAddressList(msg.sender, delegateList);
        return createWallet_internal(delegates);
    }

    function createWallet (address[] delegateList) public returns (DelegatedWallet wallet) {
        AddressList delegates = ListFactory.createAddressList(msg.sender, delegateList);
        return createWallet_internal(delegates);
    }

    function createWallet (AddressList delegates) public returns (DelegatedWallet) {
        return createWallet_internal(delegates);
    }

    function addWallet (DelegatedWallet wallet) public returns (bool success) {
        success = addWallet_internal(wallet);
    }

    function removeWallet (DelegatedWallet wallet) public returns (bool success) {
        success = wallets[msg.sender].remove(wallet);
        if(success)
            emit RemoveWallet_event(msg.sender, wallet);
    }
    
    function addWallet_internal (address wallet) internal returns (bool success) {
        bool walletListAlreadyCreated = wallets[msg.sender] == address(0x0);
        if(walletListAlreadyCreated){
            address[] memory walletList = new address[](1);
            walletList[0] = wallet;
            wallets[msg.sender] = ListFactory.createAddressList(this, walletList);
            success = true;
        } else {
            success = wallets[msg.sender].add(wallet);
        }

        if(success)
            emit AddWallet_event(msg.sender, wallet);
    }

    function createWallet_internal (AddressList delegates) internal returns (DelegatedWallet wallet) {
        wallet = WalletFactory.createWallet(delegates);
        require(addWallet_internal(wallet));

        emit CreateWallet_event(msg.sender, wallet);
    }

    event AddWallet_event(address indexed owner, address walletAddress);
    event RemoveWallet_event(address indexed owner, address walletAddress);
    event CreateWallet_event (address indexed owner, address walletAddress);
}
