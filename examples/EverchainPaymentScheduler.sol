pragma solidity ^0.4.23;

import "import/ERC20.sol";
import "import/LibList.sol";
import "PaymentScheduler.sol";
import "components/DelegatedWallet.sol";
import "components/AlarmClock.sol";
import "components/PriceFeeds.sol";

contract EverchainWalletManager is Owned {
    
    using LibList for LibList.AddressList;
    
    DelegatedWalletFactory public Factory = DelegatedWalletFactory(0x7020eC7CC2f2AEdAabDb9642fD4C6E86C384A661);
    
    mapping (address => LibList.AddressList) wallets;
    
    function createWallet (address[] delegates) public returns (address) {
        IDelegatedWallet wallet = Factory.createWallet();
        
        for(uint i = 0; i < delegates.length; i++)
            wallet.addDelegate(delegates[i]);
        
        wallet.transferOwnership(msg.sender);
        wallets[msg.sender].add(wallet);
        
        return wallet;
    }
    
    function getWallets (address account) public view returns (address[]) {
        return wallets[account].array;
    }
    
    function updateFactory (DelegatedWalletFactory newFactory) public onlyOwner {
        Factory = newFactory;
    }
    
}

contract EverchainPayment is IRecurringPayment {
    
    IAlarmClock public alarmClock;
    IPriceFeeds public priceFeeds;
    IDelegatedWallet public wallet;
    address public recipient;
    address public spendToken;
    address public priceToken;
    address public gainsToken;
    
    bool public usePrincipal;
    bool public usePercent;
    bool public useGains;
    bool public setup;
    
    uint public valueA;
    uint public valueB;
    
    function init (
        IAlarmClock _alarmClock,
        IDelegatedWallet _wallet,
        address _recipient,
        address[4] addresses,
        bool[3] bools,
        uint[2] uints
    ) public {
        require(wallet == address(0x0));
        
        alarmClock = _alarmClock;
        wallet = _wallet;
        recipient = _recipient;
        
        spendToken = addresses[0];
        priceToken = addresses[1];
        gainsToken = addresses[2];
        priceFeeds = IPriceFeeds(addresses[3]);
        
        usePrincipal = bools[0];
        usePercent = bools[1];
        useGains = bools[2];
        
        valueA = uints[0];
        valueB = uints[1];
        
        setup =  !useGains || (useGains && valueB != 0);
    }
    
    function process () public onlyOwner returns (uint paymentAmount) {
        uint spendTokenBalance = balanceOf(spendToken);
        if(useGains) {
            if(setup) {
                if(!usePercent){
                    if(spendToken != gainsToken){
                        uint priceTokenValue = convert(spendTokenBalance, spendToken, priceToken);
                        uint paymentInGainsToken = calculatePaymentAmount(priceTokenValue);
                        paymentAmount = convert(paymentInGainsToken, priceToken, spendToken);
                    } else {
                        if(spendTokenBalance > valueB)
                            paymentAmount = calculatePaymentAmount(spendTokenBalance);
                    }
                }
            } else {
                setup = true;
            }
            
            valueB = updateGainsValue(spendTokenBalance);
        } else {
            paymentAmount = calculatePaymentAmount(spendTokenBalance);
        }
    }
    
    function balanceOf (address token) public view returns (uint currentBalance) {
        if(token == address(0x0))
            currentBalance = address(wallet).balance;
        else
            currentBalance = ERC20(token).balanceOf(wallet);
    }
    
    function calculatePaymentAmount (uint currentValue) public view returns (uint paymentAmount) {
        uint baseAmount;
        if(useGains){
            uint previousValue = valueB;
            if(currentValue > previousValue)
                baseAmount = currentValue - previousValue;
        } else {
            baseAmount = currentValue;
        }
        
        if(usePercent){
            uint percent = valueA;
            paymentAmount = baseAmount * percent / 1 ether;
        } else {
            if(baseAmount >= valueA)
                paymentAmount = valueA;
        }
    }
    
    function updateGainsValue (uint dunno) public pure returns (uint currentBalance) {
        dunno;
        return 0;
    }
    
    function convert (
        uint baseAmount,
        address baseToken, 
        address convertToken
    ) public view returns (uint convertTokenAmount) {
        convertTokenAmount = baseAmount * uint(priceFeeds.read(convertToken, baseToken)) / 1 ether;
    }
    
}

contract EverchainPaymentScheduler {
    
    using PaymentSchedulerLib for IPaymentScheduler;
    
    IPaymentScheduler public paymentScheduler = IPaymentScheduler(0x6C21887FFCDDC1bE5Bad4E3686cBE32Fa98Ef3A2);
    SchedulerInterface public ethereumAlarmClock = SchedulerInterface(0x31bBbf5180f2bD9C213e2E1D91a439677243268A);
    IPriceOracle public priceOracle = IPriceOracle(0x0);
    
    function schedule (
        uint[6] alarmOptions,
        IDelegatedWallet wallet,
        address recipient,
        address[4] addresses,
        bool[3] options,
        uint[2] values
    ) public returns (uint) {
        AlarmClock alarmClock = new AlarmClock();
        alarmClock.init(ethereumAlarmClock, priceOracle, wallet, alarmOptions, "");
        alarmClock.transferOwnership(paymentScheduler);
        
        EverchainPayment payment = new EverchainPayment();
        payment.init(alarmClock, wallet, recipient, addresses, options, values);
        payment.transferOwnership(paymentScheduler);
        
        paymentScheduler.create(payment);
    }
    
}
