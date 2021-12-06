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

import * as fs from 'fs';
import * as log4js from 'log4js';
import { EventEmitter } from 'events';

import { GPHomekitController, GPLocalApiHttpController } from './controllers';

export class GPHomekit extends EventEmitter {
  private _logger: log4js.Logger;
  private _dataFolder: string;

  private _localApiHttpController: GPLocalApiHttpController;
  private _homekitController?: GPHomekitController;

  constructor(logger: log4js.Logger, dataFolder: string) {
    super();

    this._logger = logger;
    this._dataFolder = dataFolder;

    // Local API controller
    this._localApiHttpController = new GPLocalApiHttpController('http://localhost:8080', this._logger);
  }

  private async _checkRequirements() {
    let success = true;

    // Check the data folder
    if (this._dataFolder.length === 0) {
      this._logger.error('[Homekit] No data folder provided');
      success = false;
    } else {
      // Check the folder
      if (!fs.existsSync(this._dataFolder)) {
        if (fs.mkdirSync(this._dataFolder, { recursive: true })) {
          this._logger.info(`[Homekit] Created data folder: ${this._dataFolder}`);
        } else {
          this._logger.error(`[Homekit] Could not create data folder on path ${this._dataFolder}`);
          success = false;
        }
      } else {
        this._logger.info(`[Homekit] Found data folder: ${this._dataFolder}`);
      }
    }

    if (!success) throw Error('One of more requirements not met');
  }

  private async _startHomekit() {
    this._homekitController = new GPHomekitController(this._logger, this._localApiHttpController, this._dataFolder);
    this._homekitController.on('ready', async () => {
      this._logger.info('[Homekit] Homekit is ready');
    });
  }

  async start() {
    await this._checkRequirements();
    await this._startHomekit();
  }

  static async run(logger: log4js.Logger, dataFolder: string) {
    // Create the client
    const homekit = new GPHomekit(logger, `${dataFolder}/homekit`);

    // Start Homekit
    await homekit.start();
  }
}
