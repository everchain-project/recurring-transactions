pragma solidity ^0.4.23;

import "import/Owned.sol";
import "components/Interfaces.sol";

contract GasPriceOracle is IPriceOracle, Owned {
    
    uint public GAS_PRICE = 3000000000;
    
    function gasPrice (uint futureTimestamp) public view returns (uint) {
        futureTimestamp;
        
        // Although 'futureTimestamp' is not used here, in the future it may be
        // possible to reliably predict costs at a future timestamp
        
        return GAS_PRICE;
    }
    
    function updateGasPrice () public onlyOwner {
        GAS_PRICE = tx.gasprice;
    }
    
}
