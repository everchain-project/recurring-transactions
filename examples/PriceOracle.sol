pragma solidity ^0.4.23;

import "PaymentScheduler.sol";

contract PriceOracle is IPriceOracle, Owned {
    
    uint public GAS_PRICE       =  3000000000;
    uint public ALARM_FEE       = 20000000000;
    uint public PROTOCOL_FEE    = 20000000000;
    uint public CLAIM_DEPOSIT   = 20000000000;
    
    function gasPrice (uint futureTimestamp) public view returns (uint) {
        futureTimestamp;
        
        // Although 'futureTimestamp' is not used here, in the future it may be
        // possible to reliably predict costs at a future timestamp
        
        return GAS_PRICE;
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