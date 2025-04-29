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
container.bind(TYPES.HyperBeeDB).toDynamicValue((_context) => {
  const hyperbee = new HyperBeeStorage();
  return hyperbee.getDB();
});

// Binds CoinGeckoProvider and inject HttpClient
container.bind(TYPES.CoinGeckoProvider).toDynamicValue((context) => {
    return new CoinGeckoProvider(context.container.get(TYPES.HTTPClient));
  });


module.exports = container;
