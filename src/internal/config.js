const dotenv = require("dotenv");
const { z } = require("zod");
const mapKeys = require("lodash/mapKeys");
const { ValidatorError, validate } = require("./validator");

const trimmedString = z.string().trim();

const envSchema = z.object({
  coingecko_api_key: trimmedString,
  prices_job_schedule: trimmedString.default("0 * * * * *"),
  timeout_period: z.coerce.number().default(5000)
});

class IncompleteEnvError extends Error {
  constructor(error) {
    super(`Missing or invalid environment variables:\n${JSON.stringify(error.messages, null, 2)}`);
  }
}

/**
 * Load process environment and validate the keys needed.
 * Only environment variables defined in the schema will be kept.
 * @param {import('zod').ZodSchema} schema - schema to validate with
 */
function setupEnv(schema = envSchema) {
  dotenv.config();

  // Lowercase all environment variable keys
  const processedEnv = mapKeys(process.env, (_, key) => key.toLowerCase());

  try {
    return validate(processedEnv, schema);
  } catch (err) {
    if (err instanceof ValidatorError) {
      throw new IncompleteEnvError(err);
    }
    throw err;
  }
}

module.exports = {
  env: setupEnv()
};
