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
import {
  Accessory,
  Categories,
  Characteristic,
  CharacteristicEventTypes,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  HAPStorage,
  Service,
  uuid
} from "hap-nodejs";
import { Logger } from "log4js";
import { GPLocalApiHttpController } from ".";

export class GPHomeKitController extends EventEmitter {
  private _accessory?: Accessory;
  private _logger: Logger;
  private _localApiHttpController: GPLocalApiHttpController;
  private _dataFolderPath: string;

  constructor(logger: Logger, localApiHttpController: GPLocalApiHttpController, dataFolderPath: string) {
    super();
    this._logger = logger;
    this._localApiHttpController = localApiHttpController;
    this._dataFolderPath = dataFolderPath

    this.startAccessory().then(() => {
      this.emit('ready');
    });
  }

  private async startAccessory() {
    HAPStorage.setCustomStoragePath(this._dataFolderPath);
    const accessoryUuid = uuid.generate("org.gpfister.pi-sense");
    this._accessory = new Accessory("Pi Sense", accessoryUuid);

    const accessoryInformationService = this._accessory.getService(Service.AccessoryInformation);
    if (accessoryInformationService) {
      const firmwareRevisionCharacteristic = accessoryInformationService.getCharacteristic(Characteristic.FirmwareRevision);
      firmwareRevisionCharacteristic.on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        callback(undefined, '0.0.1');
      });
      const identityCharacteristic = accessoryInformationService.getCharacteristic(Characteristic.Identify);
      identityCharacteristic.on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback, context: any) => {
        callback();
      });
      const manufacturerCharacteristic = accessoryInformationService.getCharacteristic(Characteristic.Manufacturer);
      manufacturerCharacteristic.on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        callback(undefined, 'Greg PFISTER');
      });
      const modelCharacteristic = accessoryInformationService.getCharacteristic(Characteristic.Model);
      modelCharacteristic.on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        callback(undefined, 'RPi 4 4GB Pi Sense');
      });
      const nameCharacteristic = accessoryInformationService.getCharacteristic(Characteristic.Name);
      nameCharacteristic.on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        callback(undefined, 'Pi Sense');
      });
      const serialNumberCharacteristic = accessoryInformationService.getCharacteristic(Characteristic.SerialNumber);
      serialNumberCharacteristic.on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        callback(undefined, 'gp-pi-sense-dev');
      });
      const hardwareRevisionCharacteristic = accessoryInformationService.getCharacteristic(Characteristic.HardwareRevision);
      hardwareRevisionCharacteristic.on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        callback(undefined, '0.0.1-dev');
      });
    }

    const temperatureService = new Service.TemperatureSensor("Room temparature");
    const currentTemperatureCharacteristic = temperatureService.getCharacteristic(Characteristic.CurrentTemperature);
    currentTemperatureCharacteristic.on(CharacteristicEventTypes.GET, async (callback: CharacteristicGetCallback) => {
      try {
        const sensorData = await this._localApiHttpController.getLatestSensorData();
        callback(undefined, (sensorData.temperatureFromHumidity + sensorData.temperatureFromPressure) / 2);
      } catch (error) {
        this._logger.error(`[HomeKit] Unable to get latest sensor data: ${error}`);
        callback(undefined, 0);
      }
    });
    this._accessory.addService(temperatureService);

    const relativeHumidityService = new Service.HumiditySensor("Room relative humidity");
    const currentRelativeHumidityCharacteristic = relativeHumidityService.getCharacteristic(Characteristic.CurrentRelativeHumidity);
    currentRelativeHumidityCharacteristic.on(CharacteristicEventTypes.GET, async (callback: CharacteristicGetCallback) => {
      try {
        const sensorData = await this._localApiHttpController.getLatestSensorData();
        callback(undefined, sensorData.humidity);
      } catch (error) {
        this._logger.error(`[HomeKit] Unable to get latest sensor data: ${error}`);
        callback(undefined, 0);
      }
    });
    this._accessory.addService(relativeHumidityService);

    const credentials = await this._localApiHttpController.getHomeKitCredentials();

    //TODO: It should not be public
    this._logger.info(`[HomeKit] Username: ${credentials.username}`);
    this._logger.info(`[HomeKit] Pincode: ${credentials.pincode}`);

    this._accessory.publish({
      // username: "17:51:07:F4:BC:8A",
      username: credentials.username,
      // pincode: "678-90-876",
      pincode: credentials.pincode,
      port: 54321,
      category: Categories.SENSOR,
    });

    this._logger.info(`[HomeKit] Accessory '${this._accessory.displayName}' (uuid: ${this._accessory.UUID}) is ready`);
  }
}