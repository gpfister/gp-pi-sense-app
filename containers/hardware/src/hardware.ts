/**
 * gp-pi-sense-device-hardware
 *
 * @author Greg PFISTER
 * @since 0.0.1
 * @copyright (c) 2021, Greg PFISTER.
 * @license MIT
 */

import * as dotenv from 'dotenv';
import { Logger, getLogger, configure } from 'log4js';
import { EventEmitter } from 'events';

import { GPLedMatrixController } from './controllers/led_matrix.controller';
import { GPSensorsController } from './controllers/sensors.controller';

class GPHardware extends EventEmitter {
  private _logger: Logger;

  private _ledMatrixController: GPLedMatrixController;
  private _sensorsController: GPSensorsController;

  private _isLedControllerReady = false
  private _areSensorsControllerReady = false

  constructor() {
    super();

    // Load the .env variables
    dotenv.config();

    // Configure the logger
    const logLevel = process.env.LOG_LEVEL || 'info';
    configure({
      appenders: { hardware: { type: 'console' } },
      categories: { default: { appenders: ['hardware'], level: logLevel } },
    });
    // log4js.configure({
    //   appenders: { http_client: { type: 'file', filename: 'client.log' } },
    //   categories: { default: { appenders: ['main'], level: logLevel } },
    // });
    this._logger = getLogger('hardware');

    // Setup the led matrix
    this._ledMatrixController = new GPLedMatrixController(this.logger);
    this._sensorsController = new GPSensorsController(this.logger);

    // Subscribe when ready
    this._ledMatrixController.on('ready', async () => {
      this._isLedControllerReady = true;
      if (this._isHardwareReady) this.emit('ready');
    });
    this._sensorsController.on('ready', async () => {
      this._areSensorsControllerReady = true;
      if (this._isHardwareReady) this.emit('ready');
    });
  }

  get logger(): Logger {
    return this._logger;
  }

  private get _isHardwareReady() {
    return this._isLedControllerReady && this._areSensorsControllerReady;
  }

  async start() {
    hardware.logger.info('[Main] Hardware initialization finished')
    setTimeout(() => { this._readSensorData() }, 0);
  }

  private async _readSensorData() {
    if (this._sensorsController) {
      const data = await this._sensorsController.readSensorData();

      this._logger.info(`[Main] temperature: ${Math.floor((data.temperatureFromPressure + data.temperatureFromHumidity) * 10 / 2) / 10}°c, pressure: ${data.pressure}hPa, humidity: ${data.humidity}%`);
      setTimeout(() => { this._readSensorData() }, 60 * 1000);
    }
  }
}

// Create the client
const hardware = new GPHardware();

// Start the client
hardware.on('ready', () => {
  hardware
    .start()
    .then(() => hardware.logger.info('[Main] Hardware loop started'))
    .catch((error) => hardware.logger.fatal(`[Main] Hardware failed with error ${error}`));
});