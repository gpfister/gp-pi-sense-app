/**
 * GP Pi Sense | A personal take on IoT and HomeKit
 *
 * @author Greg PFISTER
 * @since v0.0.1
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

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { Logger, getLogger, configure } from 'log4js';
import { EventEmitter } from 'events';

import { GPHomeKitController, GPLocalApiHttpController } from "./controllers";

export class GPHomeKit extends EventEmitter {
  private _logger: Logger;

  private _localApiHttpController: GPLocalApiHttpController;
  private _homeKitController?: GPHomeKitController;

  constructor() {
    super();

    // Load the .env variables
    dotenv.config();

    // Configure the logger
    const logLevel = process.env.GP_LOG_LEVEL || 'info';
    configure({
      appenders: { homekit: { type: 'console' } },
      categories: { default: { appenders: ['homekit'], level: logLevel } },
    });
    // log4js.configure({
    //   appenders: { http_client: { type: 'file', filename: 'client.log' } },
    //   categories: { default: { appenders: ['main'], level: logLevel } },
    // });
    this._logger = getLogger('homekit');

    // Local API controller
    this._localApiHttpController = new GPLocalApiHttpController('http://localhost:8080', this.logger);
  }

  /**
   * Checks for requriements (files, ...)
   */
  private async _checkRequirements() {
    let success = true;

    // Check the environment varialble is set
    if (!process.env.GP_HOMEKIT_DATA_FOLDER_PATH) {
      this._logger.error(`Missing required GP_DATA_FOLDER_PATH environment variable`);
      success = false;
    } else {
      // Check the folder
      if (!fs.existsSync(process.env.GP_HOMEKIT_DATA_FOLDER_PATH)) {
        if (fs.mkdirSync(process.env.GP_HOMEKIT_DATA_FOLDER_PATH, { recursive: true })) {
          this._logger.info(`Created data folder: ${process.env.GP_HOMEKIT_DATA_FOLDER_PATH}`);
        } else {
          this._logger.error(`Data folder path not set (env: GP_DATA_FOLDER_PATH = "${process.env.GP_HOMEKIT_DATA_FOLDER_PATH}")`);
          success = false;
        }
      } else {
        this._logger.info(`Found data folder: ${process.env.GP_HOMEKIT_DATA_FOLDER_PATH}`);
      }
    }

    if (!success) throw Error("One of more requirements not met");
  }

  get logger(): Logger {
    return this._logger;
  }

  private async _startHomeKit() {
    this._homeKitController = new GPHomeKitController(this.logger, this._localApiHttpController, process.env.GP_HOMEKIT_DATA_FOLDER_PATH!);
    this._homeKitController.on('ready', async () => {
      this._logger.info('[Main] HomeKit is ready');
    });
  }

  async start() {
    await this._checkRequirements();
    await this._startHomeKit();
  }

  static async run() {
    // Create the client
    const homeKit = new GPHomeKit();

    // Start the client
    // homeKit.on('ready', () => {
    homeKit
      .start()
      .then(() => homeKit.logger.info('[Main] Main loop started'))
      .catch((error) => homeKit.logger.fatal(`[Main] HomeKit failed with error ${error}`));
    // });
  }
}

