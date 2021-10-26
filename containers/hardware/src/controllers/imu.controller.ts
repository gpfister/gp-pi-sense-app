/**
 * gp-pi-sense-device-hardware
 *
 * @author Greg PFISTER
 * @since 0.0.1
 * @copyright (c) 2021, Greg PFISTER.
 * @license MIT
 */

import { EventEmitter } from 'events';
import { Logger } from 'log4js';
import { IMU } from 'nodeimu';

export class GPIMUController extends EventEmitter {
  private _logger: Logger;
  private _imu: IMU;

  constructor(logger: Logger) {
    super();

    this._logger = logger;

    this._imu = new IMU();
    const data = this._imu.getValueSync();
    console.log(data);

    this.emit('ready');
  }
}