pragma solidity ^0.5.0;

// A delegated wallet implements a transfer function only callable by select delegates
// The wallet has a payable default function that can accept ether
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
