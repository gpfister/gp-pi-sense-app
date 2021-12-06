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
import { jsonParser } from '../helpers';

import { GPSensorData } from '../models';

export class GPSensorsController {
  _dataFolder: string;

  constructor(dataFolder: string) { this._dataFolder = dataFolder; }

  getLatest(req: express.Request, res: express.Response, next: express.RequestHandler) {
    const latestSensorDataFolder = `${this._dataFolder}/sensors/latest`;
    const latestSensorDataFile = `${latestSensorDataFolder}/latest.json`;

    // Check the gateway exists
    if (!fs.existsSync(latestSensorDataFolder) || !fs.existsSync(latestSensorDataFile)) {
      res.status(404).send();
      return;
    }

    // Prepare output
    const sensor: GPSensorData = JSON.parse(fs.readFileSync(latestSensorDataFile).toString());
    res.status(200).json(sensor);
  }

  getUnprocessed(req: express.Request, res: express.Response, next: express.RequestHandler) {
    const sensorDataFolder = `${this._dataFolder}/sensors`;
    const unprocessedSensorDataFolder = `${sensorDataFolder}/unprocessed`;

    const result = { data: [] as GPSensorData[], files: [] as string[] };

    // Check the gateway exists
    if (!fs.existsSync(unprocessedSensorDataFolder)) {
      res.status(200).send(result);
      return;
    }

    const files = fs.readdirSync(unprocessedSensorDataFolder);

    for (const file of files) {
      const sensor: GPSensorData = JSON.parse(fs.readFileSync(`${unprocessedSensorDataFolder}/${file}`).toString());
      result.data = [...result.data, sensor];
      result.files = [...result.files, file];
    }

    res.status(200).json(result);
  }

  removeUnprocessedList(req: express.Request, res: express.Response, next: express.RequestHandler) {
    const sensorDataFolder = `${this._dataFolder}/sensors`;
    const unprocessedSensorDataFolder = `${sensorDataFolder}/unprocessed`;

    // Parse the data
    const body = JSON.parse(JSON.stringify(req.body), jsonParser) as { files: string[] };

    // Check the gateway exists
    for (const file of body.files) {
      if (fs.existsSync(`${unprocessedSensorDataFolder}/${file}`)) {
        fs.rmSync(`${unprocessedSensorDataFolder}/${file}`);
      }
    }

    res.status(200).json({ status: 200, message: 'Unprocessed sensor data removed' });
  }

  removeUnprocessed(req: express.Request, res: express.Response, next: express.RequestHandler) {
    const sensorDataFolder = `${this._dataFolder}/sensors`;
    const unprocessedSensorDataFolder = `${sensorDataFolder}/unprocessed`;
    const unprocessedSensorDataFile = `${unprocessedSensorDataFolder}/${req.params.file}`;

    // Check if the file exists
    if (fs.existsSync(unprocessedSensorDataFile)) {
      fs.rmSync(unprocessedSensorDataFile);
    }

    res.status(200).json({ status: 200, message: 'Unprocessed sensor data removed' });
  }

  postSensorData(req: express.Request, res: express.Response, next: express.RequestHandler) {
    const sensorDataFolder = `${this._dataFolder}/sensors`;
    const latestSensorDataFolder = `${sensorDataFolder}/latest`;
    const latestSensorDataFile = `${latestSensorDataFolder}/latest.json`;
    const unprocessedSensorDataFolder = `${sensorDataFolder}/unprocessed`;

    // Check the folders exist
    if (!fs.existsSync(sensorDataFolder)) fs.mkdirSync(sensorDataFolder);
    if (!fs.existsSync(latestSensorDataFolder)) fs.mkdirSync(latestSensorDataFolder);
    if (!fs.existsSync(unprocessedSensorDataFolder)) fs.mkdirSync(unprocessedSensorDataFolder);

    // Parse the data
    const sensorData = JSON.parse(JSON.stringify(req.body), jsonParser) as GPSensorData;

    // Save the data
    fs.writeFileSync(latestSensorDataFile, JSON.stringify(sensorData));
    fs.writeFileSync(`${unprocessedSensorDataFolder}/${sensorData.timestamp.toISOString()}.json`, JSON.stringify(sensorData));
    res.status(200).json({ status: 200, message: 'Sensor data saved' });
  }
}
