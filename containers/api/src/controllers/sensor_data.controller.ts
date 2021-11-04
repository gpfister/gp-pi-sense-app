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

import express from "express";
import fs from "fs";
import { jsonParser } from "../helpers";

import { GPSensorData } from "../models/sensor_data.model";

/**
 * The controller for all queries related to this device info
 */
export class GPSensorDataController {
  /**
   * Get the latest data read
   * @param req The request
   * @param res The response
   * @param next The next handle (ignored)
   */
  static getLatest(req: express.Request, res: express.Response, next: express.RequestHandler) {
    const latestSensorDataFolder = `${process.env.GP_DATA_FOLDER_PATH}/sensor/latest`;
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

  /**
   * Get a subset of data, ranging from req.params.date1 to req.params.date2
   * @param req The request
   * @param res The response
   * @param next The next handle (ignored)
   */
  static getSubset(req: express.Request, res: express.Response, next: express.RequestHandler) {
    // Prepare output
    const sensor: GPSensorData = {
      temperatureFromHumidity: 19.1,
      temperatureFromPressure: 20.2,
      pressure: 990,
      humidity: 61,
      timestamp: new Date()
    };
    res.status(200).json([sensor, sensor, sensor]);
  }

  /**
   * Update this device configuration
   * @param req The request
   * @param res The response
   * @param next The next handle (ignored)
   */
  static postSensorData(req: express.Request, res: express.Response, next: express.RequestHandler) {
    const sensorDataFolder = `${process.env.GP_DATA_FOLDER_PATH}/sensor`;
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
    res.status(200).json({ status: 200, message: "Sensor data saved" });
  }
}
