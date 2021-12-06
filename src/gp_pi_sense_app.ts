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

import * as fs from 'fs';
import * as log4js from 'log4js';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { GPAPI } from './api';
import { GPHardware } from './hardware';
import { GPHomekit } from './homekit';
import { GPMqttClient } from './mqtt_client';

class GPPISenseApp {
  static async start(logLevel: string, logFolder: string, dataFolder: string, exposeAPI: boolean, hardware: boolean, mqtt: boolean, homekit: boolean) {
    if (!logFolder || logFolder.length === 0) {
      log4js.configure({
        appenders: { main: { type: 'console' } },
        categories: { default: { appenders: ['main'], level: logLevel } }
      });
    } else {
      if (!fs.existsSync(logFolder)) { fs.mkdirSync(logFolder); }
      log4js.configure({
        appenders: { main: { type: 'file', filename: `${logFolder}/gp_pi_sense_app.log`, maxLogSize: 1024 * 1024, backup: 7, compress: true } },
        categories: { default: { appenders: ['main'], level: logLevel } }
      });
    }
    const logger = log4js.getLogger('main');

    try {
      await GPAPI.run(logger, dataFolder);
      if (mqtt) { await GPMqttClient.run(logger, dataFolder); }
      if (homekit) { await GPHomekit.run(logger, dataFolder); }
      if (hardware) { await GPHardware.run(logger); }
    }
    catch (error) {
      logger.fatal('[Main] Restarting ...');
      process.exit(-1);
    }
  }

  static async stop() {
  }
}

export const run = (process: NodeJS.Process) => {
  // Configure yargs
  // eslint-disable-next-line no-unused-expressions
  yargs(hideBin(process.argv))
    .usage('$0 <cmd> [args]')
    .command('start', 'Start daemon', (yargs) => {
      return yargs
        .option('exposeAPI', { type: 'boolean', description: 'Expose API server', default: false })
        .option('hardware', { type: 'boolean', description: 'Enable hardware', default: false })
        .option('mqtt', { type: 'boolean', description: 'Enable MQTT client', default: false })
        .option('homekit', { type: 'boolean', description: 'Enable Homekit', default: false })
        .option('dataFolder', { type: 'string', description: 'Data folder ', default: `${process.env.HOME}/data` })
        .option('logFolder', { type: 'string', description: 'Log folder (if empty, login on the console)' })
        .option('logLevel', { type: 'string', description: 'Log level (debug|info|warn|error|fatal)', default: 'info' });
    }, (argv) => {
      GPPISenseApp.start(argv.logLevel as string, argv.logFolder as string, argv.dataFolder as string, argv.exposeAPI, argv.hardware, argv.mqtt, argv.homekit);
    })
    .command('stop', 'Stop daemon', (yargs) => {
      return yargs;
    }, (argv) => {
      GPPISenseApp.stop();
    })
    .strict()
    .epilog('For more detail, visit https://github.com/gpfister/gp-pi-sense-app.\n\nThis is a free software (MIT License), enjoy !')
    .showHelpOnFail(true)
    .argv;
};
