import AsyncLock from 'async-lock';
import deviceTypes, { DeviceType, NewGenDevices } from './deviceTypes';

import VeSync, { BypassMethod } from './VeSync';

export enum AirQuality {
  VERY_GOOD = 1,
  MODERATE = 3,
  UNKNOWN = 0,
  GOOD = 2,
  POOR = 4
}
export enum Mode {
  Manual = 'manual',
  Sleep = 'sleep',
  Auto = 'auto'
}

export default class VeSyncFan {
  private lock: AsyncLock = new AsyncLock();
  public readonly deviceType: DeviceType;
  private lastCheck = 0;

  private _screenVisible = true;
  private _childLock = false;
  private _filterLife = 0;
  private _pm25 = 0;

  public readonly manufacturer = 'Levoit';

  public get airQualityLevel() {
    if (!this.deviceType.hasAirQuality) {
      return AirQuality.UNKNOWN;
    }

    return this._airQualityLevel;
  }

  public get screenVisible() {
    return this._screenVisible;
  }

  public get filterLife() {
    return this._filterLife;
  }

  public get childLock() {
    return this._childLock;
  }

  public get speed() {
    return this._speed;
  }

  public get mode() {
    return this._mode;
  }

  public get isOn() {
    return this._isOn;
  }

  public get pm25() {
    if (!this.deviceType.hasPM25) {
      return 0;
    }

    const value = this._pm25;
    return value < 0 ? 0 : value > 1000 ? 1000 : value;
  }

  constructor(
    private readonly client: VeSync,
    public readonly name: string,
    private _mode: Mode,
    private _speed: number,
    public readonly uuid: string,
    private _isOn: boolean,
    private _airQualityLevel: AirQuality,
    public readonly configModule: string,
    public readonly cid: string,
    public readonly region: string,
    public readonly model: string,
    public readonly mac: string
  ) {
    this.deviceType = deviceTypes.find(({ isValid }) => isValid(this.model))!;
  }

  public async setChildLock(lock: boolean): Promise<boolean> {
    const success = await this.client.sendCommand(this, BypassMethod.LOCK, {
      child_lock: lock
    });

    if (success) {
      this._childLock = lock;
    }

    return success;
  }

  public async setPower(power: boolean): Promise<boolean> {
    const success = await this.client.sendCommand(this, BypassMethod.SWITCH, {
      enabled: power,
      id: 0
    });

    if (success) {
      this._isOn = power;
    }

    return success;
  }

  public async changeMode(mode: Mode): Promise<boolean> {
    if (
      (mode === Mode.Auto || mode === Mode.Manual) &&
      !this.deviceType.hasAutoMode
    ) {
      return false;
    }

    const success = await this.client.sendCommand(this, BypassMethod.MODE, {
      mode: mode.toString()
    });

    if (success) {
      this._mode = mode;
    }

    return success;
  }

  public async changeSpeed(speed: number): Promise<boolean> {
    if (speed > this.deviceType.speedLevels - 1 || speed <= 0) {
      return false;
    }

    const success = await this.client.sendCommand(this, BypassMethod.SPEED, {
      level: speed,
      type: 'wind',
      id: 0
    });

    if (success) {
      this._speed = speed;
    }

    return success;
  }

  public async setDisplay(display: boolean): Promise<boolean> {
    const success = await this.client.sendCommand(this, BypassMethod.DISPLAY, {
      state: display,
      id: 0
    });

    if (success) {
      this._screenVisible = display;
    }

    return success;
  }

  public async updateInfo(): Promise<void> {
    return this.lock.acquire('update-info', async () => {
      try {
        if (Date.now() - this.lastCheck < 5 * 1000) {
          return;
        }

        const data = await this.client.getDeviceInfo(this);
        this.lastCheck = Date.now();

        if (!data?.result?.result) {
          return;
        }

        const result = data?.result?.result;

        switch (this.deviceType.newGen) {
          case NewGenDevices.Everest:
            this.mapDataN1(result);
            break;
          default:
            this.mapData(result);
            break;
        }
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
        extension: { airQualityLevel, fanSpeedLevel, mode },
        uuid,
        configModule,
        cid,
        deviceRegion,
        deviceType,
        macID
      }) =>
        new VeSyncFan(
          client,
          deviceName,
          mode,
          parseInt(fanSpeedLevel ?? '0', 10),
          uuid,
          deviceStatus === 'on',
          airQualityLevel,
          configModule,
          cid,
          deviceRegion,
          deviceType,
          macID
        );

  public static fromResponseN1 =
    (client: VeSync) =>
      ({
        deviceProp: { powerSwitch, AQLevel, fanSpeedLevel, workMode },
        deviceName,
        uuid,
        configModule,
        cid,
        deviceRegion,
        deviceType,
        macID
      }) =>
        new VeSyncFan(
          client,
          deviceName,
          workMode,
          fanSpeedLevel ?? 0,
          uuid,
          powerSwitch === 1,
          AQLevel,
          configModule,
          cid,
          deviceRegion,
          deviceType,
          macID
        );

  private mapData(result: any) {
    this._pm25 = this.deviceType.hasPM25 ? result.air_quality_value : 0;
    this._airQualityLevel = this.deviceType.hasAirQuality
      ? result.air_quality
      : AirQuality.UNKNOWN;
    this._filterLife = result.filter_life;
    this._screenVisible = result.display;
    this._childLock = result.child_lock;
    this._isOn = result.enabled;
    this._speed = result.level;
    this._mode = result.mode;
  }

  private mapDataN1(result: any) {
    this._pm25 = this.deviceType.hasPM25 ? result.PM25 : 0;
    this._airQualityLevel = this.deviceType.hasAirQuality
      ? result.air_quality
      : AirQuality.UNKNOWN;
    this._filterLife = result.filterLifePercent;
    this._screenVisible = result.screenSwitch === 1;
    this._childLock = result.childLockSwitch === 1;
    this._isOn = result.powerSwitch === 1;
    this._speed = result.manualSpeedLevel;
    this._mode = result.workMode;

    if (result.workMode === 'turbo') {
      this._mode = Mode.Auto;
    }
  }
}
