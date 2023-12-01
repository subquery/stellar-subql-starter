import {
  StellarDatasourceKind,
  StellarHandlerKind,
  StellarProject,
} from "@subql/types-stellar";
import { Horizon } from "stellar-sdk";
const project: StellarProject = {
  specVersion: "1.0.0",
  name: "soroban-futurenet-starter",
  version: "0.0.1",
  runner: {
    node: {
      name: "@subql/node-stellar",
      version: "*",
    },
    query: {
      name: "@subql/query",
      version: "*",
    },
  },
  description:
    "This project can be use as a starting point for developing your new Stellar SubQuery project (Futurenet)",
  repository: "https://github.com/subquery/stellar-subql-starter",
  schema: {
    file: "./schema.graphql",
  },
  network: {
    // Stellar and Soroban uses the network passphrase as the chainId
    // 'Public Global Stellar Network ; September 2015' for mainnet
    // 'Test SDF Future Network ; October 2022' for Future Network
    chainId: "Test SDF Future Network ; October 2022",
    /**
     * These endpoint(s) should be public non-pruned archive node
     * We recommend providing more than one endpoint for improved reliability, performance, and uptime
     * Public nodes may be rate limited, which can affect indexing speed
     * When developing your project we suggest getting a private API key
     */
    endpoint: ["https://horizon-futurenet.stellar.org:443"],
    // This is a specific Soroban endpoint
    // It is only required when you are using a soroban/EventHandler
    sorobanEndpoint: "https://rpc-futurenet.stellar.org",
    // Recommended to provide the HTTP endpoint of a full chain dictionary to speed up processing
    // dictionary: "https://gx.api.subquery.network/sq/subquery/eth-dictionary",
  },
  dataSources: [
    {
      kind: StellarDatasourceKind.Runtime,
      startBlock: 49260759, // Set this as a logical start block, it might be block 1 (genesis) or when your contract was deployed
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            handler: "handleOperation",
            kind: StellarHandlerKind.Operation,
            filter: {
              type: Horizon.OperationResponseType.payment,
            },
          },
          {
            handler: "handleCredit",
            kind: StellarHandlerKind.Effects,
            filter: {
              type: "account_credited",
            },
          },
          {
            handler: "handleDebit",
            kind: StellarHandlerKind.Effects,
            filter: {
              type: "account_debited",
            },
          },
          {
            handler: "handleEvent",
            kind: StellarHandlerKind.Event,
            filter: {
              // contractId: "" // You can optionally specify a smart contract address here
              topics: ["transfer"], // Topic signature(s) for the events, there can be up to 4
            },
          },
        ],
      },
    },
  ],
};

// Must set default to the project instance
export default project;
