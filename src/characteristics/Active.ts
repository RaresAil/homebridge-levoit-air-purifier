import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable
} from 'homebridge';

import { AccessoryThisType } from '../VeSyncAccessory';
import { delay } from '../util';

const characteristic: {
  get: CharacteristicGetHandler;
  set: CharacteristicSetHandler;
} & AccessoryThisType = {
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    await this.device.updateInfo();

    return this.device.isOn;
  },
  set: async function (value: CharacteristicValue) {
    let boolValue = value === 1;

    if (boolValue !== this.device.isOn) {
      const success = await this.device.setPower(boolValue);

      if (!success) {
        boolValue = !boolValue;
      }
    } else {
      await delay(10);
    }

    const { PURIFYING_AIR, INACTIVE } =
      this.platform.Characteristic.CurrentAirPurifierState;

    this.airPurifierCurrentCharacteristic!.updateValue(
      boolValue ? PURIFYING_AIR : INACTIVE
    );
  }
};

export default characteristic;
