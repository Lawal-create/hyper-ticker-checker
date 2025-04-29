const Bunyan = require("bunyan");
const { ERROR, INFO } = Bunyan;

class Logger {
  constructor(config) {
    if (config instanceof Bunyan) {
      this.logger = config;
    } else {
      this.logger = new Bunyan({
        name: config.name,
        serializers: config.serializers,
        streams: [
          {
            stream: config.buffer || process.stdout,
            level: config.verbose === false ? ERROR : INFO,
            type: !!config.buffer ? "raw" : "stream"
          }
        ]
      });
    }
  }

  /**
   * Logs an axios request
   * @param req Axios Request
   */
  axiosRequest(req) {
    this.logger.info({ axios_req: req });
  }

  /**
   * Logs response to axios request
   * @param res Axios Response
   */
  axiosResponse(res) {
    this.logger.info({ axios_req: res.config, axios_res: res });
  }

  /**
   * Logs error response to axios request
   * @param err
   */
  axiosError(err) {
    if (err.response) {
      // Server responded with an error status
      this.logger.error({
        axios_req: err.response.config,
        axios_res: {
          status: err.response.status,
          headers: err.response.headers,
          data: err.response.data
        }
      });
    } else if (err.request) {
      // Request made but no response received (e.g., timeout, network error)
      this.logger.error({
        axios_req: err.config,
        axios_no_response: true
      });
    } else {
      // Something happened while setting up the request
      this.logger.error({ axios_setup_error: err.message });
    }
  }

  /**
   * Log data
   * @param metadata data to be loggwed
   */
  log(metadata) {
    if (typeof metadata === "string" && arguments.length === 2) {
      this.logger.info(arguments[1], metadata);
    } else {
      this.logger.info(metadata);
    }
  }

  /**
   * Log internal application error
   * @param err actual error being logged
   * @param extras anything else to log with the error
   */
  error(err, extras) {
    if (typeof extras === "string") {
      this.logger.error(err, extras);
    } else {
      this.logger.error({ err, ...extras });
    }
  }
}

module.exports = Logger;
