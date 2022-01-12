const HDWalletProvider = require("@truffle/hdwallet-provider");
const seed_phrase = 'siege oblige account arctic gym thunder since kidney dizzy armed much impact'
const infura_rinkeby_link = 'https://rinkeby.infura.io/v3/7941dd5459a048d69be5d048f4b9c932'
module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*" // Match any network id
    },
    rinkeby: {
      provider: () => new HDWalletProvider(seed_phrase, infura_rinkeby_link),
      network_id: 4,       // Ropsten's id
      gas: 4000000,        // Ropsten has a lower block limit than mainnet
      confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    }
  },
  contracts_directory: './src/contracts/',
  contracts_build_directory: './src/abis/',
  compilers: {
    solc: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      evmVersion:'petersburg'
    }
  }
}

