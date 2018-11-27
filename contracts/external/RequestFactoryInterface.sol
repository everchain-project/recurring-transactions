pragma solidity ^0.5.0;

contract RequestFactoryInterface {
    event RequestCreated(address request, address indexed owner, int indexed bucket, uint[12] params);

    function createRequest(address[3] memory addressArgs, uint[12] memory uintArgs, bytes memory callData) public payable returns (address);
    function createValidatedRequest(address[3] memory addressArgs, uint[12] memory uintArgs, bytes memory callData) public payable returns (address);
    function validateRequestParams(address[3] memory addressArgs, uint[12] memory uintArgs, uint endowment) public view returns (bool[6] memory);
    function isKnownRequest(address _address) public view returns (bool);
}