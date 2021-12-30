import Big from 'big.js';
import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable
} from 'homebridge';

import VeSyncFan, { Mode } from '../api/VeSyncFan';
import { AccessoryThisType } from '../VeSyncAccessory';

const calculateSpeed = (device: VeSyncFan) => {
  let speed = (device.speed + 1) * device.deviceType.speedMinStep;
  if (device.mode === Mode.Sleep) {
    speed = device.deviceType.speedMinStep;
  }

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

    let lastSpeed = this.device.speed;
    if (this.device.mode === Mode.Sleep) {
      lastSpeed = 0;
    }

    if (realValue.eq(lastSpeed + 1)) {
      return;
    }

    if (realValue.eq(1)) {
      await this.device.changeMode(Mode.Sleep);
    } else if (realValue.gt(1)) {
      await this.device.changeSpeed(realValue.toNumber() - 1);
    }
  }
};

export default characteristic;
