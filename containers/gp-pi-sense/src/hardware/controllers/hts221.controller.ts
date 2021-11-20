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

import { EventEmitter } from "events";
import { Logger } from "log4js";
import { PromisifiedBus, openPromisified } from 'i2c-bus';
import { GPHTS221Data } from "../models/hts221_data.model";
import { toBinary, toHex } from "../utils";

const HTS221_ADDRESS = 0x5f;
const HTS221_ID = 0xBC;

const HTS221_WHO_AM_I = 0x0F;
const HTS221_AV_CONF = 0x10;
const HTS221_CTRL1 = 0x20;
const HTS221_CTRL2 = 0x21;
const HTS221_CTRL3 = 0x22;
const HTS221_STATUS = 0x27;
const HTS221_HUMIDITY_OUT_L = 0x28;
const HTS221_HUMIDITY_OUT_H = 0x29;
const HTS221_TEMP_OUT_L = 0x2A;
const HTS221_TEMP_OUT_H = 0x2B;
const HTS221_H0_RH_X2 = 0x30;
const HTS221_H1_RH_X2 = 0x31;
const HTS221_T0_DEGC_X8 = 0x32;
const HTS221_T1_DEGC_X8 = 0x33;
const HTS221_T1_T0 = 0x35;
const HTS221_H0_T0_OUT_L = 0x36;
const HTS221_H0_T0_OUT_H = 0x37;
const HTS221_H1_T0_OUT_L = 0x3A;
const HTS221_H1_T0_OUT_H = 0x3B;
const HTS221_T0_OUT_L = 0x3C;
const HTS221_T0_OUT_H = 0x3D;
const HTS221_T1_OUT_L = 0x3E;
const HTS221_T1_OUT_H = 0x3F;

export class GPHTS221Controller extends EventEmitter {
  private _logger: Logger;
  private _temperatureM: number = 0;
  private _temperatureC: number = 0;
  private _humidityM: number = 0;
  private _humidityC: number = 0;

  constructor(logger: Logger) {
    super();

    this._logger = logger;

    // Start the i2c bus
    openPromisified(1).then(async (i2cBus) => {
      await this._start(i2cBus);
    });
  }

  private async _start(i2cBus: PromisifiedBus) {
    try {
      if (await this._isHTS221(i2cBus)) {

        i2cBus.writeByte(HTS221_ADDRESS, HTS221_AV_CONF, 0x3f);
        i2cBus.writeByte(HTS221_ADDRESS, HTS221_CTRL1, 0x87);

        const t0DegCx8L = await i2cBus.readByte(HTS221_ADDRESS, HTS221_T0_DEGC_X8);
        const t1DegCx8L = await i2cBus.readByte(HTS221_ADDRESS, HTS221_T1_DEGC_X8);
        const t1t0 = await i2cBus.readByte(HTS221_ADDRESS, HTS221_T1_T0);

        const t0DegCx8u16 = ((t1t0 & 0x03) << 8) | t0DegCx8L;
        const t1DegCx8u16 = ((t1t0 & 0x0C) << 6) | t1DegCx8L;

        const t0DegC = t0DegCx8u16 / 8;
        const t1DegC = t1DegCx8u16 / 8;

        const t0OutH = await i2cBus.readByte(HTS221_ADDRESS, HTS221_T0_OUT_H);
        const t0OutL = await i2cBus.readByte(HTS221_ADDRESS, HTS221_T0_OUT_L);
        const t0Out = t0OutH << 8 | t0OutL;
        const t1OutH = await i2cBus.readByte(HTS221_ADDRESS, HTS221_T1_OUT_H);
        const t1OutL = await i2cBus.readByte(HTS221_ADDRESS, HTS221_T1_OUT_L);
        const t1Out = t1OutH << 8 | t1OutL;

        const h0rhx2 = await i2cBus.readByte(HTS221_ADDRESS, HTS221_H0_RH_X2);
        const h0rh = h0rhx2 / 2;
        const h1rhx2 = await i2cBus.readByte(HTS221_ADDRESS, HTS221_H1_RH_X2);
        const h1rh = h1rhx2 / 2;

        const h0t0OutH = await i2cBus.readByte(HTS221_ADDRESS, HTS221_H0_T0_OUT_H);
        const h0t0OutL = await i2cBus.readByte(HTS221_ADDRESS, HTS221_H0_T0_OUT_L);
        const h0t0Out = h0t0OutH << 8 | h0t0OutL;
        const h1t0OutH = await i2cBus.readByte(HTS221_ADDRESS, HTS221_H1_T0_OUT_H);
        const h1t0OutL = await i2cBus.readByte(HTS221_ADDRESS, HTS221_H1_T0_OUT_L);
        const h1t0Out = h1t0OutH << 8 | h1t0OutL;

        this._temperatureM = (t1DegC - t0DegC) / (t1Out - t0Out);
        this._temperatureC = t0DegC - (this._temperatureM * t0Out);

        this._humidityM = (h1rh - h0rh) / (h1t0Out - h0t0Out);
        this._humidityC = h0rh - (this._humidityM * h0t0Out);

        this._logger.info(`[Sensors/HTS221] Humidity and temperature sensors found at address ${toHex(HTS221_ADDRESS)}`);
        this._logger.debug(`[Sensors/HTS221] Tempetarure calibration (t_read * M + C) M: ${this._temperatureM} C: ${this._temperatureC}`);
        this._logger.debug(`[Sensors/HTS221] Humidity calibration (h_read * M + C) M: ${this._humidityM} C: ${this._humidityC}`);
        this.emit('ready');
      } else {
        this._logger.error(`[Sensors/HTS221] Sensor not found at address ${toHex(HTS221_ADDRESS)}`);
        this.emit('notFound');
      }
    } catch (error) {
      this._logger.error(`[Sensors/LPS25H] Initialization failed ${error}`);
      this.emit('failedToInit', error);
    } finally {
      i2cBus.close();
    }
  }

