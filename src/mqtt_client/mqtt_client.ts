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

import * as axios from 'axios';
import * as fs from 'fs';
import * as log4js from 'log4js';
import * as mqtt from 'mqtt';

import { GPInfo, GPMqttConfig, GPLocalConfig } from './models';
import { GPMosquittoMqttController, GPLocalApiHttpController, GPGcpMqttController } from './controllers';
import { GPTelemetry } from './models/telemetry.model';

export class GPMqttClient {
  private _nbFailures: number = 0;
  private _logger: log4js.Logger;
  private _dataFolder: string;
  private _privateKeyFile?: string;
  private _publicKeyFile?: string;

  private _localApiHttpController: GPLocalApiHttpController;
  private _mqttController?: GPGcpMqttController | GPMosquittoMqttController;

  private _localConfig?: GPLocalConfig;
  private _info?: GPInfo;

  private _autoReconnectGcpMqtt = true;

  private _pendingLocalConfigUpdateRequest?: NodeJS.Timeout;

  constructor(logger: log4js.Logger, dataFolder: string) {
    this._logger = logger;
    this._dataFolder = dataFolder;

    // Create the HTTP controller
    this._localApiHttpController = new GPLocalApiHttpController('http://localhost:8080', this._logger);
  }

  private async _checkRequirements() {
    let success = true;

    // const info = await this._localApiHttpController.getInfo();
    // if (info.deviceId === 'unset') {
    //   this._logger.error('[MQTT Client] Device UUID not set');
    //   success = false;
    // } else {
    //   this._logger.info(`[MQTT Client] Device UUID: ${info.deviceId}`);
    // }

    if (!this._info || this._info.deviceId === 'unset') {
      this._logger.error('[MQTT Client] Device UUID not set');
      success = false;
    }

    if (!this._localConfig) {
      this._logger.error('[MQTT Client] Missing local config');
      success = false;
    }

    // Check the data folder if connecting to GCP
    if (this._localConfig && this._localConfig.mqttConfig.provider === 'GCP') {
      if (this._dataFolder.length === 0) {
        this._logger.error('[MQTT Client] No data folder provided');
        success = false;
      } else {
        // Check the folder
        if (!fs.existsSync(this._dataFolder)) {
          if (fs.mkdirSync(this._dataFolder, { recursive: true })) {
            this._logger.info(`[MQTT Client] Created data folder: ${this._dataFolder}`);
          } else {
            this._logger.error(`[MQTT Client] Could not create data folder on path ${this._dataFolder}`);
            success = false;
          }
        } else {
          this._logger.info(`[MQTT Client] Found data folder: ${this._dataFolder}`);
        }

        if (success) {
          // Check the key subfolder
          const keyFolder = `${this._dataFolder}/keys`;
          if (!fs.existsSync(keyFolder)) {
            if (fs.mkdirSync(keyFolder, { recursive: true })) {
              this._logger.info(`[MQTT Client] Created key subfolder: ${keyFolder}`);
            } else {
              this._logger.error(`[MQTT Client] Key subfolder could not be created on path ${keyFolder}`);
              success = false;
            }
          } else {
            this._logger.info(`[MQTT Client] Found key subfolder: ${keyFolder}`);
          }

          if (success) {
            // Check private key has been generated
            this._privateKeyFile = `${keyFolder}/ec_private.pem`;
            if (!fs.existsSync(this._privateKeyFile)) {
              const privateKeyURL = `https://storage.googleapis.com/gp-iot-dev.appspot.com/public/certs/${this._info?.deviceId}/ec_private.pem`;
              if (!fs.existsSync(this._privateKeyFile)) {
                try {
                  const privateKey: axios.AxiosResponse = await axios.default.get(privateKeyURL);
                  if (privateKey.status === 200 && privateKey.data) {
                    this._logger.info(`[MQTT Client]Downloaded private key from URL ${privateKeyURL}`);
                    this._logger.debug(`[MQTT Client]Private key downloaded: ${privateKey}`);
                    fs.writeFileSync(this._privateKeyFile, privateKey.data);
                    if (fs.existsSync(this._privateKeyFile)) {
                      this._logger.info(`[MQTT Client] Private key written in file ${this._privateKeyFile}`);
                    } else {
                      this._logger.error(`[MQTT Client] Private key could not be written in file ${this._privateKeyFile}`);
                    }
                  } else {
                    this._logger.error(`[MQTT Client] Empty private key received from URL ${privateKeyURL}")`);
                    success = false;
                  }
                } catch (error) {
                  this._logger.error(`[MQTT Client] Could not download private key file from ${privateKeyURL}: ${error}")`);
                }
              } else {
                this._logger.info(`[MQTT Client] Found private key file: ${this._privateKeyFile}`);
              }
            }
            // Check public key has been generated
            this._publicKeyFile = `${keyFolder}/ec_public.pem`;
            if (!fs.existsSync(this._publicKeyFile)) {
              if (!fs.existsSync(this._publicKeyFile)) {
                const publicKeyURL = `https://storage.googleapis.com/gp-iot-dev.appspot.com/public/certs/${this._info?.deviceId}/ec_private.pem`;
                try {
                  const publicKey: axios.AxiosResponse = await axios.default.get(publicKeyURL);
                  if (publicKey.status === 200 && publicKey.data) {
                    this._logger.info(`[MQTT Client] Downloaded private key from URL ${publicKeyURL}`);
                    this._logger.debug(`[MQTT Client] Private key downloaded: ${publicKey}`);
                    fs.writeFileSync(this._publicKeyFile, publicKey.data);
                    if (fs.existsSync(this._publicKeyFile)) {
                      this._logger.info(`[MQTT Client] Private key written in file ${this._publicKeyFile}`);
                    } else {
                      this._logger.error(`[MQTT Client] Private key could not be written in file ${this._publicKeyFile}`);
                    }
                  } else {
                    this._logger.error(`[MQTT Client] Empty private key received from URL ${publicKeyURL}")`);
                    success = false;
                  }
                } catch (error) {
                  this._logger.error(`[MQTT Client] Could not download private key file from ${publicKeyURL}: ${error}")`);
                }
              } else {
                this._logger.info(`[MQTT Client] Found private key file: ${this._publicKeyFile}`);
              }
            }
          }
        }
      }
    }

    if (!success) throw Error('One of more requirements not met');
  }

