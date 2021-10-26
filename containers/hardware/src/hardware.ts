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
import { GPIMUController } from './controllers/imu.controller';

class GPHardware extends EventEmitter {
  private _logger: Logger;

  private _imuController: GPIMUController;
  private _ledMatrixController: GPLedMatrixController;

  constructor() {
    super();

    // Load the .env variables
    dotenv.config();

    // Configure the logger
    const logLevel = process.env.OSK_LOG_LEVEL ? process.env.OSK_LOG_LEVEL : 'info';
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
    this._ledMatrixController.on('ready', async () => {
    });

    this._imuController = new GPIMUController(this.logger);
    this._imuController.on('ready', async () => {

    });
    this.emit('ready');
  }

  get logger(): Logger {
    return this._logger;
  }

  async start() {

  }
}

// Create the client
const hardware = new GPHardware();

// Start the client
hardware.on('ready', () => {
  hardware
    .start()
    .then(() => hardware.logger.info('[Main] Hardware started'))
    .catch((error) => hardware.logger.fatal(`[Main] Hardware failed with error ${error}`));
});