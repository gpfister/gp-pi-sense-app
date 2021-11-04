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
import { AccessoryInformation } from "hap-nodejs/dist/lib/definitions";
import { Logger } from "log4js";

export class GPHomeKitController extends EventEmitter {
  private _accessory?: Accessory;
  private _logger: Logger;

  constructor(logger: Logger) {
    super();
    this._logger = logger;

    this.startAccessory();
  }

  private async startAccessory() {

    HAPStorage.setCustomStoragePath("/home/gpfister/Temp/gp-pi-sense-dev/homekit/data");
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
    currentTemperatureCharacteristic.on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
      callback(undefined, 21.1);
    });
    this._accessory.addService(temperatureService);

    const relativeHumidityService = new Service.HumiditySensor("Room relative humidity");
    const currentRelativeHumidityCharacteristic = relativeHumidityService.getCharacteristic(Characteristic.CurrentRelativeHumidity);
    currentRelativeHumidityCharacteristic.on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
      callback(undefined, 60);
    });
    this._accessory.addService(relativeHumidityService);

    this._accessory.publish({
      username: "17:51:07:F4:BC:8A",
      pincode: "678-90-876",
      port: 47128,
      category: Categories.SENSOR,
    });

    this.emit("ready");
  }
}