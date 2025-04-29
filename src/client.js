const container = require("./di/container");
const { TYPES } = require("./di/types");
const readline = require("readline");
const RPC = require("@hyperswarm/rpc");
const DHT = require("hyperdht");

let hyperDHT = null;
let hyperRPC = null;
let priceService = null;
let rpcPublicKey = null;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question) {
  return new Promise(resolve => rl.question(question, answer => resolve(answer.trim())));
}

async function initializeLocalDB() {
  if (!priceService) {
    priceService = container.get(TYPES.PriceService);
  }
}

async function initializeRPC() {
  if (!rpcPublicKey) {
    await promptForPublicKey();
  }

  if (!hyperDHT) {
    hyperDHT = new DHT();
    await hyperDHT.ready();
    hyperRPC = new RPC({ hyperDHT });
  }
}

async function promptForPublicKey() {
  const key = await prompt("\nEnter RPC Server Public Key: ");
  if (!key || key.length !== 64) {
    console.log("Invalid public key. It must be 64 hex characters.");
    return promptForPublicKey();
  }
  rpcPublicKey = key;
  console.log("Public key stored for this session.");
}

function showMenu() {
  console.log(`
Choose an action:
  1. Fetch and store latest prices (Local DB)
  2. Get latest stored prices (Local DB)
  3. Get historical prices (Local DB)
  4. Get latest prices via RPC
  5. Get historical prices via RPC
  6. Exit
`);
}

async function promptUser() {
  showMenu();
  const choice = await prompt("\nEnter your choice: ");

  try {
    switch (choice) {
      case "1":
        await fetchAndStorePrices();
        break;
      case "2":
        await getLatestPrices();
        break;
      case "3":
        await getHistoricalPrices();
        break;
      case "4":
        await getLatestPricesViaRPC();
        break;
      case "5":
        await getHistoricalPricesViaRPC();
        break;
      case "6":
        console.log("Exiting...");
        rl.close();
        if (hyperRPC) await hyperRPC.destroy();
        if (hyperDHT) await hyperDHT.destroy();
        process.exit(0);
      default:
        console.log("Invalid choice. Please try again.");
    }
  } catch (error) {
    console.error("An error occurred:", error.message);
  }

  promptUser();
}

async function fetchAndStorePrices() {
  await initializeLocalDB();
  await priceService.fetchAndStorePrices();
  console.log("Prices updated and stored successfully.");
}

async function getLatestPrices() {
  await initializeLocalDB();
  const result = await priceService.getLatestPrices();
  console.log("\nLatest Prices:\n", JSON.stringify(result, null, 2));
}

async function getHistoricalPrices() {
  await initializeLocalDB();
  const from = parseInt(await prompt("Enter start timestamp (ms): "), 10);
  const to = parseInt(await prompt("Enter end timestamp (ms): "), 10);

  if (isNaN(from) || isNaN(to) || from >= to) {
    console.log("Invalid timestamps. Please try again.");
    return;
  }

  const result = await priceService.getHistoricalPrices(from, to);
  console.log("\nHistorical Prices:\n", JSON.stringify(result, null, 2));
}

async function getLatestPricesViaRPC() {
  await initializeRPC();
  const client = hyperRPC.connect(Buffer.from(rpcPublicKey, "hex"));
  const response = await client.request("getLatestPrices");
  console.log("\nRPC Latest Prices:\n", JSON.stringify(JSON.parse(response.toString()), null, 2));
}

async function getHistoricalPricesViaRPC() {
  await initializeRPC();
  const from = parseInt(await prompt("Enter start timestamp (ms): "), 10);
  const to = parseInt(await prompt("Enter end timestamp (ms): "), 10);

  if (isNaN(from) || isNaN(to) || from >= to) {
    console.log("Invalid timestamps. Please try again.");
    return;
  }

  const client = hyperRPC.connect(Buffer.from(rpcPublicKey, "hex"));
  const payload = Buffer.from(JSON.stringify({ from, to }), "utf-8");
  const response = await client.request("getHistoricalPrices", payload);
  console.log("\nRPC Historical Prices:\n", JSON.stringify(JSON.parse(response.toString()), null, 2));
}

console.log("Cryptocurrency Price Service CLI Started");
promptUser();
