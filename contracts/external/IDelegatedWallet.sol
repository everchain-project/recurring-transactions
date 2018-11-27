pragma solidity ^0.5.0;

/*
    see todo link
*/

// A delegated wallet implements a transfer function only callable by select delegates
// The wallet has a payable default function that can accept ether
contract IDelegatedWallet {
    function transfer (address token, address payable recipient, uint amount) public returns (bool success);
    function approve (address token, address recipient, uint amount) public returns (bool success);
    function balanceOf (address token) public view returns (uint balance);
    function isDelegate (address _address) public view returns (bool success);
    function () external payable;
}