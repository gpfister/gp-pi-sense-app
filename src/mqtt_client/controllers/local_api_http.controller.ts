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
import * as log4js from 'log4js';

import { GPLocalConfig, GPInfo } from '../models';
import { GPUnprocessedSensorData } from '../models/unprocessed_sensor_data.model';

export class GPLocalApiHttpController {
  private _baseUrl: string;
  private _logger: log4js.Logger;

  /**
   *
   * @param baseUrl
   * @param logger
   */
  constructor(baseUrl: string, logger: log4js.Logger) {
    this._baseUrl = baseUrl;
    this._logger = logger;
  }

  /**
   *
   * @param query
   */
  private async _get(query: string): Promise<axios.AxiosResponse> {
    this._logger.info(`[MQTT Client / Local HTTP Controller] GET Query ${query}`);
    const response = await axios.default.get(query);
    this._logger.debug(`[MQTT Client / Local HTTP Controller] GET Query ${query} Response: ${response.status} -> ${JSON.stringify(response.data)}`);
    return response;
  }

  /**
   *
   * @param query
   * @param payload
   */
  private async _post(query: string, payload: any): Promise<axios.AxiosResponse> {
    this._logger.info(`[MQTT Client / Local HTTP Controller] POST Query ${query}`);
    const response = await axios.default.post(query, payload);
    this._logger.debug(`[MQTT Client / Local HTTP Controller] POST Query ${query} Payload: ${JSON.stringify(payload)}`);
    this._logger.debug(`[MQTT Client / Local HTTP Controller] POST Query ${query} Response: ${response.status} -> ${JSON.stringify(response.data)}`);
    return response;
  }

  /**
   *
   * @param query
   * @param payload
   */
  private async _patch(query: string, payload: any): Promise<axios.AxiosResponse> {
    this._logger.info(`[MQTT Client / Local HTTP Controller] PATCH Query ${query}`);
    const response = await axios.default.patch(query, payload);
    this._logger.debug(`[MQTT Client / Local HTTP Controller] PATCH Query ${query} Payload: ${JSON.stringify(payload)}`);
    this._logger.debug(`[MQTT Client / Local HTTP Controller] PATCH Query ${query} Response: ${response.status} -> ${JSON.stringify(response.data)}`);
    return response;
  }

  /**
   *
   * @param query
   */
  private async _delete(query: string): Promise<axios.AxiosResponse> {
    this._logger.info(`[MQTT Client / Local HTTP Controller] DELETE Query ${query}`);
    const response = await axios.default.delete(query);
    this._logger.debug(`[MQTT Client / Local HTTP Controller] DELETE Query ${query} Response: ${response.status} -> ${JSON.stringify(response.data)}`);
    return response;
  }

  /**
   *
   */
  async getLocalConfig(): Promise<GPLocalConfig> {
    const query = `${this._baseUrl}/api/local-config`;
    const response = await this._get(query);
    const data: GPLocalConfig = response.data;
    return data;
  }

  /**
   * Get the device configuration
   * @param config
   */
  async updateLocalConfig(config: GPLocalConfig) {
    const query = `${this._baseUrl}/api/local-config`;
    await this._patch(query, config);
  }

  /**
   * Get the device information
   */
  async getInfo(): Promise<GPInfo> {
    const query = `${this._baseUrl}/api/info`;
    const response = await this._get(query);
    const data: GPInfo = response.data;
    return data;
  }

  async getUnprocessedSensorData(): Promise<GPUnprocessedSensorData> {
    const query = `${this._baseUrl}/api/sensors/unprocessed`;
    const response = await this._get(query);
    const data: GPUnprocessedSensorData = response.data;
    return data;
  }

  async removeUnprocessedSensorData(file: string) {
    const query = `${this._baseUrl}/api/sensors/unprocessed/${file}`;
    await this._delete(query);
  }
}
