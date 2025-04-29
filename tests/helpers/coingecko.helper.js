const sinon = require("sinon");
const CoinGeckoProvider = require("../../src/providers/coingecko.provider");

const CoinGeckoProviderStub = sinon.createStubInstance(CoinGeckoProvider);

const mockFetchTopExchanges = () => {
  CoinGeckoProviderStub.fetchTopExchanges.resolves([
    { id: "binance", name: "Binance" },
    { id: "bybit_spot", name: "Bybit" },
    { id: "coinbase", name: "Coinbase" },
  ]);
};

const mockFetchTopCryptos = () => {
  CoinGeckoProviderStub.fetchTopCryptos.resolves([
    { id: "bitcoin", name: "Bitcoin", symbol: "btc", current_price: 60000 },
    { id: "ethereum", name: "Ethereum", symbol: "eth", current_price: 4200 },
    { id: "ripple", name: "XRP", symbol: "xrp", current_price: 1.5 },
  ]);
};
const mockFetchCryptoByExchanges = () => {
  CoinGeckoProviderStub.fetchCryptoByExchanges
    .withArgs(sinon.match.any, sinon.match.any, sinon.match(2))
    .resolves({
      data: {
        tickers: [],
      },
    });

  CoinGeckoProviderStub.fetchCryptoByExchanges
    .withArgs(sinon.match.any, sinon.match.any, sinon.match(1))
    .resolves({
      data: {
        tickers: [
          {
            base: "BTC",
            target: "USDT",
            last: 61000,
            coin_id: "bitcoin",
            market: { identifier: "binance" },
          },
          {
            base: "ETH",
            target: "USDT",
            last: 4350,
            coin_id: "ethereum",
            market: { identifier: "bybit_spot" },
          },
        ],
      },
    });
};

module.exports = {
  CoinGeckoProviderStub,
  mockFetchTopExchanges,
  mockFetchTopCryptos,
  mockFetchCryptoByExchanges,
};
