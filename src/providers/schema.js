const { z } = require("zod");

const ExchangeSchema = z.object({
  id: z.string(),
  name: z.string(),
  year_established: z.number().int(),
  country: z.string(),
  description: z.string(),
  url: z.string().url(),
  image: z.string().url(),
  has_trading_incentive: z.boolean(),
});

const ExchangesSchema = z.array(ExchangeSchema);

const CryptoSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  image: z.string(),
  current_price: z.number(),
  market_cap: z.number(),
  market_cap_rank: z.number(),
  fully_diluted_valuation: z.number(),
  total_volume: z.number(),
  high_24h: z.number(),
  low_24h: z.number(),
  price_change_24h: z.number(),
  price_change_percentage_24h: z.number(),
  market_cap_change_24h: z.number(),
  market_cap_change_percentage_24h: z.number(),
  circulating_supply: z.number(),
  total_supply: z.number(),
  ath: z.number(),
});

const CryptosSchema = z.array(CryptoSchema);

module.exports = {
  ExchangeSchema,
  ExchangesSchema,
  CryptoSchema,
  CryptosSchema,
};
