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

import express from "express";
import fs from "fs";

import { GPHomeKitCredentials } from "../models";

/**
 * The controller for all queries related to this device info
 */
export class GPHomeKitController {
  /**
   * Get the latest data read
   * @param req The request
   * @param res The response
   * @param next The next handle (ignored)
   */
  static getCredentials(req: express.Request, res: express.Response, next: express.RequestHandler) {
    const homekitDataFolder = `${process.env.GP_API_DATA_FOLDER_PATH}/homekit`;
    const homekitCredentialsFile = `${homekitDataFolder}/credentials.json`;

    // If the folder doens't exist, create it
    if (!fs.existsSync(homekitDataFolder)) fs.mkdirSync(homekitDataFolder);

    // If the credential file doens't exist, create it
    if (!fs.existsSync(homekitCredentialsFile)) {

      let username = '';
      for (let i = 0; i < 6; i++) {
        const rand = Math.random() * 256;
        username += (username.length > 0 ? ':' : '') + (rand < 16 ? '0' : '') + Math.floor(rand).toString(16);
      }

      let pincode = '';
      for (let i = 0; i < 8; i++) {
        const rand = Math.random() * 9;
        pincode += (pincode.length === 3 || pincode.length === 6 ? '-' : '') + Math.floor(rand).toString();
      }

      const credentials: GPHomeKitCredentials = {
        username: username,
        pincode: pincode
      };

      fs.writeFileSync(homekitCredentialsFile, JSON.stringify(credentials));
    }


    // Prepare output
    const credentials: GPHomeKitCredentials = JSON.parse(fs.readFileSync(homekitCredentialsFile).toString());
    res.status(200).json(credentials);
  }
}