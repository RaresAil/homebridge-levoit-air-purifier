import type {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable
} from 'homebridge';

import type { AccessoryThisType } from '../VeSyncPurAccessory.js';
import { delay } from '../util.js';

const characteristic: {
  get: CharacteristicGetHandler;
  set: CharacteristicSetHandler;
} & AccessoryThisType = {
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    await this.device.updateInfo();

    return this.device.screenVisible;
  },
  set: async function (value: CharacteristicValue) {
    let boolValue = value as boolean;

    if (boolValue !== this.device.screenVisible) {
      const success = await this.device.setDisplay(boolValue);

      if (!success) {
        boolValue = !boolValue;
      }
    } else {
      await delay(10);
    }

    this.airPurifierCurrentCharacteristic!.updateValue(
      boolValue
    );
  }
};

export default characteristic;
