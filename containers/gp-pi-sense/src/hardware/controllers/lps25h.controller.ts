/**
 * GP Pi Sense | A personal take on IoT and HomeKit
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

const LPS25H_ADDRESS = 0x5c;
const LPS25H_ID = 0xBD;

const LPS25H_REF_P_XL = 0x08;
const LPS25H_REF_P_XH = 0x09;
const LPS25H_WHO_AM_I = 0x0f;
const LPS25H_RES_CONF = 0x10;
const LPS25H_CTRL1 = 0x20;
const LPS25H_CTRL2 = 0x21;
const LPS25H_CTRL3 = 0x22;
const LPS25H_CTRL4 = 0x23;
const LPS25H_INT_CFG = 0x24;
const LPS25H_INT_SOURCE = 0x25;
const LPS25H_STATUS = 0x27;
const LPS25H_PRESS_OUT_XL = 0x28;
const LPS25H_PRESS_OUT_L = 0x29;
const LPS25H_PRESS_OUT_H = 0x2A;
const LPS25H_TEMP_OUT_L = 0x2B;
const LPS25H_TEMP_OUT_H = 0x2C;
const LPS25H_FIFO_CTRL = 0x2E;
const LPS25H_FIFO_STATUS = 0x2F;
const LPS25H_THS_P_L = 0x30;
const LPS25H_THS_P_H = 0x31;
const LPS25H_RPDS_L = 0x39;
const LPS25H_RPDS_H = 0x3A;

import { EventEmitter } from "events";
import { Logger } from "log4js";
import { PromisifiedBus, openPromisified, I2CBus } from 'i2c-bus';

import { wait, toBinary, toHex } from "../utils";
import { GPLPS25HData } from "../models/lps25h_data.model";

export class GPLPS25HController extends EventEmitter {
  private _logger: Logger;

  constructor(logger: Logger) {
    super();

    this._logger = logger;

    // Start the i2c bus
    openPromisified(1)
      .then(async (i2cBus) => {
        await this._start(i2cBus);
      })
      .catch((error) => {
        this._logger.error(`[Sensors/LPS25H] Initialization failed ${error}`);
        this.emit('failedToInit', error);
      });
  }

  private async _start(i2cBus: PromisifiedBus) {
    try {
      if (await this._isLPS25H(i2cBus)) {
        await i2cBus.writeByte(LPS25H_ADDRESS, LPS25H_CTRL1, 0xC4);
        await i2cBus.writeByte(LPS25H_ADDRESS, LPS25H_RES_CONF, 0x05);
        await i2cBus.writeByte(LPS25H_ADDRESS, LPS25H_FIFO_CTRL, 0xC0);
        await i2cBus.writeByte(LPS25H_ADDRESS, LPS25H_CTRL2, 0x40);

        this._logger.info(`[Sensors/LPS25H] Pressure sensor found at address ${toHex(LPS25H_ADDRESS)}`);
        this.emit('ready');
      } else {
        this._logger.error(`[Sensors/LPS25H] Sensor not found at address ${toHex(LPS25H_ADDRESS)}`);
        this.emit('notFound');
      }
    } catch (error) {
      this._logger.error(`[Sensors/LPS25H] Initialization failed ${error}`);
      this.emit('failedToInit', error);
    } finally {
      i2cBus.close();
    }
  }

  private async _isLPS25H(i2cBus: PromisifiedBus): Promise<boolean> {
    const id = await i2cBus.readByte(LPS25H_ADDRESS, LPS25H_WHO_AM_I);
    return id === LPS25H_ID;
  }

  private async _readPressure(i2cBus: PromisifiedBus): Promise<number> {
    const pressureOutXL = await i2cBus.readByte(LPS25H_ADDRESS, LPS25H_PRESS_OUT_XL);
    const pressureOutL = await i2cBus.readByte(LPS25H_ADDRESS, LPS25H_PRESS_OUT_L);
    const pressureOutH = await i2cBus.readByte(LPS25H_ADDRESS, LPS25H_PRESS_OUT_H);

    const pressure = (pressureOutH << 16 | pressureOutL << 8 | pressureOutXL) / 4096;
    this._logger.debug(`[Sensors/LPS25H] Pressure read: ${pressure}hpa (H/L/XL: ${toBinary(pressureOutH)}/${toBinary(pressureOutL)}/${toBinary(pressureOutXL)})`)
    return pressure;
  }

  private async _readTemperature(i2cBus: PromisifiedBus): Promise<number> {
    const temperatureOutL = await i2cBus.readByte(LPS25H_ADDRESS, LPS25H_TEMP_OUT_L);
    const temperatureOutH = await i2cBus.readByte(LPS25H_ADDRESS, LPS25H_TEMP_OUT_H);

    let temperature = (temperatureOutH << 8 | temperatureOutL);
    if (temperature > 32768) temperature -= 65536;
    temperature = temperature / 480 + 42.5;
    this._logger.debug(`[Sensors/LPS25H] Temperature (from pressure) read: ${temperature}°c (H/L: ${toBinary(temperatureOutH)}/${toBinary(temperatureOutL)})`)
    return temperature;
  }

  async readData(): Promise<GPLPS25HData> {
    const i2cBus = await openPromisified(1);

    const status = await i2cBus.readByte(LPS25H_ADDRESS, LPS25H_STATUS);

    let pressure: number = -100;
    let temperature: number = -100;

    if (status & 1) pressure = await this._readPressure(i2cBus);
    if (status & 2) temperature = await this._readTemperature(i2cBus);

    i2cBus.close();

    return { pressure: pressure, temperatureFromPressure: temperature };
  }
}