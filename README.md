[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

# gp-pi-sense-balena

Code of the gp-pi-sense embedded app.

## About

The [gp-pi-sense project](https://gpfister.org/projects/gp-pi-sense) is my take on building a home weather stations, mixing a IoT and Homekit approach.

The [gp-pi-sense-device](https://github.com/gpfister/gp-pi-sense-device), built with Rapsberry Pi 3A+ and the RPi Sense Hat, are managed via Balena Cloud (https://www.balena.io/cloud) (monitoring, remote management, updates, ...) and send the data to a Firebase cloud app (https://gp-pi-sense.gpfister.org). They are also integrated with HomeKit ('Hey Siri ! What is the temperature in the living room ?`).

Using the [iOS](https://github.com/gpfister/gp-pi-sense-ios-app) and [Android](https://github.com/gpfister/gp-pi-sense-android-app), it is possible to display historic records, configure devices, ...

## Requirements (for building)

...

## Build and test

...

## Deploy to Balena Cloud

...

## Create your own fleet and configure for your own Firebase app

## Resources

- Relative humidity and temperature sensor: [HTS221 Manual](https://www.st.com/en/mems-and-sensors/hts221.html)
- Pressure sensor: [LPS25H Manual](https://www.st.com/en/mems-and-sensors/lps25h.html)

## Contributions

See instructions [here](./CONTRIBUTIONS.md).

## License

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

See license [here](./LICENSE).
