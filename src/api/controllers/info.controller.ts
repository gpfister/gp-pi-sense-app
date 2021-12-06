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

import crypto from 'crypto';
import express from 'express';
import fs from 'fs';

import { GPInfo } from '../models';

export class GPInfoController {
  _dataFolder: string;

  constructor(dataFolder: string) { this._dataFolder = dataFolder; }

  getInfo(req: express.Request, res: express.Response, next: express.RequestHandler) {
    const infoDataFolder = `${this._dataFolder}/info`;
    const infoFile = `${infoDataFolder}/info.json`;

    // If the folder doens't exist, create it
    if (!fs.existsSync(infoDataFolder)) fs.mkdirSync(infoDataFolder);

    // If the credential file doens't exist, create it
    if (!fs.existsSync(infoFile)) {
      const uuid = crypto.randomUUID();
      const info: GPInfo = {
        appName: 'gp-pi-sense-app',
        deviceId: `GP_${uuid}`,
        deviceName: 'dev',
        hostname: uuid
      };
      if (!info.hostname.includes('-') && info.hostname.length > 7) {
        info.hostname = info.hostname.substr(0, 7);
      }
      fs.writeFileSync(infoFile, JSON.stringify(info));
    }

    // Prepare output
    const info: GPInfo = JSON.parse(fs.readFileSync(infoFile).toString());
    res.status(200).json(info);
  }
}
