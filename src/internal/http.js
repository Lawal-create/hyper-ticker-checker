const axios = require("axios");
const { env } = require("./config");

class HttpClient {
  /**
   * @param {Logger} logger - Instance of Logger
   */
  constructor(logger) {
    this.logger = logger;
    this.client = axios.create({ timeout: env.timeout_period });

    // Request Interceptor - Log outgoing request
    this.client.interceptors.request.use(
      (req) => {
        this.logger.axiosRequest(req);
        return req;
      },
      (error) => {
        this.logger.axiosError(error);
        return Promise.reject(error);
      }
    );

    // Response Interceptor - Log responses
    this.client.interceptors.response.use(
      (res) => {
        this.logger.axiosResponse(res);
        return res;
      },
      (error) => {
        this.logger.axiosError(error);
        return Promise.reject(error);
      }
    );
  }

  getClient() {
    return this.client;
  }

  async request(config) {
    return this.client.request(config);
  }

  async get(url, config) {
    return this.client.get(url, config);
  }

  async post(url, data, config) {
    return this.client.post(url, data, config);
  }

  async put(url, data, config) {
    return this.client.put(url, data, config);
  }

  async delete(url, config) {
    return this.client.delete(url, config);
  }
}

module.exports = HttpClient;
