module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // for more about customizing your Truffle configuration!
    networks: {
        'kovan': {
            host: "localhost",
            port: 8545,
            network_id: 42,
            from: '0x0170C8C0365a788b0679e76ED56d60054260ff7d',
            gas: 4700000,
            gasPrice: 10000000000
        },
        'live': {
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
