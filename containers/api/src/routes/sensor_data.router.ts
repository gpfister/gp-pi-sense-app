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

import * as express from "express";

import { GPSensorDataController } from "../controllers";

/**
 * Provides the router for all queries related to the device info
 */
export class GPSensorDataRouter {
  /**
   * Build the router for all queries related to the device info
   */
  static getRouter(): any {
    const router = express.Router();

    router.options("/*");
    router.post("/", GPSensorDataController.postSensorData);
    router.get("/", GPSensorDataController.getLatest);
    router.get("/$date1/$date2", GPSensorDataController.getSubset);

    return router;
  }
}

