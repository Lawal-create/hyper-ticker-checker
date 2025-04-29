const TYPES = {
  Logger: Symbol.for("Logger"),
  HTTPClient: Symbol.for("HTTPClient"),
  HyperBeeDB: Symbol.for("HyperBeeDB"),
  CoinGeckoProvider: Symbol.for("CoinGeckoProvider"),
  PriceService: Symbol.for("PriceService")
};

module.exports = { TYPES };
