import type {
    CharacteristicGetHandler,
    CharacteristicSetHandler,
    CharacteristicValue,
    Nullable
} from 'homebridge';

import type { AccessoryThisType } from '../VeSyncHumAccessory.js';
import { Mode } from '../api/VeSyncHumidifier.js';

const characteristic: {
    get: CharacteristicGetHandler;
    set: CharacteristicSetHandler;
} & AccessoryThisType = {
    get: async function (): Promise<Nullable<CharacteristicValue>> {
        await this.device.updateInfo();
        return this.device.mode === Mode.Auto ? 1 : 0;
    },
    set: async function (value: CharacteristicValue) {
        const mode = value === 1 ? Mode.Auto : Mode.Manual;
        if (mode !== this.device.mode) {
            await this.device.setMode(mode);
        }
    }
};

export default characteristic;
