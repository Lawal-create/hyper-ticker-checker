const { env } = require("../internal/config");
const { ExchangesSchema, CryptosSchema } = require("./schema");
const BASE_URL = "https://api.coingecko.com/api/v3";

class CoinGeckoProvider {
  /**
   * @param {HttpClient} httpClient - Injected HTTP client instance
   */
  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Fetches top exchanges
   * @param {number} count - Number of exchanges to fetch
   * @returns {Promise<AxiosResponse<Exchange[]>>}
   */
  async fetchTopExchanges(count = 3) {
    const result = await this.httpClient.get(`${BASE_URL}/exchanges`, {
      params: {
        per_page: count,
        page: 1,
        x_cg_demo_api_key: env.coingecko_api_key,
      },
    });

    return ExchangesSchema.parse(result.data);
  }

  /**
   * Fetches top cryptocurrencies
   * @param {number} count - Number of cryptocurrencies to fetch
   * @param {string} target - Currency to compare against(against USD, since USDT is pegged to USD and coingecko currently supports mostly fiat currencies)
   * @returns {Promise<AxiosResponse<Crypto[]>>}
   */
  async fetchTopCryptos(count = 5, target = "usd") {
    const coins = await this.httpClient.get(`${BASE_URL}/coins/markets`, {
      params: {
        vs_currency: target,
        order: "market_cap_desc",
        per_page: count,
        page: 1,
        x_cg_demo_api_key: env.coingecko_api_key,
      },
    });

    return CryptosSchema.parse(coins.data);
  }
  /**
   * Fetches cryptocurrency by exchanges
   * @param {string} exchanges - List of Exchanges to fetch from
   * @param {string[]} crypto - cryptocurrency to fetch
   * @param {number} page - page of the response due to 100 ticker limit per page
   * @returns {Promise<AxiosResponse<ExchangeTicker>>}
   */
  async fetchCryptoByExchanges(exchanges, crypto, page = 1) {
    return await this.httpClient.get(`${BASE_URL}/coins/${crypto}/tickers`, {
      params: {
        exchange_ids: exchanges.join(","),
        x_cg_demo_api_key: env.coingecko_api_key,
        page,
      },
    });
  }
}

module.exports = CoinGeckoProvider;
