import {
  DynamicPlatformPlugin,
  PlatformAccessory,
  PlatformConfig,
  Characteristic,
  Service,
  Logger,
  API
} from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import VeSyncAccessory from './VeSyncAccessory';
import VeSyncFan from './api/VeSyncFan';
import DebugMode from './debugMode';
import VeSync from './api/VeSync';

export interface VeSyncContext {
  name: string;
  device: VeSyncFan;
}

export interface VeSyncSensorContext {
  name: string;
  parent: string;
}

export type VeSyncPlatformAccessory = PlatformAccessory<
  VeSyncContext | VeSyncSensorContext
>;

export default class Platform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic =
    this.api.hap.Characteristic;

  public readonly cachedAccessories: VeSyncPlatformAccessory[] = [];
  public readonly cachedSensors: VeSyncPlatformAccessory[] = [];
  public readonly registeredDevices: VeSyncAccessory[] = [];

  public readonly debugger: DebugMode;
  private readonly client?: VeSync;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API
  ) {
    const { email, password, enableDebugMode } = this.config ?? {};
    this.debugger = new DebugMode(!!enableDebugMode, this.log);

    try {
      if (!email || !password) {
        this.log.info('Setup the configuration first!');
        this.cleanAccessories();
        return;
      }

      this.debugger.debug('[PLATFORM]', 'Debug mode enabled');

      this.client = new VeSync(email, password, this.debugger, log);

      this.api.on('didFinishLaunching', () => {
        this.discoverDevices();
      });
    } catch (error: any) {
      this.log.error(`Error: ${error?.message}`);
    }
  }

  configureAccessory(accessory: VeSyncPlatformAccessory) {
    if ((accessory.context as VeSyncSensorContext).parent) {
      this.cachedSensors.push(accessory);
      return;
    }

    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.cachedAccessories.push(accessory);
  }

  private cleanAccessories() {
    try {
      if (this.cachedAccessories.length > 0 || this.cachedSensors.length > 0) {
        this.debugger.debug(
          '[PLATFORM]',
          'Removing cached accessories because the email and password are not set (Count:',
          `${this.cachedAccessories.length})`
        );

        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
          ...this.cachedAccessories,
          ...this.cachedSensors
        ]);
      }
    } catch (error: any) {
      this.log.error(`Error for cached accessories: ${error?.message}`);
    }
  }

  private async discoverDevices() {
    try {
      if (!this.client) {
        return;
      }

      this.log.info('Connecting to the servers...');
      const successLogin = await this.client.startSession();
      if (!successLogin) {
        return;
      }

      this.log.info('Discovering devices...');

      const devices = await this.client.getDevices();
      await Promise.all(devices.map(this.loadDevice.bind(this)));

      this.checkOldDevices();
    } catch (error: any) {
      this.log.error(`Error: ${error?.message}`);
    }
  }

  private async loadDevice(device: VeSyncFan) {
    try {
      await device.updateInfo();
      const { uuid, name } = device;

      const existingAccessory = this.cachedAccessories.find(
        (accessory) => accessory.UUID === uuid
      );

      let sensor = this.cachedSensors.find(
        (sensor) => (sensor.context as VeSyncSensorContext).parent === uuid
      );

      if (!sensor && device.deviceType.hasAirQuality) {
        sensor = new this.api.platformAccessory<VeSyncSensorContext>(
          `${name} Sensor`,
          this.api.hap.uuid.generate(`${uuid}-sensor`)
        );

        sensor.context = {
          name: `${name} Sensor`,
          parent: uuid
        };

        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
          sensor
        ]);
      } else if (sensor && !device.deviceType.hasAirQuality) {
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
          sensor
        ]);
      }

      if (existingAccessory) {
        this.log.info(
          'Restoring existing accessory from cache:',
          existingAccessory.displayName
        );

        existingAccessory.context = {
          name,
          device
        };

        this.registeredDevices.push(
          new VeSyncAccessory(this, existingAccessory, sensor)
        );

        return;
      }

      this.log.info('Adding new accessory:', name);
      const accessory = new this.api.platformAccessory<VeSyncContext>(
        name,
        uuid
      );
      accessory.context = {
        name,
        device
      };

      this.registeredDevices.push(new VeSyncAccessory(this, accessory, sensor));
      return this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
        accessory
      ]);
    } catch (error: any) {
      this.log.error(
        `Error for device: ${device.name}:${device.uuid} | ${error?.message}`
      );
      return null;
    }
  }

  private checkOldDevices() {
    const registeredDevices = this.registeredDevices.reduce(
      (acc, device) => ({
        ...acc,
        [device.UUID]: true
      }),
      {}
    );

    const sensors = this.cachedSensors.reduce(
      (acc, device) => ({
        ...acc,
        [(device.context as VeSyncSensorContext).parent ?? '']: device
      }),
      {}
    );

    this.cachedAccessories.map((accessory) => {
      try {
        const exists = registeredDevices[accessory.UUID];
        const sensor = sensors[accessory.UUID];

        if (!exists) {
          this.log.info('Remove cached accessory:', accessory.displayName);
          this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
            accessory,
            ...(sensor ? [sensor] : [])
          ]);
        }
      } catch (error: any) {
        this.log.error(
          `Error for device: ${accessory.displayName} | ${error?.message}`
        );
      }
    });
  }
}
