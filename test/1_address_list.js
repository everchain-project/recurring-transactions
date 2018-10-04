const ListLibTests = artifacts.require("ListLibTests");
const AddressList = artifacts.require("AddressList");

contract('Address List Blueprint', function(accounts) {

    it("check correctness of list lib", () => {
        return ListLibTests.deployed()
        .then(listLibTest => listLibTest.testAddressList({from:accounts[0]}))
        .catch(function(err){
            console.log(err);
            assert(false, 'address tests failed');
        })
    });

    it("initialize the address list blueprint", () => {
        return AddressList.deployed()
        .then(AddressListBlueprint => AddressListBlueprint.initialize(
            accounts[0], 
            [
                accounts[1], 
                accounts[2], 
                accounts[3]
            ]
        ))
    });

    it("attempt to re-initialize the address list", () => {
        return AddressList.deployed()
        .then(AddressListBlueprint => AddressListBlueprint.initialize(
            accounts[0], 
            [
                accounts[5], 
                accounts[6], 
                accounts[7]
            ]
        ))
        .then(() => {
            assert(false, "the address list should only be able to be initialized once");
        }).catch(err => {
            // transaction should catch
        })
    });

    it("check correctness of the initialization", () => {
        var AddressListBlueprint;

        return AddressList.deployed()
        .then(blueprint => {
            AddressListBlueprint = blueprint;
            return AddressListBlueprint.get()
        })
        .then(array => {
            assert(array[0] == accounts[1], "array[0] should be set to accounts[1]");
            assert(array[1] == accounts[2], "array[1] should be set to accounts[2]");
            assert(array[2] == accounts[3], "array[2] should be set to accounts[3]");
            return AddressListBlueprint.owner();
        })
        .then(owner => {
            assert(owner == accounts[0], "owner should be set to accounts[0]")
        })
    });

    it("have owner add an address", () => {
        var AddressListBlueprint;

        return AddressList.deployed()
        .then(blueprint => {
            AddressListBlueprint = blueprint;
            return AddressListBlueprint.add(accounts[4], {from: accounts[0]})
        })
        .then(() => AddressListBlueprint.get())
        .then(array => {
            assert(array[0] == accounts[1], "array[0] should be set to accounts[1]");
            assert(array[1] == accounts[2], "array[1] should be set to accounts[2]");
            assert(array[2] == accounts[3], "array[2] should be set to accounts[3]");
            assert(array[3] == accounts[4], "array[3] should be set to accounts[4]");
        })
    });

    it("have owner remove address", () => {
        var AddressListBlueprint;

        return AddressList.deployed()
        .then(blueprint => {
            AddressListBlueprint = blueprint;
            return AddressListBlueprint.remove(accounts[1], {from: accounts[0]})
        })
        .then(() => AddressListBlueprint.get())
        .then(array => {
            assert(array[0] == accounts[4], "array[0] should be set to accounts[4]");
            assert(array[1] == accounts[2], "array[1] should be set to accounts[2]");
            assert(array[2] == accounts[3], "array[2] should be set to accounts[3]");
        })
    });

    it("have a non-owner attempt to add an address", () => {
        var AddressListBlueprint;

        return AddressList.deployed()
        .then(blueprint => {
            AddressListBlueprint = blueprint;
            return AddressListBlueprint.add(accounts[1], {from: accounts[1]})
        })
        .then(() => {
            assert(false, "a non-owner should never be allowed to add an address")
        })
        .catch(() => {
            // expected outcome
        })
    });

    it("have a non-owner attempt to remove an address", () => {
        var AddressListBlueprint;

        return AddressList.deployed()
        .then(blueprint => {
            AddressListBlueprint = blueprint;
            return AddressListBlueprint.remove(accounts[1], {from: accounts[1]})
        })
        .then(() => {
            assert(false, "a non-owner should never be allowed to remove an address")
        })
        .catch(() => {
            // expected outcome
        })
    });

});
