import {
    CharacteristicGetHandler,
    CharacteristicValue,
    Nullable
} from 'homebridge';

import { AccessoryThisType } from '../VeSyncHumAccessory';

const characteristic: {
    get: CharacteristicGetHandler;
} & AccessoryThisType = {
    get: async function (): Promise<Nullable<CharacteristicValue>> {
        await this.device.updateInfo();
        return this.device.currentState;
    }
};

export default characteristic;
