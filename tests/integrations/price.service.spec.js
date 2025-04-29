const { expect } = require("chai");
const sinon = require("sinon");
const container = require("../../src/di/container");
const { TYPES } = require("../../src/di/types");
const { HyperBeeStorage } = require("../../src/internal/storage");

const {
  CoinGeckoProviderStub,
  mockFetchTopExchanges,
  mockFetchTopCryptos,
  mockFetchCryptoByExchanges,
} = require("../helpers/coingecko.helper");

describe("PriceService Integration Tests", () => {
  let priceService;
  let db;

  beforeAll(() => {
    container.rebind(TYPES.HyperBeeDB).toDynamicValue(() => {
      const hyperbee = new HyperBeeStorage("./data/test.db");
      return hyperbee.getDB();
    });
    container.rebind(TYPES.CoinGeckoProvider).toConstantValue(CoinGeckoProviderStub);

    priceService = container.get(TYPES.PriceService);
    db = container.get(TYPES.HyperBeeDB);
  });

  afterAll(async () => {
    await db.close();
  });

  beforeEach(() => {
    sinon.reset();
  });

  // ------------------- Fetching and Storing -------------------

  describe("Fetching and Storing", () => {
    it("should fetch and store cryptocurrency prices", async () => {
      mockFetchTopExchanges();
      mockFetchTopCryptos();
      mockFetchCryptoByExchanges();

      await priceService.fetchAndStorePrices();
      const latestPrices = await priceService.getLatestPrices();

      expect(latestPrices).to.be.an("object");
      expect(Object.keys(latestPrices.value)).to.have.length.greaterThan(0);
    });

    it("should skip storing if prices have not changed", async () => {
      mockFetchTopExchanges();
      mockFetchTopCryptos();
      mockFetchCryptoByExchanges();

      await priceService.fetchAndStorePrices(); // First store
      const spy = sinon.spy(db, "put");

      await priceService.fetchAndStorePrices(); // Second call with same data
      expect(spy.calledWithMatch("prices:")).to.be.false;
      spy.restore();
    });
  });

  // ------------------- Latest Prices -------------------

  describe("Latest Prices", () => {
    it("should retrieve the latest stored prices", async () => {
      mockFetchTopExchanges();
      mockFetchTopCryptos();
      mockFetchCryptoByExchanges();

      await priceService.fetchAndStorePrices();
      const latestPrices = await priceService.getLatestPrices();

      expect(latestPrices).to.be.an("object");
      expect(latestPrices.value).to.have.keys("bitcoin", "ethereum");
    });
  });

  // ------------------- Historical Prices -------------------

  describe("Historical Prices", () => {
    it("should retrieve historical prices correctly", async () => {
      mockFetchTopExchanges();
      mockFetchTopCryptos();
      mockFetchCryptoByExchanges();

      const now = Date.now();
      const earlier = now - 60000;

      await priceService.fetchAndStorePrices();
      const history = await priceService.getHistoricalPrices(earlier, now);

      expect(history).to.be.an("array");
      expect(history.length).to.be.greaterThan(0);
      expect(history[0]).to.have.keys("timestamp", "data");
    });

    it("should return an empty array if no prices exist in the time range", async () => {
      const now = Date.now();
      const tenYearsAgo = now - 10 * 365 * 24 * 3600 * 1000; // Way far in the past

      const history = await priceService.getHistoricalPrices(tenYearsAgo, tenYearsAgo + 10000);
      expect(history).to.be.an("array").that.is.empty;
    });
  });

  // ------------------- Data Integrity -------------------

  describe("Data Integrity", () => {
    it("should store prices with correct fields and structure", async () => {
      mockFetchTopExchanges();
      mockFetchTopCryptos();
      mockFetchCryptoByExchanges();

      await priceService.fetchAndStorePrices();
      const latest = await priceService.getLatestPrices();

      const bitcoinData = latest.value.bitcoin;
      expect(bitcoinData).to.have.keys("timestamp", "price", "exchanges");
      expect(bitcoinData.exchanges).to.be.an("array");
      expect(bitcoinData.exchanges[0]).to.have.keys("exchange", "price");
    });

    it("should calculate correct average price", async () => {
      mockFetchTopExchanges();
      mockFetchTopCryptos();
      mockFetchCryptoByExchanges();

      await priceService.fetchAndStorePrices();
      const latest = await priceService.getLatestPrices();

      const eth = latest.value.ethereum;
      // We know from the mock the price is 4350 from Bybit
      expect(parseFloat(eth.price)).to.equal(4350);
    });
  });

  // ------------------- Error Handling -------------------

  describe("Error Handling", () => {
    it("should handle CoinGecko API failure properly", async () => {
      CoinGeckoProviderStub.fetchTopCryptos.rejects(new Error("CoinGecko API down"));

      try {
        await priceService.fetchAndStorePrices();
      } catch (error) {
        console.log((error))
        expect(error.message).to.include("CoinGecko API down");
      }
    });
  });

  // ------------------- Edge Cases -------------------

  describe("Edge Cases", () => {
    it("should handle empty ticker response without crashing", async () => {
      CoinGeckoProviderStub.fetchCryptoByExchanges.resolves({ data: { tickers: [] } });
      mockFetchTopExchanges();
      mockFetchTopCryptos();

      await priceService.fetchAndStorePrices();
      const latest = await priceService.getLatestPrices();
      expect(latest.value).to.be.an("object");
    });
  });
});
