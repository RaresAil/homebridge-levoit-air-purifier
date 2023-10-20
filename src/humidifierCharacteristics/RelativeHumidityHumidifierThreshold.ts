import {
    CharacteristicGetHandler,
    CharacteristicSetHandler,
    CharacteristicValue,
    Nullable
} from 'homebridge';

import { AccessoryThisType } from '../VeSyncHumAccessory';

const characteristic: {
    get: CharacteristicGetHandler;
    set: CharacteristicSetHandler;
} & AccessoryThisType = {
    get: async function (): Promise<Nullable<CharacteristicValue>> {
        await this.device.updateInfo();
        return this.device.targetHumidity;
    },
    set: async function (value: CharacteristicValue) {
        let newTarget = value as number;
        if (newTarget < 30) {
            newTarget = 30;
        }

        if (newTarget > 80) {
            newTarget = 80;
        }

        if (newTarget !== this.device.targetHumidity) {
            this.device.setTarget(newTarget);
        }
    }
};

export default characteristic;
