/**
 * GP Pi Sense | A personal take on IoT and HomeKit
 *
 * @author Greg PFISTER
 * @since v0.1.0
 * @copyright (c) 2020, Greg PFISTER. MIT License
 * @license MIT
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import * as axios from "axios";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as dotenv from "dotenv";
import * as express from "express";
import * as fs from "fs";
import * as helmet from "helmet";
import * as log4js from "log4js";

import { GPSensorRouter } from "./routes";

/**
 * The server class
 */
class GPServer {
  private _logger: log4js.Logger;
  private _express?: express.Express;

  constructor() {
    // Load the .env variables
    dotenv.config();

    // Configure the logger
    const logLevel = process.env.GP_LOG_LEVEL ? process.env.GP_LOG_LEVEL : "info";
    log4js.configure({
      appenders: { api: { type: "console" } },
      categories: { default: { appenders: ["api"], level: logLevel } },
    });
    // log4js.configure({
    //   appenders: { http_client: { type: "file", filename: "client.log" } },
    //   categories: { default: { appenders: ["main"], level: logLevel } },
    // });
    this._logger = log4js.getLogger("api");
  }

  /**
   * Checks for requriements (files, ...)
   */
  private async _checkRequirements() {
    let success = true;

    // The device UUID
    if (!process.env.BALENA_DEVICE_UUID) {
      this._logger.error("Device UUID not set (env: BALENA_DEVICE_UUID)");
      success = false;
    } else {
      this._logger.info(`Balena device UUID: ${process.env.BALENA_DEVICE_UUID}`);
    }

    // The device name
    if (!process.env.BALENA_DEVICE_NAME_AT_INIT) {
      this._logger.error("Device name not set (env: BALENA_DEVICE_NAME_AT_INIT)");
      success = false;
    } else {
      this._logger.info(`Balene device name: ${process.env.BALENA_DEVICE_NAME_AT_INIT}`);
    }

    // The application name
    if (!process.env.BALENA_APP_NAME) {
      this._logger.error("Application name not set (env: BALENA_APP_NAME)");
      success = false;
    } else {
      this._logger.info(`Balena app name: ${process.env.BALENA_APP_NAME}`);
    }

    // Check the environment varialble is set
    if (!process.env.GP_DATA_FOLDER_PATH) {
      this._logger.error(`Missing required GP_DATA_FOLDER_PATH environment variable`);
      success = false;
    } else {
      // Check the folder
      if (!fs.existsSync(process.env.GP_DATA_FOLDER_PATH)) {
        if (fs.mkdirSync(process.env.GP_DATA_FOLDER_PATH, { recursive: true })) {
          this._logger.info(`Created data folder: ${process.env.GP_DATA_FOLDER_PATH}`);
        } else {
          this._logger.error(`Data folder path not set (env: GP_DATA_FOLDER_PATH = "${process.env.GP_DATA_FOLDER_PATH}")`);
          success = false;
        }
      } else {
        this._logger.info(`Found data folder: ${process.env.GP_DATA_FOLDER_PATH}`);
      }

      // // Check the config folder is here
      // const configFolder = `${process.env.GP_DATA_FOLDER_PATH}/config`;
      // if (!fs.existsSync(configFolder)) {
      //   if (fs.mkdirSync(configFolder, { recursive: true })) {
      //     this._logger.info(`Created config subfolder: ${configFolder}`);
      //   } else {
      //     this._logger.error(`Config subfolder could not be created on path ${configFolder}")`);
      //     success = false;
      //   }
      // } else {
      //   this._logger.info(`Found config subfolder: ${configFolder}`);
      // }

      // // Check the config file
      // const configFile = `${configFolder}/config.json`;
      // const configURL = "https://storage.googleapis.com/oskey-dev.appspot.com/public/config.json";
      // if (!fs.existsSync(configFile)) {
      //   try {
      //     const config: axios.AxiosResponse = await axios.default.get(configURL);
      //     if (config.status == 200 && config.data) {
      //       this._logger.info(`Downloaded config from URL ${configURL}`);
      //       this._logger.debug(`Config downloaded: ${config}`);
      //       fs.writeFileSync(configFile, JSON.stringify(config.data));
      //       if (fs.existsSync(configFile)) {
      //         this._logger.info(`Config written in file ${configFile}`);
      //       } else {
      //         this._logger.error(`Config could not be written in file ${configFile}`);
      //       }
      //     } else {
      //       this._logger.error(`Empty config received from URL ${configURL}")`);
      //       success = false;
      //     }
      //   } catch (error) {
      //     this._logger.error(`Could not download config file from ${configURL}: ${error}")`);
      //   }
      // } else {
      //   this._logger.info(`Found config file: ${configFile}`);
      // }
    }

    // // The public key folder path
    // if (!process.env.GP_CERTS_FOLDER_PATH || (process.env.GP_CERTS_FOLDER_PATH && !fs.existsSync(process.env.GP_CERTS_FOLDER_PATH))) {
    //   this._logger.error(`Public key folder path not set (env: GP_CERTS_FOLDER_PATH = "${process.env.GP_CERTS_FOLDER_PATH}")`);
    //   success = false;
    // } else {
    //   this._logger.info(`Found public key folder: ${process.env.GP_CERTS_FOLDER_PATH}`);
    // }

    // // The network interface (for advertisement)
    // if (!process.env.GP_NETWORK_INTERFACE) {
    //   this._logger.error("Network interface not set (env: GP_NETWORK_INTERFACE)");
    //   success = false;
    // } else {
    //   this._logger.info(`Network interface for service advertisement specified: ${process.env.GP_NETWORK_INTERFACE}`);
    // }

    if (!success) throw Error("One of more requirements not met");
  }

  /**
   * Run the server
   */
  async start() {
    // Check for requirements
    await this._checkRequirements();

    // Express server
    this._express = express.default();

    // Helmet (secure header flags)
    this._express.use(helmet.default());

    // Cors
    this._express.use(cors.default({ origin: true }));

    // // Body parser for content type application/x-www-form-urlencoded
    // this._express.use(bodyParser.urlencoded({ extended: true }));

    // Body parser for content type application/json
    this._express.use(bodyParser.json());

    // Log queries
    this._express.use(log4js.connectLogger(this._logger, { level: "auto", context: true }));
    this._express.use((req, res, next) => {
      if (req.body) {
        const json = JSON.stringify(req.body);
        if (json.length > 2) this._logger.debug(`Request body: ${json}`);
      }
      next();
    });

    // Routes
    // this._express.use("/api/accesses", GPAccessRouter.getRouter());
    // this._express.use("/api/door-info", GPDoorInfoRouter.getRouter());
    // this._express.use("/api/gateway", GPGatewayRouter.getRouter());
    // this._express.use("/api/info", GPInfoRouter.getRouter());
    // this._express.use("/api/local-config", GPLocalConfigRouter.getRouter());
    // this._express.use("/api/public-key", GPPublicKeyRouter.getRouter());
    this._express.use("/api/sensor", GPSensorRouter.getRouter());

    // Start listening
    this._express.listen(8080, () => {
      this._logger.info("Server running on port 8080");
    });
  }

  /**
   * Get the client logger
   */
  getLogger(): log4js.Logger {
    return this._logger;
  }
}

// Run the server
const server = new GPServer();

// Run the server
server.start().catch((error) => {
  server.getLogger().fatal(`Server failed with error: ${error}`);
});
