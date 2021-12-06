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

import * as log4js from 'log4js';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as mqtt from 'mqtt';
import { GPTelemetry } from '../models/telemetry.model';
import { EventEmitter } from 'stream';

export class GPGcpMqttController extends EventEmitter {
  private _logger: log4js.Logger;
  private _client?: mqtt.MqttClient;
  private _hostname: string;
  private _port: number;
  private _projectId: string;
  private _region: string;
  private _registryId: string;
  private _privateKeyFile: string;
  private _deviceId: string;

  private _jwt?: string;

  /**
   * Construct a MQTT client
   * @param hostname MQTT bridge hostname
   * @param port MQTT bridge port
   * @param projectId The GCP project id
   * @param region The Cloud IoT region
   * @param registeryId The Cloud IoT registry id
   * @param gatewayId This gateway id
   */
  constructor(hostname: string, port: number, projectId: string, region: string, registeryId: string, privateKeyFile: string, deviceId: string, logger: log4js.Logger) {
    super();

    this._hostname = hostname;
    this._port = port;
    this._projectId = projectId;
    this._region = region;
    this._registryId = registeryId;
    this._privateKeyFile = privateKeyFile;
    this._deviceId = deviceId;
    this._logger = logger;
  }

  /**
   * Connect to the MQTT server host
   * @param onConnect Callback when connected
   * @param onDisconnect Callback when connection is lost
   * @param onError Callback when an error occured
   */
  connect(onMessage: (topic: string, message: string) => void, onConnect?: mqtt.OnConnectCallback, onDisconnect?: Function, onError?: mqtt.OnErrorCallback) {
    const mqttClientId = `projects/${this._projectId}/locations/${this._region}/registries/${this._registryId}/devices/${this._deviceId}`;
    this._logger.debug(`[MQTT Client / MQTT GCP Controller] Connecting to ${this._hostname}:${this._port} with client id ${mqttClientId}`);

    // Create a client, and connect to the Google MQTT bridge.
    this._client = mqtt.connect({
      host: this._hostname,
      port: this._port,
      clientId: mqttClientId,
      username: 'unused',
      password: this._getJwt(),
      protocol: 'mqtts',
      qos: 1,
      secureProtocol: 'TLSv1_2_method',
      resubscribe: false
    });

    // On successful connection
    this._client.on('connect', (packet) => {
      this._logger.info(`Device ${this._deviceId} connected to ${this._hostname}:${this._port}`);

      // Subscribe to gateway topics (error and config)
      if (this._client) {
        this._client.subscribe(`/devices/${this._deviceId}/errors`, { qos: 0 });
        this._logger.info(`[MQTT Client / MQTT GCP Controller] Subscribed to /devices/${this._deviceId}/errors`);
        this._client.subscribe(`/devices/${this._deviceId}/config`, { qos: 1 });
        this._logger.info(`[MQTT Client / MQTT GCP Controller] Subscribed to /devices/${this._deviceId}/config`);
      }

      // If an onConnect callback was supplied
      if (onConnect) onConnect(packet);
    });

    // On errors
    this._client.on('error', (error) => {
      this._logger.error(`[MQTT Client / MQTT GCP Controller] Error ${error.name}: ${error.message}`);

      // If an onError callback was supplied
      if (onError) onError(error);
    });

    // On disconnected
    this._client.on('close', () => {
      this._logger.warn(`[MQTT Client / MQTT GCP Controller] Device ${this._deviceId} disconnected from ${this._hostname}:${this._port}`);

      if (this._client) this._client.end();

      if (onDisconnect) onDisconnect();
    });

    // // On disconnected
    // this._client.on("disconnect", (packet) => {
    //   this._logger.warn(`Gateway ${this._gatewayId} disconnected from ${this._hostname}:${this._port}`);
    //   if (onDisconnect) onDisconnect();
    // });

    // Handle incomming messages
    this._client.on('message', (topic, message) => {
      this._logger.debug(`Message received on topic ${topic}: "${message}"`);
      if (topic === `/devices/${this._deviceId}/errors`) {
        this._logger.error(`This device: Error received: ${message}`);
        onMessage(topic, message.toString());
        return;
      }

      if (topic === `/devices/${this._deviceId}/config`) {
        this._logger.info('[MQTT Client / MQTT GCP Controller] This device: Message received on config topic');
        onMessage(topic, message.toString());
      }
    });
  }

