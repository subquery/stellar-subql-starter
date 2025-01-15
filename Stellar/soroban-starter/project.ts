import {
  StellarDatasourceKind,
  StellarHandlerKind,
  StellarProject,
} from "@subql/types-stellar";
import { Horizon } from "@stellar/stellar-sdk";

/* This is your project configuration */
const project: StellarProject = {
  specVersion: "1.0.0",
  name: "soroban-starter",
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
    "This project can be use as a starting point for developing your new Stellar SubQuery project (mainnet)",
  repository: "https://github.com/subquery/stellar-subql-starter",
  schema: {
    file: "./schema.graphql",
  },
  network: {
    /* Stellar and Soroban uses the network passphrase as the chainId
      'Test SDF Network ; September 2015' for testnet
      'Public Global Stellar Network ; September 2015' for mainnet
      'Test SDF Future Network ; October 2022' for Future Network */
    chainId: "Public Global Stellar Network ; September 2015",
    /**
     * These endpoint(s) should be public non-pruned archive node
     * We recommend providing more than one endpoint for improved reliability, performance, and uptime
     * Public nodes may be rate limited, which can affect indexing speed
     * When developing your project we suggest getting a private API key
     * If you use a rate limited endpoint, adjust the --batch-size and --workers parameters
     * These settings can be found in your docker-compose.yaml, they will slow indexing but prevent your project being rate limited
     * You can find RPC endpoints for Stellar here https://soroban.stellar.org/docs/reference/rpc-list
     */
    endpoint: ["https://horizon.stellar.org/"],
    /* This is a specific Soroban endpoint
      It is only required when you are using a soroban/EventHandler */
    sorobanEndpoint: "https://soroban-rpc.mainnet.stellar.gateway.fm",
  },
  dataSources: [
    {
      kind: StellarDatasourceKind.Runtime,
      /* Set this as a logical start block, it might be block 1 (genesis) or when your contract was deployed */
      startBlock: 50460000,
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            handler: "handleOperation",
            kind: StellarHandlerKind.Operation,
            filter: {
              type: Horizon.HorizonApi.OperationResponseType.payment,
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
              /* You can optionally specify a smart contract address here
                contractId: "" */
              topics: [
                "transfer", // Topic signature(s) for the events, there can be up to 4
              ],
            },
          },
        ],
      },
    },
  ],
};

// Must set default to the project instance
export default project;
