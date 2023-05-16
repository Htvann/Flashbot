import * as dotenv from "dotenv";

import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-chai-matchers";
import "hardhat-deploy";
import "hardhat-contract-sizer";
import "./tasks";

dotenv.config();

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: {
        url: process.env.FORKING_NETWORK!,
        // url: "https://bscrpc.com",
        enabled: process.env.ENABLE_FORKING! === "true",
        blockNumber: Number(process.env.FORKING_BLOCK!),
      },
      loggingEnabled: process.env.FORKING_LOG! === "true",
      chainId: 31337,
      // accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : undefined,
      allowUnlimitedContractSize: true,
    },
    localhost: {
      chainId: 31337,
    },
    bscTestnet: {
      url: process.env.BSCTESTNET_RPC_URL,
      accounts: [process.env.PRIVATE_KEY!],
      saveDeployments: true,
      chainId: 97,
    },
    bscMainnet: {
      url: process.env.BSCMAINNET_RPC_URL,
      accounts: [process.env.PRIVATE_KEY!],
      saveDeployments: true,
      chainId: 56,
    },
  },
  etherscan: {
    // yarn hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
    apiKey: {
      rinkeby: process.env.ETHERSCAN_API_KEY!,
      kovan: process.env.ETHERSCAN_API_KEY!,
      bscTestnet: process.env.BSCSCAN_API_KEY!,
      bscMainnet: process.env.BSCSCAN_API_KEY!,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    // coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
    },
    feeCollector: {
      default: 1,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.6.6",
        settings: {
          // See the solidity docs for advice about optimization and evmVersion
          optimizer: {
            enabled: true,
            runs: 999999,
          },
          evmVersion: "istanbul",
          outputSelection: {
            "*": {
              "": ["ast"],
              "*": [
                "evm.bytecode.object",
                "evm.deployedBytecode.object",
                "abi",
                "evm.bytecode.sourceMap",
                "evm.deployedBytecode.sourceMap",
                "metadata",
              ],
            },
          },
        },
      },
      {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.4.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.1",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  mocha: {
    timeout: 200000, // 200 seconds max for running tests
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
};

export default config;