  /**
   * Get the device information
   * @param next The next processing block
   */
  private async _getInfo(/* next?: Function */) {
    try {
      this._logger.info('[MQTT Client] Looking for device information');
      const info = await this._localApiHttpController.getInfo();
      this._nbFailures = 0;
      this._logger.info('[MQTT Client] Device information collected');
      this._logger.info(`[MQTT Client] Device name: ${info.deviceName}`);
      this._logger.info(`[MQTT Client] Device UUID: ${info.deviceId}`);
      this._logger.info(`[MQTT Client] Application name: ${info.appName}`);
      this._info = info;
      /* if (next) next(); */
    } catch (error) {
      this._nbFailures++;
      if (this._nbFailures < 10) {
        this._logger.error(`[MQTT Client] Failed to retrieve device information: ${error}. Retrying in 1 minute (${10 - this._nbFailures} attempt(s) left).`);
        setTimeout(() => this._getInfo(/* next */), 60 * 1000);
      } else {
        this._logger.fatal(`[MQTT Client] Failed to retrieve device information: ${error}. No more attempt... exiting`);
        process.exit(-1);
      }
    }
  }

  /**
   * Get the device config
   * @param next The next processing block
   */
  private async _getLocalConfig(/* next?: Function */) {
    try {
      this._logger.info('[MQTT Client] Looking for device configuration');
      const config = await this._localApiHttpController.getLocalConfig();
      this._localConfig = config;
      this._nbFailures = 0;
      this._logger.info('[MQTT Client] Device configuration received');
      // if (next) next();
    } catch (error) {
      this._nbFailures++;
      if (this._nbFailures < 10) {
        this._logger.error(`[MQTT Client] Failed to retrieve device configuration: ${error}. Retrying in 1 minute (${10 - this._nbFailures} attempt(s) left).`);
        setTimeout(() => this._getLocalConfig(/* next */), 60 * 1000);
      } else {
        this._logger.fatal(`[MQTT Client] Failed to retrieve device configuration: ${error}. No more attempt... exiting`);
        process.exit(-1);
      }
    }
  }

