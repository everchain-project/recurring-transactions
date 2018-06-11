pragma solidity ^0.4.23;

import "EverchainWallet.sol";
import "LibList.sol";
import "EAC.sol";
import "PriceFeed.sol";

contract EacGasPriceOracle is Owned {
    
    uint public BASE_ALARM_GAS          = 180000;
    uint public PAYMENT_GAS             = 2000000;
    uint public GAS_PRICE               = 30000000000;
    uint public PROTOCOL_FEE            = 30000000000;
    uint public ALARM_FEE               = 30000000000;
    uint public CLAIM_DEPOSIT           = 30000000000;
    
    function calculateCost (uint CALL_GAS, uint futureTimestamp) public view returns (uint alarmCost) {
        futureTimestamp; // not used yet but eventually it may be possible to semi accurately predict future gas costs
        return CALL_GAS * GAS_PRICE + ALARM_FEE + PROTOCOL_FEE;
    }
    
    // Default Options - [180000,2000000,30000000000,10000000000,20000000000,30000000000]
    function setOptions (uint[6] options) public onlyOwner {
        BASE_ALARM_GAS = options[0];
        PAYMENT_GAS = options[1];
        GAS_PRICE = options[2];
        PROTOCOL_FEE = options[3];
        ALARM_FEE = options[4];
        CLAIM_DEPOSIT = options[5];
    }
    
}

