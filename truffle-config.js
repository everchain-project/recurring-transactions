module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // for more about customizing your Truffle configuration!
    networks: {
        development: {
            host: "localhost",
            port: 8545,
            network_id: "*", // Match any network id
            from: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
            gas: 4700000,
            gasPrice: 0,
        },
        kovan: {
            host: "localhost",
            port: 8545,
            network_id: 42,
            from: '0x96a15a5de1727d4ed36bd3129becb09cef62ee46',
            gas: 4700000,
            gasPrice: 20000000000
        },
        live: {
            host: "localhost",
            port: 8545,
            network_id: 1,        // Ethereum public network
            // optional config values:
            // gas
            // gasPrice
            // from - default address to use for any transaction Truffle makes during migrations
            // provider - web3 provider instance Truffle should use to talk to the Ethereum network.
            //          - function that returns a web3 provider instance (see below.)
            //          - if specified, host and port are ignored.
        }
    },
    mocha: {
        enableTimeouts: false
    }
};
