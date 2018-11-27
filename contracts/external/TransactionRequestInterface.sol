pragma solidity ^0.5.0;

contract TransactionRequestInterface {
    
    // Primary actions
    function execute() public returns (bool);
    function cancel() public returns (bool);
    function claim() public payable returns (bool);

    // Proxy function
    function proxy(address recipient, bytes memory callData) public payable returns (bool);

    // Data accessors
    function requestData() public view returns (address[6] memory, bool[3] memory, uint[15] memory, uint8[1] memory);
    function callData() public view returns (bytes memory);

    // Pull mechanisms for payments.
    function refundClaimDeposit() public returns (bool);
    function sendFee() public returns (bool);
    function sendBounty() public returns (bool);
    function sendOwnerEther() public returns (bool);
    function sendOwnerEther(address recipient) public returns (bool);

    /** Event duplication from RequestLib.sol. This is so
     *  that these events are available on the contracts ABI.*/
    event Aborted(uint8 reason);
    event Cancelled(uint rewardPayment, uint measuredGasConsumption);
    event Claimed();
    event Executed(uint bounty, uint fee, uint measuredGasConsumption);
}
