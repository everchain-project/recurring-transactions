pragma solidity ^0.5.0;

contract ERC20 {
    string public name;
    string public symbol;

    function totalSupply() public view returns (uint);
    function balanceOf(address tokenOwner) public view returns (uint balance);
    function allowance(address tokenOwner, address spender) public view returns (uint remaining);
    function transfer(address to, uint tokens) public returns (bool success);
    function approve(address spender, uint tokens) public returns (bool success);
    function transferFrom(address from, address to, uint tokens) public returns (bool success);

    event Transfer(address indexed from, address indexed to, uint tokens);
    event Approval(address indexed tokenOwner, address indexed spender, uint tokens);
}

contract IDelegatedWallet {
    function transfer (address token, address payable recipient, uint amount) public returns (bool success);
    function call (address callAddress, uint callValue, bytes memory callData) public returns (bool success, bytes memory returnData);
    function balanceOf (address token) public view returns (uint balance);
    function isDelegate (address _address) public view returns (bool success);
    function () external payable;
}

contract IDelegatedWalletFactory {
    function createWallet (address owner, address[] memory delegates) public payable returns (IDelegatedWallet);
}

contract RequestFactoryInterface {
    event RequestCreated(address request, address indexed owner, int indexed bucket, uint[12] params);

    function createRequest(address[3] memory addressArgs, uint[12] memory uintArgs, bytes memory callData) public payable returns (address);
    function createValidatedRequest(address[3] memory addressArgs, uint[12] memory uintArgs, bytes memory callData) public payable returns (address);
    function validateRequestParams(address[3] memory addressArgs, uint[12] memory uintArgs, uint endowment) public view returns (bool[6] memory);
    function isKnownRequest(address _address) public view returns (bool);
}

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
