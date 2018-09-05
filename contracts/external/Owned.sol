pragma solidity ^0.4.23;

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