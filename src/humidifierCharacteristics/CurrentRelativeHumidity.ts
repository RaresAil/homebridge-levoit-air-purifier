import type {
    CharacteristicGetHandler,
    CharacteristicValue,
    Nullable
} from 'homebridge';

import type { AccessoryThisType } from '../VeSyncHumAccessory.js';

const characteristic: {
    get: CharacteristicGetHandler;
} & AccessoryThisType = {
    get: async function (): Promise<Nullable<CharacteristicValue>> {
        await this.device.updateInfo();
        return this.device.humidity;
    }
};

export default characteristic;
