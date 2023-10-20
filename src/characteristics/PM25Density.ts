import {
  CharacteristicGetHandler,
  CharacteristicValue,
  Nullable
} from 'homebridge';

import { AccessoryThisType } from '../VeSyncPurAccessory';

const characteristic: {
  get: CharacteristicGetHandler;
} & AccessoryThisType = {
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    if (!this.device.deviceType.hasPM25) {
      return 0;
    }

    await this.device.updateInfo();
    return this.device.pm25;
  }
};

export default characteristic;