  private async _isHTS221(i2cBus: PromisifiedBus): Promise<boolean> {
    const id = await i2cBus.readByte(HTS221_ADDRESS, HTS221_WHO_AM_I);
    return id === HTS221_ID;
  }

  private async _readHumidity(i2cBus: PromisifiedBus): Promise<number> {
    const humidityOutL = await i2cBus.readByte(HTS221_ADDRESS, HTS221_HUMIDITY_OUT_L);
    const humidityOutH = await i2cBus.readByte(HTS221_ADDRESS, HTS221_HUMIDITY_OUT_H);

    const humidity = (humidityOutH << 8 | humidityOutL) * this._humidityM + this._humidityC;
    this._logger.debug(`[Sensors/HTS221] Humidity read: ${humidity}% (H/L: ${toBinary(humidityOutH)}/${toBinary(humidityOutL)})`)
    return humidity;
  }

  private async _readTemperature(i2cBus: PromisifiedBus): Promise<number> {
    const temperatureOutL = await i2cBus.readByte(HTS221_ADDRESS, HTS221_TEMP_OUT_L);
    const temperatureOutH = await i2cBus.readByte(HTS221_ADDRESS, HTS221_TEMP_OUT_H);

    const temperature = (temperatureOutH << 8 | temperatureOutL) * this._temperatureM + this._temperatureC;
    this._logger.debug(`[Sensors/HTS221] Temperature (from humidity) read: ${temperature}°c (H/L: ${toBinary(temperatureOutH)}/${toBinary(temperatureOutL)})`)
    return temperature;
  }

  async readData(): Promise<GPHTS221Data> {
    const i2cBus = await openPromisified(1);

    const status = await i2cBus.readByte(HTS221_ADDRESS, HTS221_STATUS);

    let humidity: number = -100;
    let temperature: number = -100;

    if (status & 1) temperature = await this._readTemperature(i2cBus);
    if (status & 2) humidity = await this._readHumidity(i2cBus);

    i2cBus.close();

    return { temperatureFromHumidity: temperature, humidity: humidity };
  }

  get temperatureM() { return this._temperatureM; }
  get temperatureC() { return this._temperatureC; }
  get humidityM() { return this._humidityM; }
  get humidityC() { return this._humidityC; }
}