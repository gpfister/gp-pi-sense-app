/**
 * gp-pi-sense-device-hardware
 *
 * @author Greg PFISTER
 * @since 0.0.1
 * @copyright (c) 2021, Greg PFISTER.
 * @license MIT
*/

export type GPSensorData = {
  pressure: number,
  temperatureFromPressure: number,
  temperatureFromHumidity: number,
  humidity: number
};