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

import { Timestamp } from '@firebase/firestore';

const dateFormatWithoutMilliSecond = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const dateFormatWithMilliSecond = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

export function jsonParser(key: string, value: any): any {
  // Convert Firebase timestamps to dates
  if (typeof value === 'object' && !Array.isArray(value) && value !== null && '_seconds' in value && '_nanoseconds' in value) {
    return (new Timestamp(value._seconds, value._nanoseconds)).toDate();
  }

  // Convert ISO date strings to dates
  if (typeof value === 'string' && (dateFormatWithoutMilliSecond.test(value) || dateFormatWithMilliSecond)) {
    return new Date(value);
  }

  return value;
}