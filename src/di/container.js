const { Container } = require("inversify");
const { TYPES } = require("./types");
const HttpClient = require("../internal/http");
const CoinGeckoProvider = require("../providers/coingecko.provider");
const Logger = require("../internal/logger");
const PriceService = require("../prices/price.service");
const { HyperBeeStorage } = require("../internal/storage");

const container = new Container();
const logger = new Logger({ name: "crypto-price-checker" });

// Binds Logger
container.bind(TYPES.Logger).toConstantValue(logger);

// Binds HttpClient and inject Logger
container.bind(TYPES.HTTPClient).toDynamicValue((context) => {
  const httpClient = new HttpClient(context.container.get(TYPES.Logger));
  return httpClient.getClient();
});

// Binds HyperbeeDB
container.bind(TYPES.HyperBeeDB).toDynamicValue(() => {
  const hyperbee = new HyperBeeStorage();
  return hyperbee.getDB();
});

// Binds CoinGeckoProvider and inject HttpClient
container.bind(TYPES.CoinGeckoProvider).toDynamicValue((context) => {
  return new CoinGeckoProvider(context.container.get(TYPES.HTTPClient));
});

// Binds PriceService and injects CoinGeckoProvider, HyperbeeDB and Logger
container.bind(TYPES.PriceService).toDynamicValue((context) => {
  const logger = context.container.get(TYPES.Logger);
  logger.log("Logger is ready ✅");

  const provider = context.container.get(TYPES.CoinGeckoProvider);
  logger.log("CoinGeckoProvider is ready ✅");

  const db = context.container.get(TYPES.HyperBeeDB);
  logger.log("HyperBeeDB is ready ✅");

  return new PriceService(provider, db, logger);
});

module.exports = container;
