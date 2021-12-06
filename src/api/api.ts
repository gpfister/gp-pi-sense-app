/**
 * GP Pi Sense | A personal take on IoT and Homekit
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

import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as express from 'express';
import * as fs from 'fs';
import * as helmet from 'helmet';
import * as log4js from 'log4js';

import { GPSensorsRouter, GPHomekitRouter, GPInfoRouter, GPLocalConfigRouter } from './routers';

/**
 * The server class
 */
export class GPAPI {
  private _logger: log4js.Logger;
  private _dataFolder: string;
  private _express?: express.Express;

  constructor(logger: log4js.Logger, dataFolder: string) {
    this._logger = logger;
    this._dataFolder = dataFolder;
  }

  private async _checkRequirements() {
    let success = true;

    // Check the data folder
    if (this._dataFolder.length === 0) {
      this._logger.error('[API] No data folder provided');
      success = false;
    } else {
      // Check the folder
      if (!fs.existsSync(this._dataFolder)) {
        if (fs.mkdirSync(this._dataFolder, { recursive: true })) {
          this._logger.info(`[API] Created data folder: ${this._dataFolder}`);
        } else {
          this._logger.error(`[API] Could not create data folder on path ${this._dataFolder}`);
          success = false;
        }
      } else {
        this._logger.info(`[API] Found data folder: ${this._dataFolder}`);
      }
    }

    if (!success) throw Error('One of more requirements not met');
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

    // Body parser for content type application/json
    this._express.use(bodyParser.json());

    // Log queries
    // this._express.use(log4js.connectLogger(this._logger, { level: process.env.GP_LOG_LEVEL ? process.env.GP_LOG_LEVEL : 'info', context: true }));
    this._express.use((req, res, next) => {
      this._logger.info(`[API] ${req.method} Request ${req.url} from ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`);
      if (req.body) {
        const json = JSON.stringify(req.body);
        if (json.length > 2) this._logger.debug(`[API] Request body: ${json}`);
      }
      next();
    });

    // Routes
    this._express.use('/api/homekit', GPHomekitRouter.getRouter(this._dataFolder));
    this._express.use('/api/info', GPInfoRouter.getRouter(this._dataFolder));
    this._express.use('/api/local-config', GPLocalConfigRouter.getRouter(this._dataFolder));
    this._express.use('/api/sensors', GPSensorsRouter.getRouter(this._dataFolder));

    // Start listening
    this._express.listen(8080, () => {
      this._logger.info('[API] Server running on port 8080');
    });
  }

  static async run(logger: log4js.Logger, dataFolder: string) {
    // Run the server
    const api = new GPAPI(logger, `${dataFolder}/api`);

    // Run the server
    // try {
    await api.start();
    // } catch (error) {
    //   api.getLogger().fatal(`Server failed with error: ${error}`);
    //   throw error;
    // }
  }
}
