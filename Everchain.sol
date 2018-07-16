pragma solidity ^0.4.23;

import "import/Owned.sol";
import "import/ERC20.sol";
import "import/LibList.sol";
import "Interfaces.sol";

contract PriceOracle is IPriceOracle, Owned {
    
    uint public GAS_PRICE       =  3000000000;
    uint public ALARM_FEE       = 20000000000;
    uint public PROTOCOL_FEE    = 20000000000;
    uint public CLAIM_DEPOSIT   = 20000000000;
    
    function gasPrice (uint futureTimestamp) public view returns (uint) {
        futureTimestamp;
        
        // Although 'futureTimestamp' is not used here, in the future it may be
        // possible to reliably predict costs at a future timestamp
        
        return GAS_PRICE / 1 ether;
    }
    
    function alarmFee (uint futureTimestamp) public view returns (uint) {
        futureTimestamp;
        
        // Although 'futureTimestamp' is not used here, in the future it may be
        // possible to reliably predict costs at a future timestamp
        
        return ALARM_FEE;
    }
    
    function protocolFee (uint futureTimestamp) public view returns (uint) {
        futureTimestamp;
        
        // Although 'futureTimestamp' is not used here, in the future it may be
        // possible to reliably predict costs at a future timestamp
        
        return PROTOCOL_FEE;
    }
    
    function claimDeposit (uint futureTimestamp) public view returns (uint) {
        futureTimestamp;
        
        // Although 'futureTimestamp' is not used here, in the future it may be
        // possible to reliably predict costs at a future timestamp
        
        return CLAIM_DEPOSIT;
    }
    
    function updateOptions (uint[4] options) public onlyOwner {
        GAS_PRICE = options[0];
        ALARM_FEE = options[1];
        PROTOCOL_FEE = options[2];
        CLAIM_DEPOSIT = options[3];
    }
    
}

contract PriceFeeds is IPriceFeeds, Owned {
    
    mapping (address => mapping (address => PriceFeed)) public priceFeeds;
    
    function exists (address priceToken, address spendToken) public view returns (bool) {
        return (priceFeeds[priceToken][spendToken] == address(0x0));    
    }
    
    function read (address priceToken, address spendToken) public view returns (uint price) {
        return uint(priceFeeds[priceToken][spendToken].read());
    }
    
    function updatePriceFeed (address tokenA, address tokenB, address priceFeed) public onlyOwner {
        priceFeeds[tokenA][tokenB] = PriceFeed(priceFeed);
    }
    
}

contract AlarmClock is IAlarmClock {
    
    SchedulerInterface public alarmScheduler;
    IPriceOracle public priceOracle;
    IDelegatedWallet public target;
    
    uint public windowStart;        // The payment can be executed after the 'windowStart' timestamp
    uint public windowSize;         // The payment has 'windowSize' seconds to be executed or it fails
    uint public intervalSize;       // The number of seconds in between payments
    uint public maximumIntervals;   // The number of recurring payments to make
    uint public currentInterval;    // The current interval this payment is on
    uint public gas;                // The amount of gas to call the transaction with
    
    bytes4 public callData;
    
    function init (IDelegatedWallet _target, uint[6] options) public {
        require(target == address(0x0));
        
        target = _target;
        windowStart = options[0];
        windowSize = options[1];
        intervalSize = options[2];
        maximumIntervals = options[3];
        currentInterval = options[4];
        gas = options[5];
    }
    
    function setNextAlarm () public payable onlyOwner returns (address) {
        if(currentInterval < maximumIntervals) {
            if(currentInterval > 0)
                windowStart = windowStart + intervalSize;
        }
        
        currentInterval++;
        
        return alarmScheduler.schedule.value(msg.value)(
            target,            // toAddress
            "",                // callData
            [
                gas,           // The amount of gas to be sent with the transaction.
                0,             // The amount of wei to be sent.
                windowSize,    // The size of the execution window.
                windowStart,   // The start of the execution window.
                priceOracle.gasPrice(windowStart),        // The gasprice for the transaction
                priceOracle.protocolFee(windowStart),     // A fee that goes to maintaining and upgrading the EAC protocol
                priceOracle.alarmFee(windowStart),        // The payment for the claimer that triggers this alarm.
                priceOracle.claimDeposit(windowStart)     // The required amount of wei the claimer must send as deposit.
            ]
        );
    }
    
    function getNextAlarmCost() public view returns (uint) {
        return alarmScheduler.computeEndowment(
            priceOracle.alarmFee(windowStart + intervalSize), 
            priceOracle.protocolFee(windowStart + intervalSize),
            gas,
            0, 
            priceOracle.gasPrice(windowStart + intervalSize)
        );
    }
    
}

