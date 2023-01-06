import {
  CharacteristicGetHandler,
  CharacteristicValue,
  Nullable
} from 'homebridge';
import { AirQuality } from '../api/VeSyncFan';

import { AccessoryThisType } from '../VeSyncAccessory';

const characteristic: {
  get: CharacteristicGetHandler;
} & AccessoryThisType = {
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    if (!this.device.deviceType.hasAirQuality) {
      return this.HomeAirQuality.UNKNOWN;
    }

    await this.device.updateInfo();

    switch (this.device.airQualityLevel) {
      case AirQuality.VERY_GOOD:
        return this.HomeAirQuality.EXCELLENT;
      case AirQuality.GOOD:
        return this.HomeAirQuality.GOOD;
      case AirQuality.MODERATE:
        return this.HomeAirQuality.INFERIOR;
      case AirQuality.POOR:
        return this.HomeAirQuality.POOR;
      default:
        return this.HomeAirQuality.UNKNOWN;
    }
  }
};

export default characteristic;
