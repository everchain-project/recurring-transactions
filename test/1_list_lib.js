const ListLibTests = artifacts.require("ListLibTests");

contract('ListLib', function(accounts) {

    it("check correctness of address list", function(){
        return ListLibTests.deployed()
        .then(listLibTest => listLibTest.testAddressList({from:accounts[0]}))
        .catch(function(err){
            console.log(err);
            assert(false, 'address tests failed');
        })
    });

    it("check correctness of bytes32 list", function(){
        return ListLibTests.deployed()
        .then(listLibTest => listLibTest.testBytes32List({from:accounts[0]}))
        .catch(function(err){
            console.log(err);
            assert(false, 'bytes32 tests failed');
        })
    });

    it("check correctness of uint list", function(){
        return ListLibTests.deployed()
        .then(listLibTest => listLibTest.testUintList({from:accounts[0]}))
        .catch(function(err){
            console.log(err);
            assert(false, 'uint tests failed');
        })
    });

});