const ListLibTests = artifacts.require("ListLibTests");

contract('ListLib', function(accounts) {
    
    var listLibTest;

    it("check correctness of address list", function(){
        return ListLibTests.deployed()
        .then(function(instance){
            listLibTest = instance;
            return listLibTest.testAddressList()
        })
        .catch(function(err){
            assert(false, 'address tests failed');
        })
    });

    it("check correctness of bytes32 list", function(){
        return ListLibTests.deployed()
        .then(function(instance){
            listLibTest = instance;
            return listLibTest.testBytes32List()
        })
        .catch(function(err){
            assert(false, 'bytes32 tests failed');
        })
    });

    it("check correctness of uint list", function(){
        return ListLibTests.deployed()
        .then(function(instance){
            listLibTest = instance;
            return listLibTest.testUintList()
        })
        .catch(function(err){
            assert(false, 'uint tests failed');
        })
    });

});