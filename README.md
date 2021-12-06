[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

# gp-pi-sense-app (a.k.a gp-pi-sense-app Snap)

_!!! DISCLAIMER: This is a work in progress !!!_

A Homekit IoT project using a Raspberry Pi 3A+ and the Sense Hat to monitor at
home temperature, pressure, humidity... and display fun stuff on the led matrix.

## About

This project is only for the purpose of building and Rapsberry powered IoT
gadget, and deal with several aspects:

- Cloud integration (with supporting apps)
- Smart Home integration
- Understanding Raspberry Hat design

## About open source and commercial products

This project relies on a lot of Open Source tools, but also on commercial ones
(such as Google Cloud Platform). Choices for commercial products (like Visual
Studio Code) are personal preference, and are not a hard requirement.

It is planned to replace Google Cloud Platform for a full open source and self
hosted solution, but only when time will allow.

## The IoT Stack

The IoT stack is built around Ubuntu Core 20: gp-pi-sense-gadget,
gp-pi-sense-kernel, snapd and gp-pi-sense-app. This piece is the application
layer, built using Node (v16) Typescript (v4.5).

In the future, a monitoring/admin layer (gp-pi-sense-monitor) will be added,
with features like hardware monitoring (storage, memory, CPU, ...) and remote
administration (accessing logs, rebooting, ...).

## Development stack

- IDE: Visual Studio Code (remote development)
- Development platform: Raspberry Pi 4 4GB
- Node: v16.x, npm to the latest version
- Packager: snap, snapd and snapcraft
- Container/virtualisation: lxd (required to build the snap)

## Build and run locally

To build, simple clone and run `npm ci` to download all project dependencies.

```
git clone https://github.com/gpfister/gp-pi-sense-app.git
cd gp-pi-sense-app
npm ci
```

There are a few requirements/considerations:

- If you are testing on a regular Ubuntu or Raspbian Rasperry Pi (2, 3 or 4),
  the Pi Sense Hat firmware must be changed, otherwise it will either use the
  firmware or the DTBS overaly `rpi-sense.dtbo` will block the sensors. To do so
  refer to the project
  [gpfister/gp-pi-sense-hat](https://github.com/gpfister/gp-pi-sense-hat).
- Check if the `~/data` folder is not used, otherwise update the script `dev` in
  `package.json` to run the command
  `tsc-watch --onSuccess \"bin/gp_pi_sense_app.js start --hardware --mqtt --homekit --dataFolder <DATA_FOLDER_PATH>\" --sourceMap`.
  The same should be done for all others `dev:*` scripts.

You can either run in build and watch mode, meaning, it builds and runs,
monitoring for changes and rebuilding/rerunning when one is noticed) or in
regular mode.

To run in build and watch:

```
npm run dev
```

To build and run in regular mode

```
npm run build
bin/gp_pi_sense_app.js start --mqtt --homekit --hardware [--dataFolder <DATA_FOLDER_PATH>]
```

For more help, use:

- Overall usage: `npm run help` or `bin/gp_pi_sense_app.js --help`
- `start` command: `npm run help:start` or `bin/gp_pi_sense_app.js start --help`
- `stop` command: `npm run help:stop` or `bin/gp_pi_sense_app.js stop --help`

## Package and publish

### Building the snap and local installation

NB: To publish, you will have to change the snap name and register your own.
Please refer to [snapcraft help](https://snapcraft.io/docs).

Prior to building, the version in `package.json` and `snap/snapcraft.yaml` would
require some attention.

- For stable channel, make sure the number is incremented accordingly
- For edge, beta and candidate channels: in addtion to updating the version, add
  a build number (+x) after the version.

To build the `snap`, run (note that you are rebuiding, you would need to clean
first using `npm run clean:snap`):

```
npm run build:snap
```

Once the snap is created, it can be installed locally. Either `scp` it to a
target host running Ubuntu Core, or run it on the local system. Then:

```
[sudo] snap install <SNAP FILE> --dangerous [--devmode]
```

NB:

- `--devmode` is only required when running on a regular Ubuntu install.
- Unless running on a [gp-pi-sense](https://github.com/gpfister/gp-pi-sense-device)
  Ubuntu Core image, the Pi Sense Hat firmware should be updated. To do so
  refer to the project
  [gpfister/gp-pi-sense-hat](https://github.com/gpfister/gp-pi-sense-hat).

### Publishing the snap and store installation

## Contributions

See instructions [here](./CONTRIBUTING.md).

## License

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

See license [here](./LICENSE).
