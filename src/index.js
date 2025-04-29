require("reflect-metadata");
const container = require("./di/container");
const RPC = require("@hyperswarm/rpc");
const DHT = require("hyperdht");
const { TYPES } = require("./di/types");
const { startPriceJob } = require("./jobs/prices.job");

const startRpcServer = async container => {
  const logger = container.get(TYPES.Logger);
  logger.log("Starting RPC server...");

  const dht = new DHT();
  await dht.ready();
  const rpc = new RPC({ dht });
  const server = rpc.createServer();

  // Bind RPC methods
  server.respond("getLatestPrices", async () => {
    const priceService = container.get(TYPES.PriceService);
    logger.log("RPC request: getLatestPrices");
    const data = await priceService.getLatestPrices();
    return Buffer.from(JSON.stringify(data), "utf-8");
  });

  server.respond("getHistoricalPrices", async reqBuffer => {
    const priceService = container.get(TYPES.PriceService);
    logger.log("RPC request: getHistoricalPrices");

    try {
      const { from, to } = JSON.parse(reqBuffer.toString("utf-8"));

      if (!from || !to || from >= to) {
        return Buffer.from(JSON.stringify({ error: "Invalid time range" }), "utf-8");
      }

      const data = await priceService.getHistoricalPrices(from, to);
      return Buffer.from(JSON.stringify(data), "utf-8");
    } catch (error) {
      logger.error("Error parsing historical prices request", error);
      return Buffer.from(JSON.stringify({ error: "Bad request format" }), "utf-8");
    }
  });

  await server.listen();
  const publicKey = server.publicKey.toString("hex");
  logger.log(`RPC Server is live! Public Key: ${publicKey}`);
};

(async () => {
  try {
    await startRpcServer(container);
    await startPriceJob();
  } catch (error) {
    console.error("Failed to start services:", error);
    process.exit(1);
  }
})();
