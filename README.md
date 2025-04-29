
# **Tether Ticker(Crypto Price) Checker**


## **Overview**

**Tether Ticker(Crypto Price) Checker** is a decentralized cryptocurrency price tracking system built using **Hyperswarm RPC** and **Hypercore/Hyperbee**. It fetches real-time prices from **CoinGecko**, processes the data, and allows for both **on-demand querying** and **scheduled updates**.



## Minimum Requirements
- Node.js v22 or higher is required to run this project.
- By default, the `package.json` enforces this via the `engines` field:

  ```json
  "engines": {
    "node": ">=22.0.0"
  }
---

## **Technical Architecture**

### **Data Collection**

To gather price data for the **top 5 cryptocurrencies from the top 3 exchanges**, Ticker Checker:

1. **Fetch top 5 cryptocurrencies** from CoinGecko.
2. **Retrieves the top 3 exchanges** trading each coin in USDT(USD).
3. **Collects the latest price for each coin from each exchange.**.
4. **Calculates the average price** across the selected exchanges.

---

### **Data Preprocessing & Transformation**

To ensure **efficient and accurate storage**, we:

- **Store only the computed average price** and **exchanges contributing to the price**.
- **Filter out invalid prices** (e.g., missing, negative, or zero values).
- **Avoid duplicate storage** (e.g., store prices only if they change).
- **Ignore outliers** (prices significantly different from others are excluded).

---

### **Data Storage**

- The project uses **Hypercore/Hyperbee** for decentralized, append-only storage.
- It also supports **in-memory databases for testing**.

---

### **Scheduling & Automation**

- Prices are **fetched at interval** via `node-cron`.
- The process can also be triggered **on-demand** via CLI.

---

### **Data Exposure (RPC & CLI)**

#### **RPC Methods (via Hyperswarm RPC)**

- `getLatestPrices()`: Fetches the most recent stored prices.
- `getHistoricalPrices(from, to)`: Fetches prices within a given time range.

#### **CLI Interface (`src/client.js`)**

1️⃣ Fetch & store latest prices (Local DB).  
2️⃣ Get latest stored prices(Local DB).  
3️⃣ Get historical prices (Local DB).  
4️⃣ Get latest prices via RPC.  
5️⃣ Get historical prices via RPC.

#### **Command-Line Usage**

```sh
yarn client
```

If using **RPC**, enter the **server public key** when prompted.

---

## **How to Run**

### **Install Dependencies**

```sh
yarn install
```

### **Get a working .env and update with your Coingecko API key (and desired cron schedule - there is a default)**

```sh
cp .env.example e.nv
```

### **Start the RPC Server**

```sh
yarn start
```

The server will generate and print a **public key** for RPC connections.

### **Run the Client**

```sh
yarn client
```

Follow the on-screen instructions to query local or RPC data.

### **Run Linting and Formatting for codbase**

```sh
yarn format && yarn lint:fix
```

To format the codebase using eslint and prettier.

### **Run Tests**

```sh
yarn test
```

Tests use **Sinon.js** to mock CoinGecko API requests.

