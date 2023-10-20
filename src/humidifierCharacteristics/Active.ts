import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable
} from 'homebridge';

import { AccessoryThisType } from '../VeSyncHumAccessory';
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

    this.currentStateChar?.updateValue(
      this.device.currentState,
    );
  }
};

export default characteristic;
