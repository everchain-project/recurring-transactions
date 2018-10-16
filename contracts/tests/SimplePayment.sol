pragma solidity ^0.4.23;

import "../Interfaces.sol";

contract SimplePayment is IPayment {

    uint public blockInitialized;

    IPaymentDelegate public delegate;
    IDelegatedWallet public wallet;
    address public token;
    address public recipient;
    uint paymentAmount;

    address alarm;

    function initialize (
        IPaymentDelegate _delegate,
        IDelegatedWallet _wallet,
        address _token,
        address _recipient,
        uint _amount
    ) public {
        require(blockInitialized == 0, "can only initialize once");

        blockInitialized = block.number;

        delegate = _delegate;
        wallet = _wallet;
        token = _token;
        recipient = _recipient;
        paymentAmount = _amount;

        alarm = msg.sender;
    }
    
    function amount () public view returns (uint) {
        return paymentAmount;
    }

    function () public {
        require(msg.sender == alarm);
        
        bool success = delegate.execute();
        delegate.unschedule();

        emit Payment_event(amount(), success);
    }

    function cancel () public {
        require(wallet.isDelegate(msg.sender));

        delegate.unschedule();
    }

    event Payment_event(uint amount, bool success);

}