import {
  CharacteristicGetHandler,
  CharacteristicValue,
  Nullable
} from 'homebridge';

import { AccessoryThisType } from '../VeSyncPurAccessory';

// PM10 density (µg/m³) for the Air Quality sensor, same as PM25Density
const characteristic: {
  get: CharacteristicGetHandler;
} & AccessoryThisType = {
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    if (!this.device.deviceType.hasPM10) {
      return 0;
    }

    await this.device.updateInfo();
    return this.device.pm10;
  }
};

export default characteristic;
