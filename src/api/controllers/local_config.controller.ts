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

import express from 'express';
import fs from 'fs';

import { GPLocalConfig } from '../models';

export class GPLocalConfigController {
  _dataFolder: string;

  constructor(dataFolder: string) { this._dataFolder = dataFolder; }

  getLocalConfig(req: express.Request, res: express.Response, next: express.RequestHandler) {
    const configFolder = `${this._dataFolder}/config`;
    const configFile = `${configFolder}/config.json`;

    // Check the folder exists
    if (!fs.existsSync(configFolder)) fs.mkdirSync(configFolder);

    // If config doens't exist, pass a new one
    if (!fs.existsSync(configFile)) {
      const newConfig: GPLocalConfig = {
        mqttConfig: {
          provider: 'Mosquitto',
          hostname: 'gp-iot-dev.local.gpf.pw',
          port: 1883,
          protocol: 'mqtt'
        },
        parameters: {
          telemetryRefreshInterval: 60 * 1000,
          stateRefreshInterval: 60 * 1000
        }
      };
      fs.writeFileSync(configFile, JSON.stringify(newConfig));
    }

    // Send config details
    const config: GPLocalConfig = JSON.parse(fs.readFileSync(configFile).toString());
    res.status(200).json(config);
  }

  updateLocalConfig(req: express.Request, res: express.Response, next: express.RequestHandler) {
    const configFolder = `${this._dataFolder}/config`;
    const configFile = `${configFolder}/config.json`;

    // Check the folder exists
    if (!fs.existsSync(configFolder)) fs.mkdirSync(configFolder);

    // Parse the data
    const config: GPLocalConfig = req.body;

    // If config doens't exist, pass a new one
    fs.writeFileSync(configFile, JSON.stringify(config));
    res.status(200).json({ message: 'Configuration updated' });
  }
}