  disconnect() {
    if (this._client && this._client.connected) {
      this._client.end();
      this._logger.warn(`[MQTT Client / MQTT GCP Controller] Device ${this._deviceId} disconnected from ${this._hostname}:${this._port}`);
    }
  }

  /**
   *
   */
  private _getJwt(): string {
    // If a JWT token has already been issued
    if (this._jwt && this._jwt.length > 0) {
      const jwtDecoded = jwt.decode(this._jwt, { json: true });
      const now = Date.now() / 1000 - 60;

      // If there are any issue decoding the JWT or if it has expired (or will expire in less than 1 minute), remove it
      if (!jwtDecoded || (jwtDecoded && (!jwtDecoded.exp || (jwtDecoded.exp && jwtDecoded.exp < parseInt(now.toString()))))) {
        this._jwt = '';
      }
    }

    // Generate a new JWT if needed
    if (!this._jwt || this._jwt.length === 0) {
      this._jwt = this._createJwt(5 * 60);
      this._logger.debug(`[MQTT Client / MQTT GCP Controller] JWT generated ${this._jwt}`);
    }

    // Return the JWT
    return this._jwt;
  }

  /**
   * Create a ES256 JWT using the private key in <GP_MQTT_CLIENT_DATA_FOLDER_PATH>/keys/ec_private.pem file
   * @param sec Validity, in seconds
   */
  private _createJwt(sec: number) {
    const now = Date.now() / 1000;
    const token = {
      iat: parseInt(now.toString()),
      exp: parseInt(now.toString()) + sec, // 1 minute
      aud: this._projectId
    };
    const privateKey = fs.readFileSync(this._privateKeyFile);
    return jwt.sign(token, privateKey, { algorithm: 'ES256' });
  }

  // async publishState() {
  //   if (this._client) {
  //     if (this._client.connected) {
  //     }
  //   }
  // }

  async publishTelemetry(telemetry: GPTelemetry, files: string[]) {
    const topic = `/devices/${this._deviceId}/events`;
    if (this._client) {
      if (this._client.connected) {
        this._logger.info(`[MQTT Client / MQTT GCP Controller] Publishing device telemetry on topic ${topic}`);
        this._logger.debug(`[MQTT Client / MQTT GCP Controller] Publishing device telemetry ${JSON.stringify(telemetry)} on topic ${topic}`);
        // const buffer = Buffer.from(JSON.stringify(telemetry), 'binary').toString('base64');
        this._client.publish(topic, JSON.stringify(telemetry), { qos: 1, retain: true }, (error) => {
          if (!error) {
            this._logger.info('[MQTT Client / MQTT GCP Controller] Device telemetry published');
            this.emit('telemetryPublished', files);
          }
        });
      }
    }
  }

  // publishAsyncGateway(client: mqtt.Client, iatTime: number, tokenExpMins: number, messagesSent: number, numMessages: number, deviceId: string) {
  //   // If we have published enough messages or backed off too many times, stop.
  //   if (messagesSent > numMessages || this.backoffTime >= MAXIMUM_BACKOFF_TIME) {
  //     if (this.backoffTime >= MAXIMUM_BACKOFF_TIME) {
  //       console.error("Backoff time is too high. Giving up.");
  //     }
  //     if (messagesSent >= numMessages) {
  //       this.detachDevice(deviceId, client);
  //     }
  //     console.log("Closing connection to MQTT. Goodbye!");
  //     client.end();
  //     this.publishChainInProgress = false;
  //     return;
  //   }

  //   // Publish and schedule the next publish.
  //   this.publishChainInProgress = true;
  //   let publishDelayMs = 0;
  //   if (this.shouldBackoff) {
  //     publishDelayMs = 1000 * (this.backoffTime + Math.random());
  //     this.backoffTime *= 2;
  //     console.log(`Backing off for ${publishDelayMs}ms before publishing.`);
  //   }
  //   let mqttTopic = `/devices/${this.gatewayId}/state`;
  //   let payload = `${this.registryId}/${this.gatewayId}-connected-${new Date().getTime()}`;
  //   console.log(`Publishing message ${messagesSent}/${numMessages}`);
  //   if (messagesSent > 0) {
  //     mqttTopic = `/devices/${deviceId}/state`;
  //     payload = `${this.registryId}/${deviceId}-payload-${messagesSent}`;
  //   }

