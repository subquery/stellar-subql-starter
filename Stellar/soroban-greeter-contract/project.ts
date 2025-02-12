import {
  StellarDatasourceKind,
  StellarHandlerKind,
  StellarProject,
} from "@subql/types-stellar";

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
     * If you use a rate limited endpoint, adjust the --batch-size and --workers parameters
     * These settings can be found in your docker-compose.yaml, they will slow indexing but prevent your project being rate limited
     */
    endpoint: ["https://horizon-futurenet.stellar.org:443"],
    // This is a specific Soroban endpoint
    // It is only required when you are using a soroban/EventHandler
    sorobanEndpoint: "https://rpc-futurenet.stellar.org",
  },
  dataSources: [
    {
      kind: StellarDatasourceKind.Runtime,
      startBlock: 831474,
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            handler: "handleEvent",
            kind: StellarHandlerKind.Event,
            filter: {
              topics: [
                "COUNT", // Topic signature(s) for the events, there can be up to 4
              ],
              contractId:
                "CAQFKAS47DF6RBKABRLDZ5O4XJIH2DQ3RMNHFPOSGLFI6KMSSIUIGQJ6",
            },
          },
        ],
      },
    },
  ],
};

// Must set default to the project instance
export default project;
