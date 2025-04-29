const container = require("../di/container");
const { TYPES } = require("../di/types");
const { env } = require("../internal/config");
const cron = require("node-cron");
const cronstrue = require("cronstrue");

/**
 * Fetches and stores latest crypto prices using the given services.
 * @param {Object} services
 * @param {PriceService} services.priceService
 * @param {Logger} services.logger
 */
async function fetchAndStorePrices({ priceService, logger }) {
  try {
    logger.log("Running scheduled price update...");
    await priceService.fetchAndStorePrices();
    logger.log("Prices updated successfully.");
  } catch (error) {
    logger.error("Error updating prices:", error.message);
  }
}

/**
 * Starts the cron-based scheduler for periodic price fetching.
 */
function startScheduler() {
  const logger = container.get(TYPES.Logger);
  const priceService = container.get(TYPES.PriceService);

  const schedule = env.prices_job_schedule || "*/30 * * * * *";
  logger.log(`Starting price update scheduler (${cronstrue.toString(schedule)})...`);

  cron.schedule(schedule, async () => {
    await fetchAndStorePrices({ priceService, logger });
  });
}

// Execute directly for manual testing
if (require.main === module) {
  (async () => {
    const priceService = container.get(TYPES.PriceService);
    const logger = container.get(TYPES.Logger);

    logger.log("Manual execution mode: Fetching prices now...");
    await fetchAndStorePrices({ priceService, logger });

    process.exit(0);
  })();
}

module.exports = { startScheduler };
