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

import * as dotenv from 'dotenv';
import { Logger, getLogger, configure } from 'log4js';
import { EventEmitter } from 'events';

import { GPLocalApiHttpController } from "./controllers";

class GPHomeKit extends EventEmitter {
  private _logger: Logger;

  private _localApiHttpController: GPLocalApiHttpController;

  constructor() {
    super();

    // Load the .env variables
    dotenv.config();

    // Configure the logger
    const logLevel = process.env.GP_LOG_LEVEL || 'info';
    configure({
      appenders: { hardware: { type: 'console' } },
      categories: { default: { appenders: ['hardware'], level: logLevel } },
    });
    // log4js.configure({
    //   appenders: { http_client: { type: 'file', filename: 'client.log' } },
    //   categories: { default: { appenders: ['main'], level: logLevel } },
    // });
    this._logger = getLogger('hardware');

    // Local API controller
    this._localApiHttpController = new GPLocalApiHttpController('http://localhost:8080', this.logger);
  }

  get logger(): Logger {
    return this._logger;
  }

  async start() {
    homeKit.logger.info('[Main] Hardware initialization finished');
  }
}

// Create the client
const homeKit = new GPHomeKit();

// Start the client
homeKit.on('ready', () => {
  homeKit
    .start()
    .then(() => homeKit.logger.info('[Main] Hardware loop started'))
    .catch((error) => homeKit.logger.fatal(`[Main] Hardware failed with error ${error}`));
});