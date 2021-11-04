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

export function toHex(byte: number): string {
  let hex = byte.toString(16);
  for (let i = hex.length; i < 2; i++) hex = "0" + hex;
  return `0x${hex}`;
}

export function toBinary(byte: number): string {
  let binary = byte.toString(2);
  for (let i = binary.length; i < 8; i++) binary = "0" + binary;
  return `0b${binary}`;
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
