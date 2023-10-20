import Big from 'big.js';
import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable
} from 'homebridge';

import VeSyncHumidifier from '../api/VeSyncHumidifier';
import { AccessoryThisType } from '../VeSyncHumAccessory';
import { delay } from '../util';

const calculateSpeed = (device: VeSyncHumidifier) => {
  const speed = (device.speed) * device.deviceType.speedMinStep;
  return device.isOn ? speed : 0;
};

const characteristic: {
  get: CharacteristicGetHandler;
  set: CharacteristicSetHandler;
} & AccessoryThisType = {
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    await this.device.updateInfo();
    return calculateSpeed(this.device);
  },
  set: async function (value: CharacteristicValue) {
    const realValue = new Big(parseInt(value.toString(), 10)).div(
      this.device.deviceType.speedMinStep
    );

    if (realValue.eq(this.device.speed)) {
      return;
    }

    const success = await this.device.setSpeed(realValue.toNumber());

    if (success && this.modeChar) {
      await delay(10);
      this.modeChar.updateValue(0);
    }
  }
};

export default characteristic;
