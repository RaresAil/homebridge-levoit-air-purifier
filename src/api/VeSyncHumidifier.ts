import AsyncLock from 'async-lock';

import { HumidifierDeviceType, humidifierDeviceTypes } from './deviceTypes';
import VeSync, { HumidifierBypassMethod } from './VeSync';
import { VeSyncGeneric } from './VeSyncGeneric';

export enum AirQuality {
    VERY_GOOD = 1,
    MODERATE = 3,
    UNKNOWN = 0,
    GOOD = 2,
    POOR = 4
}

export enum Mode {
    Manual = 'manual',
    Auto = 'auto',
}

export default class VeSyncHumidifier implements VeSyncGeneric {
    public readonly deviceType: HumidifierDeviceType;

    private lock: AsyncLock = new AsyncLock();
    private lastCheck = 0;

    private _mode: Mode = Mode.Manual;
    private _autoTargetHumidity = 0;
    private _screenVisible = true;
    private _idle = false;
    private _humidity = 0;
    private _speed = 1;

    public readonly manufacturer = 'Levoit';

    public get screenVisible() {
        return this._screenVisible;
    }

    public get isOn() {
        return this._isOn;
    }

    public get speed() {
        return this._speed;
    }

    public get humidity() {
        return this._humidity;
    }

    public get targetHumidity() {
        return this._autoTargetHumidity;
    }

    public get mode() {
        return this._mode;
    }

    public get currentState() {
        if (!this._isOn) {
            return 0;
        }

        if (this._idle) {
            return 1;
        }

        return 2;
    }

    constructor(
        private readonly client: VeSync,
        public readonly name: string,
        public readonly uuid: string,
        private _isOn: boolean,
        public readonly cid: string,
        public readonly region: string,
        public readonly model: string,
        public readonly mac: string,
        public readonly configModule: string,
    ) {
        this.deviceType = humidifierDeviceTypes.find(({ isValid }) => isValid(this.model))!;
    }

    public async setPower(power: boolean): Promise<boolean> {
        const success = await this.client.sendCommand(this, HumidifierBypassMethod.SWITCH, {
            enabled: power,
            id: 0
        });

        if (success) {
            this._isOn = power;
        }

        return success;
    }

    public async setTarget(value: number): Promise<boolean> {
        const success = await this.client.sendCommand(this, HumidifierBypassMethod.HUMIDITY, {
            'target_humidity': value,
            id: 0
        });

        if (success) {
            this._autoTargetHumidity = value;
        }

        return success;
    }

    public async setMode(mode: Mode): Promise<boolean> {
        const success = await this.client.sendCommand(this, HumidifierBypassMethod.MODE, {
            mode: mode,
            id: 0
        });

        if (success) {
            this._mode = mode;
        }

        return success;
    }

    public async setSpeed(value: number): Promise<boolean> {
        const success = await this.client.sendCommand(this, HumidifierBypassMethod.MIST_LEVEL, {
            level: value,
            type: 'mist',
            id: 0
        });

        if (success) {
            this._speed = value;
            this._mode = Mode.Manual;
        }

        return success;
    }


    public async updateInfo(): Promise<void> {
        return this.lock.acquire('update-info', async () => {
            try {
                if (Date.now() - this.lastCheck < 5 * 1000) {
                    return;
                }

                const data = await this.client.getDeviceInfo(this, true);
                this.lastCheck = Date.now();

                if (!data?.result?.result) {
                    return;
                }

                const result = data.result.result;

                this._idle = (result.configuration?.automatic_stop && result.automatic_stop_reach_target);
                this._autoTargetHumidity = result.configuration?.auto_target_humidity ?? 0;
                this._speed = result.mist_virtual_level;
                this._screenVisible = result.display;
                this._humidity = result.humidity;
                this._isOn = result.enabled;
                this._mode = result.mode;
            } catch (err: any) {
                this.client.log.error(err?.message);
            }
        });
    }

    public static fromResponse =
        (client: VeSync) =>
            ({
                deviceStatus,
                deviceName,
                uuid,
                cid,
                deviceRegion,
                deviceType,
                macID,
                configModule,
            }) => {
                return new VeSyncHumidifier(
                    client,
                    deviceName,
                    uuid,
                    deviceStatus === 'on',
                    cid,
                    deviceRegion,
                    deviceType,
                    macID,
                    configModule
                );
            };
}