  /**
   * Start the MQTT Google Cloud Platform client
   * @param next The next processing block (after successful connection)
   */
  private async _startMqttClient(/* next?: Function */) {
    if (this._localConfig) {
      if (this._localConfig.mqttConfig.provider === 'GCP' && this._info && this._privateKeyFile) {
        this._mqttController = new GPGcpMqttController(
          this._localConfig.mqttConfig.hostname,
          this._localConfig.mqttConfig.port,
          this._localConfig.mqttConfig.projectId,
          this._localConfig.mqttConfig.region,
          this._localConfig.mqttConfig.registryId,
          this._privateKeyFile,
          this._info.deviceId,
          this._logger
        );
        this._mqttController.connect(
          (topic, message) => this._onMqttMessage(topic, message),
          (packet) => this._onMqttConnect(packet),
          () => this._onMqttClose(/* next */)
        );

        /* if (next) next(); */
      }

      if (this._localConfig.mqttConfig.provider === 'Mosquitto' && this._info) {
        this._mqttController = new GPMosquittoMqttController(
          this._localConfig.mqttConfig.hostname,
          this._localConfig.mqttConfig.port,
          this._localConfig.mqttConfig.protocol,
          this._info.deviceId,
          this._logger
        );
        if (this._mqttController) {
          this._mqttController.connect(
            (topic, message) => this._onMqttMessage(topic, message),
            (packet) => this._onMqttConnect(packet),
            () => this._onMqttClose(/* next */)
          );

          this._mqttController.on('telemetryPublished', (files: string[]) => {
            for (const file of files) {
              this._localApiHttpController.removeUnprocessedSensorData(file);
            }
          });

          // if (next) next();
        }
      }
    }
  }

  /**
   * Stop the MQTT Google Cloud Platform client
   */
  private async _stopMqttClient() {
    if (this._mqttController) {
      this._mqttController.disconnect();
      this._autoReconnectGcpMqtt = false;
    }
  }

  /**
   * On successful connection
   * @param packet The connect packet
   */
  private async _onMqttConnect(packet: mqtt.Packet) { }

  /**
   * On disconnection
   * @param next The next processing block upon a successful re-connection
   */
  private async _onMqttClose(/* next?: Function */) {
    if (this._autoReconnectGcpMqtt) {
      this._logger.info('[MQTT Client] Reconnecting in 1 minute...');
      setTimeout(() => this._startMqttClient(/* next */), 60 * 1000);
    }
  }

  /**
   * On message received
   * @param topic The topic the message was received on
   * @param message The message the received
   */
  private async _onMqttMessage(topic: string, message: string) {
    if (topic.endsWith('errors')) {
      // Nothing to be done
      return;
    }

    if (topic.endsWith('config')) {
      if (message && message.length > 0) {
        // Processing new configuration received
        const config: GPMqttConfig = JSON.parse(message);
        await this._processConfig(config);
      }
    }
  }

  /**
   * Process the configuration received
   * @param config The configuration to process
   */
  private async _processConfig(config: GPMqttConfig) {
    // Update local config
    if (this._localConfig) {
      if (JSON.stringify(this._localConfig.parameters) !== JSON.stringify(config.parameters)) {
        await this._updateLocalConfig({ mqttConfig: this._localConfig.mqttConfig, parameters: config.parameters });
        this._localConfig.parameters = config.parameters;
      }
    }
  }

  private async _updateLocalConfig(config: GPLocalConfig) {
    // Check that an old update request is not pending
    if (this._pendingLocalConfigUpdateRequest) {
      clearTimeout(this._pendingLocalConfigUpdateRequest);
      this._pendingLocalConfigUpdateRequest = undefined;
      this._logger.info('[MQTT Client] Old update request for local config cancelled');
    }

    // Add the device
    try {
      await this._localApiHttpController.updateLocalConfig(config);
      this._logger.info('[MQTT Client] Local config has been updated');
    } catch (error) {
      this._logger.error(`[MQTT Client] Unable to update local config: ${error}. Retrying in 1 minutes`);
      this._pendingLocalConfigUpdateRequest = setTimeout(async () => {
        this._pendingLocalConfigUpdateRequest = undefined;
        await this._updateLocalConfig(config);
      }, 60 * 1000);
    }
  }

  async publishTelemetery() {
    if (this._mqttController) {
      try {
        const unprocessedSensorData = await this._localApiHttpController.getUnprocessedSensorData();
        const telemetry: GPTelemetry = { data: unprocessedSensorData.data };
        await this._mqttController.publishTelemetry(telemetry, unprocessedSensorData.files);
      } catch (error) {
        this._logger.error(`[MQTT Client] Unable to push device telemetry: ${error}`);
      }
    }

    setTimeout(() => { this.publishTelemetery(); }, 5 * 60 * 1000);
  }

  async start() {
    // Get requirement
    await this._getInfo();
    await this._getLocalConfig();

    // Check requirements are met
    await this._checkRequirements();

    // Start the client core processing
    this._startMqttClient();

    // Start publishing telemetry
    this.publishTelemetery();
  }

  static async run(logger: log4js.Logger, dataFolder: string) {
    // Create the client
    const client = new GPMqttClient(logger, `${dataFolder}/mqtt`);

    // Start the client
    await client.start();
  }
}
