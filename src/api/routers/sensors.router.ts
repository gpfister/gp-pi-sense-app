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

import * as express from 'express';

import { GPSensorsController } from '../controllers';

export class GPSensorsRouter {
  static getRouter(dataFolder: string): any {
    const router = express.Router();

    router.options('/*');
    router.post('/', (req, res, next) => { const sensorsController = new GPSensorsController(dataFolder); sensorsController.postSensorData(req, res, next); });
    router.get('/', (req, res, next) => { const sensorsController = new GPSensorsController(dataFolder); return sensorsController.getLatest(req, res, next); });
    router.get('/unprocessed', (req, res, next) => { const sensorsController = new GPSensorsController(dataFolder); return sensorsController.getUnprocessed(req, res, next); });
    router.delete('/unprocessed', (req, res, next) => { const sensorsController = new GPSensorsController(dataFolder); return sensorsController.removeUnprocessedList(req, res, next); });
    router.delete('/unprocessed/:file', (req, res, next) => { const sensorsController = new GPSensorsController(dataFolder); return sensorsController.removeUnprocessed(req, res, next); });

    return router;
  }
}