contract PriceFeeds is Owned {
    
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

contract RecurringPaymentScheduler is Owned {
    
    using LibList for LibList.UintList;
    
    address constant ETHER = address(0x0);
    
    PriceFeeds public feeds = PriceFeeds(0x9CC07E5005e87714C24e2C7439fdBC8d2a04e745);
    EacGasPriceOracle public gasOracle = EacGasPriceOracle(0x20b5e8b3af845Ffc4390a7539C9FF05753C4335f);
    SchedulerInterface public EAC = SchedulerInterface(0x31bBbf5180f2bD9C213e2E1D91a439677243268A);
    
    struct Payment {
        uint id;
        address[5] addresses;
        bool[3] bools;
        uint[8] uints;
        
        /*
        address wallet;         // The smart contract from which to initiate the payment
        address recipient;      // The recipient of the payment
        address spendToken;     // The token to send the payment in
        address priceToken;     // The token to price the payment in
        address alarmId;        // The alarm address that will trigger this payment in the future
        
        bool useGains;          // The payment uses gains for calculating the send amount
        bool usePercent;        // The payment uses a percent for calculating the send amount
        
        uint valueA;            // Holds a value depending on payment type
        uint valueB;            // Holds a value depending on payment type
        uint windowStart;       // The payment can be executed after the 'startTimestamp'
        uint windowSize;        // The payment has 'windowSize' seconds to be executed or it fails
        uint intervalSize;      // The number of seconds in between payments
        uint maximumIntervals;  // The number of recurring payments to make
        uint currentInterval;   // The current interval this payment is on
        uint extraGas;          // The amount of extra gas to call the transaction with
        */
    }
    
    struct Account {
        LibList.UintList outgoingPayments;
        LibList.UintList incomingPayments;
    }
    
    uint public nextPaymentId = 1;
    mapping (uint => Payment) payments;
    mapping (address => uint) public alarms;
    mapping (address => Account) accounts;
    
    function schedulePayment (
        address[4] addresses, 
        bool[3] bools, 
        uint[7] uints
    ) public payable returns (uint paymentId) {
        paymentId = nextPaymentId++;
        
        accounts[addresses[0]].outgoingPayments.add(paymentId);
        accounts[addresses[1]].incomingPayments.add(paymentId);
        
        Payment memory payment = payments[paymentId];
        
        payment.id = paymentId;
        
        payment.addresses[0] = addresses[0]; // walletAddress
        payment.addresses[1] = addresses[1]; // spendToken
        payment.addresses[2] = addresses[2]; // priceToken
        payment.addresses[3] = addresses[3]; // alarmId
        
        payment.bools[0] = bools[0]; // useGains
        payment.bools[1] = bools[1]; // usePercent
        payment.bools[2] = bools[2]; // usePrinciple
        
        payment.uints[0] = uints[0]; // valueA
        payment.uints[1] = uints[1]; // valueB
        payment.uints[2] = uints[2]; // paymentStart
        payment.uints[3] = uints[3]; // windowSize
        payment.uints[4] = uints[4]; // intervalSize
        payment.uints[5] = uints[5]; // maximumIntervals
        payment.uints[7] = uints[6]; // extraGas
        
        payment.addresses[4] = scheduleAlarm_internal(
            addresses[0], // wallet
            calculateWindowStart(payment), // paymentStart
            uints[3], // windowSize
            uints[6] // extraGas
        );
        
        alarms[payment.addresses[4]] = payment.id;
        payments[payment.id] = payment;
        
        EverchainWallet(addresses[0]).registerAlarm(payment.addresses[4]);
        
        return payment.id;
    }
    
    function _alarm (address alarm) public {
        uint paymentId = alarms[alarm];
        if(paymentId != 0){
            Payment storage payment = payments[paymentId];
            require(payment.addresses[0] == msg.sender);
            
            if(payment.uints[6] == 0){ // if this alarm is for calculating gains
                payment.uints[1] = calculateCurrentBalance(
                    payment.addresses[0], 
                    payment.addresses[1], 
                    payment.addresses[2]
                );
            } else {
                executePayment_internal(payment);
            }
        }
    }
    
    function cancelPayment (uint paymentId) public {
        Payment storage payment = payments[paymentId];
        
        EverchainWallet wallet = EverchainWallet(payment.addresses[0]);
        assert(wallet.isDelegate(msg.sender));
        
        TransactionRequestInterface(payment.addresses[4]).cancel();
        
        accounts[wallet].outgoingPayments.remove(paymentId);
        accounts[payment.addresses[3]].incomingPayments.remove(paymentId);
    }
    
    function calculateCurrentBalance (
        address walletAddress, 
        address spendToken, 
        address priceToken
    ) public view returns (uint) {
        uint currentSpendBalance = ERC20(spendToken).balanceOf(walletAddress);
        if(spendToken != priceToken){
            require(feeds.exists(priceToken, spendToken));
            
            return currentSpendBalance * uint(feeds.read(priceToken, spendToken)) / 1 ether;
        }
        
        return currentSpendBalance;
    }
    
    function calculateTokenAmount (
        address walletAddress, 
        address spendToken, 
        address priceToken, 
        bool useGains, 
        bool usePercent, 
        uint valueA, 
        uint previousBalance
    ) public view returns (uint tokenAmount) {
        uint currentBalance = calculateCurrentBalance(walletAddress, spendToken, priceToken);
        uint baseAmount;
        if(useGains){
            if(currentBalance > previousBalance)
                baseAmount = currentBalance - previousBalance;
        } else {
            baseAmount = currentBalance;
        }
        
        if(usePercent){ // use percent
            tokenAmount = baseAmount * valueA / 100; // In this case valueA is a percent (1-100)
        } else { // use static amount
            if(baseAmount >= valueA) // In this case, valueA is a static amount of tokens
                tokenAmount = valueA;
        }
    }
    
    function calculateWindowStart (Payment memory payment) internal view returns (uint windowStart) {
        bool usingGains = payment.bools[0];
        bool usingPrincipal = payment.bools[2];
        uint paymentStart = payment.uints[2];
        uint paymentInterval = payment.uints[3];
        if(usingGains){
            if(!usingPrincipal){
                uint calculateGainsStart = paymentStart - paymentInterval;
                if(calculateGainsStart <= now + 5 minutes) {
                    payment.uints[6] = 1; // set current interval to 1
                    
                    // set current balance
                    payment.uints[1] = calculateCurrentBalance(
                        payment.addresses[0], 
                        payment.addresses[1], 
                        payment.addresses[2]
                    );
                } else {
                    windowStart = calculateGainsStart;
                }
            }
        } else {
            payment.uints[6] = 1; // set current interval to 1
            windowStart = payment.uints[2];
        }
    }
    
    function getPayments (address account) public view returns (uint[], uint[]) {
        return (
            accounts[account].incomingPayments.array,
            accounts[account].outgoingPayments.array
        );
    }
    
    function getPayment (uint paymentId) public view returns (address[5], bool[3], uint[8]) {
        Payment memory payment = payments[paymentId];
        return (payment.addresses, payment.bools, payment.uints);
    }
    
    function executePayment_internal (Payment payment) internal returns (bool success) {
        uint tokenAmount = calculateTokenAmount(
            payment.addresses[0], // walletAddress
            payment.addresses[1], // spendToken
            payment.addresses[2], // priceToken
            payment.bools[0], // useGains
            payment.bools[1], // usePercent
            payment.uints[0], // valueA
            payment.uints[1] // valueB
        );
        
        if(tokenAmount > 0)
            success = EverchainWallet(payment.addresses[0]).transfer(payment.addresses[1], payment.addresses[3], tokenAmount);
        else
            success = false;
        
        uint maximumIntervals = payment.uints[5];
        uint currentInterval = payment.uints[6];
        if(currentInterval <= maximumIntervals){ // calculate next window start
            //  newWindowStart = oldWindowStart + intervalSize
            payment.uints[2] = payment.uints[2] + payment.uints[4];
            require(payment.uints[2] > now);
        } else {
            payment.uints[6]++; // Increase the current interval
        }
        
        emit Payment_event(payment.addresses[0], payment.addresses[3], payment.addresses[1], tokenAmount, currentInterval, maximumIntervals);
    }
    
    function scheduleAlarm_internal (
        address walletAddress, 
        uint windowStart, 
        uint windowSize, 
        uint extraGas
    ) internal returns (address alarmId) {
        uint alarmCost = gasOracle.calculateCost(extraGas, windowStart);
        EverchainWallet wallet = EverchainWallet(walletAddress);
        require(windowStart > now);
        
        // Pay for alarm execution
        bool paid = false;
        if(msg.value < alarmCost) {
            uint difference = alarmCost - msg.value;
            paid = wallet.transfer(ETHER, this, difference);
        } else if(msg.value > alarmCost) {
            paid = msg.sender.send(msg.value - alarmCost);
        } else {
            paid = true;
        }
        
        if(!paid) 
            return address(0x0);
        
        return EAC.schedule.value(alarmCost)(
            walletAddress,                      // toAddress
            "",                                 // callData
            [
                gasOracle.BASE_ALARM_GAS() + extraGas,  // The amount of gas to be sent with the transaction.
                0,                              // The amount of wei to be sent.
                windowStart,                    // The start of the execution window.
                windowSize,                     // The size of the execution window.
                gasOracle.GAS_PRICE(),          // The gasprice for the transaction
                gasOracle.PROTOCOL_FEE(),       // A fee that goes to maintaining and upgrading the EAC protocol
                gasOracle.ALARM_FEE(),          // The payment for the claimer that triggers this alarm.
                gasOracle.CLAIM_DEPOSIT()       // The required amount of wei the claimer must send as deposit.
            ]
        );
    }
    
    event Payment_event(
        address wallet, 
        address receiver, 
        address token, 
        uint amount, 
        uint currentInterval, 
        uint maximumInterval
    );
    
}
