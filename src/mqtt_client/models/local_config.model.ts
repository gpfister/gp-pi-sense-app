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

import { GPParameters } from './parameters.model';

type GPGcpMqttConfig = {
  provider: 'GCP';
  hostname: string;
  port: number;
  projectId: string;
  region: string;
  registryId: string;
}

type GPMosquittoMqttConfig = {
  provider: 'Mosquitto'
  hostname: string;
  port: number;
  protocol: string;
}

export type GPLocalConfig = {
  mqttConfig: GPGcpMqttConfig | GPMosquittoMqttConfig;
  parameters: GPParameters;
}