  //   setTimeout(() => {
  //     // Publish "payload" to the MQTT topic. qos=1 means at least once delivery.
  //     // Cloud IoT Core also supports qos=0 for at most once delivery.
  //     console.log(`Publishing message: ${payload} to ${mqttTopic}`);
  //     client.publish(mqttTopic, payload, { qos: 1 }, (err) => {
  //       if (!err) {
  //         this.shouldBackoff = false;
  //         this.backoffTime = MINIMUM_BACKOFF_TIME;
  //       }
  //     });

  //     const schedulePublishDelayMs = 5000; // messageType === 'events' ? 1000 : 2000;
  //     setTimeout(() => {
  //       const secsFromIssue = Date.now() / 1000 - iatTime;
  //       if (secsFromIssue > tokenExpMins * 60) {
  //         iatTime = Date.now() / 1000;
  //         console.log(`\tRefreshing token after ${secsFromIssue} seconds.`);

  //         client.end();
  //         const jwt = this.createJwt();
  //         client = mqtt.connect(jwt);
  //       }
  //       this.publishAsyncGateway(client, iatTime, tokenExpMins, messagesSent + 1, numMessages, deviceId);
  //     }, schedulePublishDelayMs);
  //   }, publishDelayMs);
  // }

  // // Listen for configuration messages on a gateway and bound device.
  // listenForConfigMessages() {
  //   // Handle incomming messages
  //   if (this._client) {
  //     this._client.on('message', (topic, message) => {
  //       if (topic === `/devices/${this._deviceId}/errors`) {
  //         this._logger.debug(`Message received on error topic: ${message}`);
  //       }
  //       if (topic === `/devices/${this._deviceId}/config`) {
  //         try {
  //           this._logger.debug(`Message received on config topic: ${message}`);
  //           const config: GPMqttConfig = JSON.parse(message.toString());
  //         } catch (error) {
  //           this._logger.error(`Received message in topic ${topic} cannot be parsed`);
  //         }
  //       }
  //     });
  //   }
  // }

  // // Listen for error messages on a gateway.
  // listenForErrorMessages(deviceId: string, clientDuration: number) {
  //   // [START iot_listen_for_error_messages]
  //   // const deviceId = `myDevice`;
  //   // const gatewayId = `mygateway`;
  //   // const registryId = `myRegistry`;
  //   // const projectId = `my-project-123`;
  //   // const region = `us-central1`;
  //   // const algorithm = `RS256`;
  //   // const privateKeyFile = `./rsa_private.pem`;
  //   // const mqttBridgeHostname = `mqtt.googleapis.com`;
  //   // const mqttBridgePort = 8883;
  //   // const clientDuration = 60000;

  //   const mqttClientId = `projects/${this._projectId}/locations/${this._region}/registries/${this._registryId}/devices/${this._gatewayId}`;
  //   console.log(mqttClientId);
  //   const connectionArgs = {
  //     host: this._hostname,
  //     port: this._port,
  //     clientId: mqttClientId,
  //     username: "unused",
  //     password: this.createJwt(),
  //     protocol: "mqtts",
  //     qos: 1,
  //     secureProtocol: "TLSv1_2_method",
  //   };

  //   // Create a client, and connect to the Google MQTT bridge.
  //   const client = mqtt.connect(connectionArgs);

  //   // On connect event
  //   client.on("connect", (success) => {
  //     if (!success) {
  //       console.log("Client not connected...");
  //     } else {
  //       setTimeout(() => {
  //         // Subscribe to gateway error topic.
  //         client.subscribe(`/devices/${this._gatewayId}/errors`, { qos: 0 });

  //         this._attachDevice(deviceId, client);

  //         setTimeout(() => {
  //           console.log("Closing connection to MQTT. Goodbye!");
  //           client.end(true);
  //         }, clientDuration); // Safely detach device and close connection.
  //       }, 5000);
  //     }
  //   });

  //   // On close event
  //   client.on("close", () => {
  //     console.log("Connection closed");
  //     this._shouldBackoff = true;
  //   });

  //   // On error event
  //   client.on("error", (err) => {
  //     console.log("error", err);
  //   });