contract SimplePayment is IRecurringPayment {
    
    IAlarmClock public alarmClock;
    IDelegatedWallet public wallet;
    address public recipient;
    address public spendToken;
    uint public amount;
    
    function init (
        IAlarmClock _alarmClock,
        IDelegatedWallet _wallet,
        address _recipient,
        address _spendToken, 
        uint _amount
    ) public {
        alarmClock = _alarmClock;
        wallet = _wallet;
        recipient = _recipient;
        spendToken = _spendToken;
        amount = _amount;
    }
    
    function process () public onlyOwner returns (uint paymentAmount) {
        return amount;
    }
    
}

contract ComplexPayment is IRecurringPayment {
    
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
        IDelegatedWallet _wallet,
        address[4] addresses,
        bool[3] bools,
        uint[2] uints
    ) public {
        require(wallet == address(0x0));
        
        wallet = _wallet;
        
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
    
    function processPayment () public onlyOwner returns (uint paymentAmount) {
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
    
    /*
    function calculateCurrentBalanceIn (address token) public view returns (uint) {
        uint currentSpendBalance;
        if(spendToken == address(0x0))
            currentSpendBalance = wallet.balance;
        else
            currentSpendBalance = ERC20(spendToken).balanceOf(wallet);
        
        if(spendToken != priceToken){
            require(priceFeeds.exists(priceToken, spendToken));
            
            return currentSpendBalance * uint(priceFeeds.read(priceToken, spendToken)) / 1 ether;
        }
        
        return currentSpendBalance;
    }
    
    function calculatePaymentAmount (uint spendBalance) public view returns (uint tokenAmount) {
        uint currentBalance = balanceOf();
        uint baseAmount;
        if(useGains){
            uint previousBalance = valueB;
            if(currentBalance > previousBalance)
                baseAmount = currentBalance - previousBalance;
        } else {
            baseAmount = currentBalance;
        }
        
        if(usePercent){ // use percent
            uint percent = valueA;
            tokenAmount = baseAmount * percent / 1 ether;
        } else { // use static amount
            if(baseAmount >= valueA) // In this case, valueA is a static amount of tokens
                tokenAmount = valueA;
        }
    }
    */
}

library PaymentSchedulerLib {
    function create(IPaymentScheduler scheduler, IRecurringPayment payment) public {
        scheduler.schedule(payment);
    }
}

contract SimplePaymentScheduler {
    
    using PaymentSchedulerLib for IPaymentScheduler;
    
    SchedulerInterface public EthereumAlarmClock = SchedulerInterface(0x31bBbf5180f2bD9C213e2E1D91a439677243268A);
    IPriceOracle public priceOracle = new PriceOracle();
    IPaymentScheduler public paymentScheduler = IPaymentScheduler(0x0);
    
    function scheduleSimplePayment (
        uint[6] alarmOptions,
        IDelegatedWallet wallet,
        address recipient,
        address spendToken,
        uint amount
    ) public {
        AlarmClock alarmClock = new AlarmClock();
        alarmClock.init(wallet, alarmOptions);
        alarmClock.transferOwnership(paymentScheduler);
        
        SimplePayment payment = new SimplePayment();
        payment.init(alarmClock, wallet, recipient, spendToken, amount);
        payment.transferOwnership(paymentScheduler);
        
        paymentScheduler.create(payment);
    }
    
    /*
    function recurringSchedule (
        IDelegatedWallet wallet,
        address recipient,
        uint[6] alarmOptions,
        address[4] addresses,
        bool[3] options,
        uint[2] values
    ) public returns (uint) {
        AlarmClock alarmClock = new AlarmClock();
        alarmClock.init(wallet, alarmOptions);
        alarmClock.transferOwnership(paymentScheduler);
        
        ComplexPayment payment = new ComplexPayment();
        payment.init(wallet, addresses, options, values);
        payment.transferOwnership(paymentScheduler);
        
        return paymentScheduler.createPayment(payment);
    }
    */
    
}

contract EverchainWalletManager {
    
    using LibList for LibList.AddressList;
    
    mapping (address => LibList.AddressList) wallets;
    
    function createWallet (
        IDelegatedWalletFactory Factory, 
        address[] delegates
    ) public returns (address walletAddress) {
        IDelegatedWallet wallet = Factory.createWallet();
        
        for(uint i = 0; i < delegates.length; i++)
            wallet.addDelegate(delegates[i]);
            
        Owned(wallet).transferOwnership(msg.sender);
        wallets[msg.sender].add(wallet);
        
        return wallet;
    }
    
    function getWallets (address account) public view returns (address[]) {
        return wallets[account].array;
    }
    
}
