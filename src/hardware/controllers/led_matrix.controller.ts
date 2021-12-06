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

import { EventEmitter } from 'events';
import { readdirSync, readFileSync, existsSync, openSync, writeSync, closeSync } from 'fs';
import { Logger } from 'log4js';
import { GPRGB } from '../models/rgb.modle';

const FB_BASE_DIR = '/sys/class/graphics';
const LED_MATRIX_REGS = [
  [0, 1, 2, 3, 4, 5, 6, 7],
  [8, 9, 10, 11, 12, 13, 14, 15],
  [16, 17, 18, 19, 20, 21, 22, 23],
  [24, 25, 26, 27, 28, 29, 30, 31],
  [32, 33, 34, 35, 36, 37, 38, 39],
  [40, 41, 42, 43, 44, 45, 46, 47],
  [48, 49, 50, 51, 52, 53, 54, 55],
  [56, 57, 58, 59, 60, 61, 62, 63]
];

const z: GPRGB = { r: 0, g: 0, b: 0 };
const w: GPRGB = { r: 255, g: 255, b: 255 };
const r: GPRGB = { r: 255, g: 0, b: 0 };
const g: GPRGB = { r: 0, g: 255, b: 0 };
const b: GPRGB = { r: 0, g: 0, b: 255 };
const c: GPRGB = { r: 0, g: 255, b: 255 };
const m: GPRGB = { r: 255, g: 0, b: 255 };
const y: GPRGB = { r: 255, g: 255, b: 0 };

const color = {
  z: z,
  w: w,
  r: r,
  g: g,
  b: b,
  c: c,
  m: m,
  y: y
};

export class GPLedMatrixController extends EventEmitter {
  private _logger: Logger;
  private _fb: string = '';
  private _colors: GPRGB[] = [
    color.z, color.z, color.z, color.z, color.z, color.z, color.z, color.z,
    color.z, color.z, color.z, color.z, color.z, color.z, color.z, color.z,
    color.z, color.z, color.z, color.z, color.z, color.z, color.z, color.z,
    color.z, color.z, color.z, color.z, color.z, color.z, color.z, color.z,
    color.z, color.z, color.z, color.z, color.z, color.z, color.z, color.z,
    color.z, color.z, color.z, color.z, color.z, color.z, color.z, color.z,
    color.z, color.z, color.z, color.z, color.z, color.z, color.z, color.z,
    color.z, color.z, color.z, color.z, color.z, color.z, color.z, color.z
  ];

  constructor(logger: Logger) {
    super();

    this._logger = logger;
    this.findFrameBufferDevice();
  }

  async findFrameBufferDevice() {
    const dirContent = readdirSync(FB_BASE_DIR);

    for (const file of dirContent) {
      if (file.startsWith('fb') && existsSync(`${FB_BASE_DIR}/${file}/name`)) {
        const nameFileContent = readFileSync(`${FB_BASE_DIR}/${file}/name`).toString('utf-8');
        if (nameFileContent.includes('RPi-Sense FB')) {
          this._fb = `/dev/${file}`;
          await this.setPixels([
            color.b, color.b, color.b, color.b, color.b, color.b, color.b, color.b,
            color.b, color.b, color.b, color.b, color.b, color.b, color.b, color.b,
            color.b, color.b, color.b, color.b, color.b, color.r, color.b, color.b,
            color.b, color.b, color.r, color.b, color.b, color.r, color.b, color.b,
            color.b, color.r, color.r, color.b, color.b, color.r, color.b, color.b,
            color.r, color.r, color.r, color.b, color.b, color.r, color.b, color.b,
            color.r, color.r, color.r, color.r, color.b, color.r, color.r, color.b,
            color.r, color.r, color.r, color.r, color.r, color.r, color.r, color.r
          ]);
          this.emit('ready');
          this._logger.info(`[Hardware / Led Matrix] Frame Buffer device found at ${this._fb}`);
          return;
        }
      }
    }

    // Reaching here means the frame buffer decice could not be found
    this._logger.error('[Hardware / Led Matrix] Frame Buffer device could not be found');
    this.emit('failedToFindFrameBufferDevice');
  }

  // Encodes list [R, G, B] into 16 bit RGB565
  private _pack(color: GPRGB): number {
    return (((color.r >> 3) & 0x1F) << 11) +
      (((color.g >> 2) & 0x3F) << 5) +
      ((color.b >> 3) & 0x1F);
  }

  async setPixel(x: number, y: number, color: GPRGB) {
    if (x < 0 || x > 7) throw new Error(`x = ${x} violates 0 <= x <= 7`);
    if (y < 0 || y > 7) throw new Error(`y = ${y} violates 0 <= y <= 7`);
    if (color.r < 0 || color.r > 255) throw new Error(`color.r = ${color.r} violates 0 <= color.r <= 255`);
    if (color.g < 0 || color.g > 255) throw new Error(`color.g = ${color.g} violates 0 <= color.g <= 255`);
    if (color.b < 0 || color.b > 255) throw new Error(`color.b = ${color.b} violates 0 <= color.b <= 255`);

    this._colors[x * 8 + y] = color;

    const fd = openSync(this._fb, 'w');
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const buf = Buffer.alloc(2);
        const n = this._pack({
          r: Math.random() * 255,
          g: Math.random() * 255,
          b: Math.random() * 255
        });
        buf.writeUInt16LE(n);
        writeSync(fd, buf, 0, buf.length, LED_MATRIX_REGS[i][j] * 2);
      }
    }
    closeSync(fd);
  }

  async setPixels(colors: GPRGB[]) {
    if (colors.length !== 64) throw new Error('All 64 leds must be set');
    for (const color of colors) {
      if (color.r < 0 || color.r > 255) throw new Error(`color.r = ${color.r} violates 0 <= color.r <= 255`);
      if (color.g < 0 || color.g > 255) throw new Error(`color.g = ${color.g} violates 0 <= color.g <= 255`);
      if (color.b < 0 || color.b > 255) throw new Error(`color.b = ${color.b} violates 0 <= color.b <= 255`);
    }

    this._colors = colors;

    const fd = openSync(this._fb, 'w');
    let i = 0;
    const buf = Buffer.alloc(128);
    for (const color of colors) {
      const n = this._pack(color);
      buf.writeUInt16LE(n, i);
      i += 2;
    }
    writeSync(fd, buf, 0, buf.length, 0);
    closeSync(fd);
  }

  async turnOff() {
    const colors = this._colors;
    await this.setPixels([
      color.z, color.z, color.z, color.z, color.z, color.z, color.z, color.z,
      color.z, color.z, color.z, color.z, color.z, color.z, color.z, color.z,
      color.z, color.z, color.z, color.z, color.z, color.z, color.z, color.z,
      color.z, color.z, color.z, color.z, color.z, color.z, color.z, color.z,
      color.z, color.z, color.z, color.z, color.z, color.z, color.z, color.z,
      color.z, color.z, color.z, color.z, color.z, color.z, color.z, color.z,
      color.z, color.z, color.z, color.z, color.z, color.z, color.z, color.z,
      color.z, color.z, color.z, color.z, color.z, color.z, color.z, color.z
    ]);
    this._colors = colors;
  }

  async turnOn() {
    await this.setPixels(this._colors);
  }
}
