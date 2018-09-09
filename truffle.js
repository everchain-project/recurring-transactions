module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // for more about customizing your Truffle configuration!
    networks: {
      development: {
        host: "localhost",
        port: 8545,
        network_id: "*" // Match any network id
      },
      kovan: {
        host: "localhost",
        port: 8545,
        network_id: 42,
        gas: 4000000
      },
      live: {
          host: "127.0.0.1",
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
    }
  };
  