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

import { GPSensorData } from '../models';

/**
 * Local API http controller
 */
export class GPLocalApiHttpController {
  private _baseUrl: string;
  private _logger: log4js.Logger;

  /**
   * Construct the local API http controller
   * @param baseUrl
   * @param logger
   */
  constructor(baseUrl: string, logger: log4js.Logger) {
    this._baseUrl = baseUrl;
    this._logger = logger;
  }

  // /**
  //  * Perform a GET query
  //  * @param query
  //  */
  // private async _get(query: string): Promise<axios.AxiosResponse> {
  //   this._logger.info(`[Local HTTP Controller] GET Query ${query}`);
  //   const response = await axios.default.get(query);
  //   this._logger.debug(`[Local HTTP Controller] GET Query ${query}: ${response.status} -> ${JSON.stringify(response.data)}`);
  //   return response;
  // }

  /**
   * Perform a POST query with a payload
   * @param query
   * @param payload
   */
  private async _post(query: string, payload: any): Promise<axios.AxiosResponse> {
    this._logger.info(`[Hardware / Local API HTTP Controller] POST Query ${query}`);
    const response = await axios.default.post(query, payload);
    this._logger.debug(`[Hardware / Local API HTTP Controller] POST Query ${query}: ${response.status} -> ${JSON.stringify(response.data)}`);
    return response;
  }

  // /**
  //  * Perform a PATCH query with a payload
  //  * @param query
  //  * @param payload
  //  */
  // private async _patch(query: string, payload: any): Promise<axios.AxiosResponse> {
  //   this._logger.info(`[Local HTTP Controller] PATCH Query ${query}: ${JSON.stringify(payload)}`);
  //   const response = await axios.default.patch(query, payload);
  //   this._logger.debug(`[Local HTTP Controller] PATCH Query ${query}: ${response.status} -> ${JSON.stringify(response.data)}`);
  //   return response;
  // }

  // /**
  //  * Perform a DELETE query
  //  * @param query
  //  */
  // private async _delete(query: string): Promise<axios.AxiosResponse> {
  //   this._logger.info(`[Local HTTP Controller] GET Query ${query}`);
  //   const response = await axios.default.delete(query);
  //   this._logger.debug(`[Local HTTP Controller] GET Query ${query}: ${response.status} -> ${JSON.stringify(response.data)}`);
  //   return response;
  // }

  /**
   * Post the latest sensor data
   * @param sensorData The sensor data
   */
  async postSensorData(sensorData: GPSensorData) {
    const query = `${this._baseUrl}/api/sensors`;
    await this._post(query, sensorData);
  }
}
