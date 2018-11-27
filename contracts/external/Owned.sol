pragma solidity ^0.5.0;

contract Owned {
    address public owner;

    constructor() public {
        owner = msg.sender;
    }
    
    function transferOwnership (address _newOwner) public onlyOwner {
        owner = _newOwner;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner);
        
        _;
    }
}