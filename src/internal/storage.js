const Hypercore = require("hypercore");
const Hyperbee = require("hyperbee");

class HyperBeeStorage {
  constructor(storagePath = "./data/prices") {
    this.core = new Hypercore(storagePath, {
      valueEncoding: "json"
    });
    this.db = new Hyperbee(this.core, {
      keyEncoding: "utf-8",
      valueEncoding: "json"
    });
  }

  getDB() {
    return this.db;
  }
}

module.exports = { HyperBeeStorage };
