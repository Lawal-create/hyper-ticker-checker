const { groupBy, meanBy } = require("lodash");

const TARGET_CURRENCY = "USDT";

class PriceService {
  /**
   * @param {Hyperbee} db - Injected Hyperbee DB instance
   * @param {Logger} logger - Injected Logger instance
   * @param {CoinGeckoProvider} coingecko - Injected CoinGeckoProvider instance
   */
  constructor(coingecko, db, logger) {
    this.db = db;
    this.logger = logger;
    this.coingecko = coingecko;
  }

  /**
   * Fetches and processes top 5 cryptocurrencies and their prices.
   * @param {number} timestamp - Optional timestamp for the fetch operation
   * @returns {Promise<Object>} Processed cryptocurrency price data
   */
  async getTopFiveCryptos(timestamp = Date.now()) {
    try {
      const topCryptos = await this.coingecko.fetchTopCryptos();
      const cryptoIDs = topCryptos.map((crypto) => crypto.id);

      const topExchanges = await this.coingecko.fetchTopExchanges();
      const exchangeIDs = topExchanges.map((exchange) => exchange.id);

      const tickers = [];

      for (const crypto of cryptoIDs) {
        let page = 1;
        let tickersData = await this.coingecko.fetchCryptoByExchanges(exchangeIDs, crypto, page);

        // Fetch all pages of tickers for a given crypto until no more tickers are returned.
        // The CoinGecko API paginates tickers without providing total pages upfront,
        // so we keep fetching page-by-page until we encounter an empty page.
        while (
          tickersData &&
          tickersData.data &&
          tickersData.data.tickers &&
          tickersData.data.tickers.length > 0
        ) {
          tickers.push(...this._normalizeTickers(tickersData.data.tickers, cryptoIDs, exchangeIDs));
          tickersData = await this.coingecko.fetchCryptoByExchanges(exchangeIDs, crypto, ++page);
        }
      }

      const grouped = groupBy(tickers, "coin_id");
      return this._processGroupedPrices(grouped, timestamp);
    } catch (error) {
      this.logger.error("Failed to fetch top cryptocurrencies", error);
      throw error;
    }
  }

  /**
   * Processes grouped ticker data to calculate average prices.
   * @param {Object} groupedData - Grouped tickers by coin ID
   * @param {number} timestamp - Timestamp to attach to results
   * @returns {Object}
   */
  _processGroupedPrices(groupedData, timestamp) {
    const result = {};

    for (const [currency, prices] of Object.entries(groupedData)) {
      const averagePrice = meanBy(prices, "last").toFixed(2);

      result[currency] = {
        timestamp,
        price: averagePrice,
        exchanges: prices.map((ticker) => ({
          exchange: ticker.exchange_id,
          price: ticker.last,
        })),
      };
    }

    return result;
  }

  /**
   * Normalizes raw ticker data by filtering invalid values.
   * @param {Array} tickers - Ticker array from CoinGecko
   * @param {Array} cryptos - Valid crypto IDs
   * @param {Array} exchanges - Valid exchange IDs
   * @returns {Array}
   */
  _normalizeTickers(tickers, cryptos, exchanges) {
    return tickers.reduce((acc, ticker) => {
      const valid =
        ticker.target === TARGET_CURRENCY &&
        cryptos.includes(ticker.coin_id) &&
        exchanges.includes(ticker.market.identifier) &&
        ticker.last > 0;

      if (!valid) return acc;

      acc.push({
        base: ticker.base,
        target: ticker.target,
        last: ticker.last,
        coin_id: ticker.coin_id,
        target_coin_id: ticker.target_coin_id,
        exchange_id: ticker.market.identifier,
      });
      return acc;
    }, []);
  }

  /**
   * Fetches latest prices and stores them if they changed.
   */
  async fetchAndStorePrices() {
    try {
      const timestamp = Date.now();
      const prices = await this.getTopFiveCryptos(timestamp);

      const lastStored = await this.getLatestPrices();
      if (JSON.stringify(prices) === JSON.stringify(lastStored?.value)) {
        this.logger.log("No price change detected, skipping storage.");
        return;
      }

      // Atomically store the new prices and update the 'latest' pointer in a single batch.
      // Ensures both operations succeed together or not at all, preventing database inconsistency.
      const batch = this.db.batch();
      await batch.put(`prices:${timestamp}`, prices);
      await batch.put("latest", { key: `prices:${timestamp}` });
      await batch.flush();

      this.logger.log(`Stored new prices at timestamp: ${timestamp}`);
    } catch (error) {
      this.logger.error("Failed to fetch and store prices", error);
      throw error;
    }
  }

  /**
   * Retrieves the latest stored crypto prices.
   * @returns {Promise<Object|null>}
   */
  async getLatestPrices() {
    try {
      const latestKeyData = await this.db.get("latest");
      if (!latestKeyData) return null;
      return await this.db.get(latestKeyData.value.key);
    } catch (error) {
      this.logger.error("Failed to retrieve latest prices", error);
      throw error;
    }
  }

  /**
   * Retrieves historical prices within a given time range.
   * @param {number} from - Start timestamp
   * @param {number} to - End timestamp
   * @returns {Promise<Array>}
   */
  async getHistoricalPrices(from, to) {
    try {
      const results = [];

      for await (const { key, value } of this.db.createReadStream({
        gte: `prices:${from}`,
        lte: `prices:${to}`,
      })) {
        const timestamp = parseInt(key.split(":")[1], 10);
        results.push({ timestamp, data: value });
      }

      return results;
    } catch (error) {
      this.logger.error("Failed to retrieve historical prices", error);
      throw error;
    }
  }
}

module.exports = PriceService;
