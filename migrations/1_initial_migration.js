var Migrations = artifacts.require("./Migrations.sol");

module.exports = function(deployer, network, accounts) {

    console.log("");
    console.log("Starting initial migrating contracts to " + network + " network");
    console.log("");
    
    deployer.deploy(Migrations);
    
};