  //   // On message event
  //   client.on("message", (topic, message) => {
  //     const decodedMessage = Buffer.from(message.toString(), "base64").toString("ascii");

  //     console.log(`message received on error topic ${topic}: ${decodedMessage}`);
  //   });

  //   client.on("packetsend", () => {
  //     // Note: logging packet send is very verbose
  //   });
  //   // [END iot_listen_for_error_messages]
  // }

  // start(messageType: string, numMessages: number) {
  //   // The mqttClientId is a unique string that identifies this device. For Google
  //   // Cloud IoT Core, it must be in the format below.
  //   const mqttClientId = `projects/${this._projectId}/locations/${this._region}/registries/${this._registryId}/devices/${this._gatewayId}`;

  //   // With Google Cloud IoT Core, the username field is ignored, however it must be
  //   // non-empty. The password field is used to transmit a JWT to authorize the
  //   // device. The "mqtts" protocol causes the library to connect using SSL, which
  //   // is required for Cloud IoT Core.
  //   const connectionArgs = {
  //     host: this._hostname,
  //     port: this._port,
  //     clientId: mqttClientId,
  //     username: "unused",
  //     password: this.createJwt(),
  //     protocol: "mqtts",
  //     secureProtocol: "TLSv1_2_method",
  //   };

  //   // Create a client, and connect to the Google MQTT bridge.
  //   const iatTime = Date.now() / 1000;
  //   const client = mqtt.connect(connectionArgs);

  //   // Subscribe to the /devices/{device-id}/config topic to receive config updates.
  //   // Config updates are recommended to use QoS 1 (at least once delivery)
  //   client.subscribe(`/devices/${this._gatewayId}/config`, { qos: 1 });
  //   this._boundDevices.forEach((boundDevice) => {
  //     client.subscribe(`/devices/${boundDevice.uuid}/config`, { qos: 1 });
  //   });

  //   // Subscribe to the /devices/{device-id}/commands/# topic to receive all
  //   // commands or to the /devices/{device-id}/commands/<subfolder> to just receive
  //   // messages published to a specific commands folder; we recommend you use
  //   // QoS 0 (at most once delivery)
  //   client.subscribe(`/devices/${this._gatewayId}/commands/#`, { qos: 0 });
  //   this._boundDevices.forEach((boundDevice) => {
  //     client.subscribe(`/devices/${boundDevice.uuid}/commands/#`, { qos: 0 });
  //   });

  //   // The MQTT topic that this device will publish data to. The MQTT topic name is
  //   // required to be in the format below. The topic name must end in 'state' to
  //   // publish state and 'events' to publish telemetry. Note that this is not the
  //   // same as the device registry's Cloud Pub/Sub topic.
  //   const mqttTopic = `/devices/${this._gatewayId}/${messageType}`;

  //   client.on("connect", (success) => {
  //     console.log("connect");
  //     if (!success) {
  //       console.log("Client not connected...");
  //     } else if (!this._publishChainInProgress) {
  //
  //       // this.publishAsync(`/devices/${this.gatewayId}/${messageType}`, client, iatTime, 1, numMessages, connectionArgs);
  //       // this.boundDevices.forEach((boundDevice) => {
  //       //   this.publishAsyncGateway(client, iatTime, 1, numMessages, boundDevice.uuid);
  //       // });
  //     }
  //   });

  //   client.on("close", () => {
  //     console.log("close");
  //     this._shouldBackoff = true;
  //   });

  //   client.on("error", (err) => {
  //     console.log("error", err);
  //   });

  //   client.on("message", (topic, message) => {
  //     let messageStr = "Message received: ";
  //     if (topic === `/devices/${this._gatewayId}/config`) {
  //       messageStr = "Config message received: ";
  //     } else if (topic.startsWith(`/devices/${this._gatewayId}/commands`)) {
  //       messageStr = "Command message received: ";
  //     }

  //     messageStr += Buffer.from(message.toString(), "base64").toString();
  //     console.log(messageStr);
  //   });

  //   client.on("packetsend", () => {
  //     // Note: logging packet send is very verbose
  //   });

  //   client.on("packetReceived", () => {
  //     // Note: logging packet send is very verbose
  //   });

  //   // Once all of the messages have been published, the connection to Google Cloud
  //   // IoT will be closed and the process will exit. See the publishAsync method.
  //   // [END iot_mqtt_run]
  // }
}
