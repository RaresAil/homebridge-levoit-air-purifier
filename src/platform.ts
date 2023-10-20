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
import VeSyncPurAccessory from './VeSyncPurAccessory';
import VeSyncHumAccessory from './VeSyncHumAccessory';
import VeSyncHumidifier from './api/VeSyncHumidifier';
import { ExperimentalFeatures } from './types';
import VeSyncFan from './api/VeSyncFan';
import DebugMode from './debugMode';
import VeSync from './api/VeSync';

export interface VeSyncContext {
  name: string;
  device: VeSyncFan | VeSyncHumidifier;
}

export enum VeSyncAdditionalType {
  Sensor,
  Light
}

export interface VeSyncAdditionalContext {
  name: string;
  parent: string;
  type: VeSyncAdditionalType;
}

export type VeSyncPlatformAccessory = PlatformAccessory<
  VeSyncContext | VeSyncAdditionalContext
>;

export interface Config extends PlatformConfig {
  experimentalFeatures: ExperimentalFeatures[];
  enableDebugMode?: boolean;
  password: string;
  email: string;
}

export default class Platform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic =
    this.api.hap.Characteristic;

  public readonly registeredDevices: (VeSyncPurAccessory | VeSyncHumAccessory)[] = [];
  public readonly cachedAccessories: VeSyncPlatformAccessory[] = [];
  public readonly cachedAdditional: VeSyncPlatformAccessory[] = [];

  public readonly debugger: DebugMode;
  private readonly client?: VeSync;

  constructor(
    public readonly log: Logger,
    public readonly config: Config,
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
    const additional = (accessory.context as VeSyncAdditionalContext);
    if (additional.parent) {
      this.cachedAdditional.push(accessory);
      return;
    }

    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.cachedAccessories.push(accessory);
  }

  private cleanAccessories() {
    try {
      if (this.cachedAccessories.length > 0 || this.cachedAdditional.length > 0) {
        this.debugger.debug(
          '[PLATFORM]',
          'Removing cached accessories because the email and password are not set (Count:',
          `${this.cachedAccessories.length})`
        );

        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
          ...this.cachedAccessories,
          ...this.cachedAdditional
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

      const { purifiers, humidifiers } = await this.client.getDevices();

      const experimentalFeatures = this.config?.experimentalFeatures || [];

      await Promise.all(purifiers.map(this.loadDevice.bind(this)));

      if (experimentalFeatures.includes(ExperimentalFeatures.Humidifiers)) {
        await Promise.all(humidifiers.map(this.loadDevice.bind(this)));
      }

      this.checkOldDevices();
    } catch (error: any) {
      this.log.error(`Error: ${error?.message}`);
    }
  }

  private async loadDevice(device: VeSyncFan | VeSyncHumidifier) {
    try {
      await device.updateInfo();
      const { uuid, name } = device;

      const existingAccessory = this.cachedAccessories.find(
        (accessory) => accessory.UUID === uuid
      );

      const additional = device instanceof VeSyncFan ? this.loadAdditional(device) : {} as Record<VeSyncAdditionalType, VeSyncPlatformAccessory | undefined>;

      if (existingAccessory) {
        this.log.info(
          'Restoring existing accessory from cache:',
          existingAccessory.displayName
        );

        existingAccessory.context = {
          name,
          device
        };

        if (device instanceof VeSyncFan) {
          this.registeredDevices.push(
            new VeSyncPurAccessory(this, existingAccessory, additional)
          );
        } else if (device instanceof VeSyncHumidifier) {
          this.registeredDevices.push(
            new VeSyncHumAccessory(this, existingAccessory)
          );
        }

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

      if (device instanceof VeSyncFan) {
        this.registeredDevices.push(
          new VeSyncPurAccessory(this, accessory, additional)
        );
      } else if (device instanceof VeSyncHumidifier) {
        this.registeredDevices.push(
          new VeSyncHumAccessory(this, accessory)
        );
      }

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

    const additionalAccessories = this.cachedAdditional.reduce(
      (acc, device) => ({
        ...acc,
        [(device.context as VeSyncAdditionalContext).parent ?? '']: [
          ...(acc[(device.context as VeSyncAdditionalContext).parent ?? ''] || []),
          device
        ]
      }),
      {}
    );

    this.cachedAccessories.map((accessory) => {
      try {
        const exists = registeredDevices[accessory.UUID];
        const additional = additionalAccessories[accessory.UUID];

        if (!exists) {
          this.log.info('Remove cached accessory:', accessory.displayName);
          this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
            accessory,
            ...(additional ? additional : [])
          ]);
        }
      } catch (error: any) {
        this.log.error(
          `Error for device: ${accessory.displayName} | ${error?.message}`
        );
      }
    });
  }

  private loadAdditional(device: VeSyncFan) {
    const { uuid, name } = device;

    const features = this.config.experimentalFeatures
      ?.reduce((acc, feature) => ({ ...acc, [feature]: 1 }), {} as Record<ExperimentalFeatures, number>) || {};

    const additionalAccessories = this.cachedAdditional.reduce(
      (acc, additional) => {
        const context = (additional.context as VeSyncAdditionalContext);
        if (context.parent === uuid) {
          return {
            ...acc,
            [context.type]: additional
          };
        }

        return acc;
      }, {} as Record<VeSyncAdditionalType, VeSyncPlatformAccessory | undefined>
    );

    if (!additionalAccessories[VeSyncAdditionalType.Sensor] && device.deviceType.hasAirQuality) {
      additionalAccessories[VeSyncAdditionalType.Sensor] = new this.api.platformAccessory<VeSyncAdditionalContext>(
        `${name} Sensor`,
        this.api.hap.uuid.generate(`${uuid}-sensor`)
      );

      additionalAccessories[VeSyncAdditionalType.Sensor].context = {
        name: `${name} Sensor`,
        parent: uuid,
        type: VeSyncAdditionalType.Sensor
      };

      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
        additionalAccessories[VeSyncAdditionalType.Sensor]
      ]);
    } else if (additionalAccessories[VeSyncAdditionalType.Sensor] && !device.deviceType.hasAirQuality) {
      this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
        additionalAccessories[VeSyncAdditionalType.Sensor]
      ]);

      delete additionalAccessories[VeSyncAdditionalType.Sensor];
    }

    if (features[ExperimentalFeatures.DeviceDisplay] && !additionalAccessories[VeSyncAdditionalType.Light]) {
      additionalAccessories[VeSyncAdditionalType.Light] = new this.api.platformAccessory<VeSyncAdditionalContext>(
        `${name} Display`,
        this.api.hap.uuid.generate(`${uuid}-light`)
      );

      additionalAccessories[VeSyncAdditionalType.Light].context = {
        name: `${name} Display`,
        parent: uuid,
        type: VeSyncAdditionalType.Light
      };

      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
        additionalAccessories[VeSyncAdditionalType.Light]
      ]);
    } else if (!features[ExperimentalFeatures.DeviceDisplay] && additionalAccessories[VeSyncAdditionalType.Light]) {
      this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
        additionalAccessories[VeSyncAdditionalType.Light]
      ]);

      delete additionalAccessories[VeSyncAdditionalType.Light];
    }

    return additionalAccessories;
  }
}
