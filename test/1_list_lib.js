const ListLibTests = artifacts.require("ListLibTests");

contract('ListLib', function(accounts) {

    it("check correctness of list lib", () => {
        return ListLibTests.deployed()
        .then(listLibTest => listLibTest.testAddressList({from: accounts[0]}))
    });

});
