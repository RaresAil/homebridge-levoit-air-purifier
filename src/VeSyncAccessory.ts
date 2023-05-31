import { Characteristic, Service } from 'homebridge';

import Platform, { VeSyncAdditionalType, VeSyncContext, VeSyncPlatformAccessory } from './platform';
import FilterChangeIndication from './characteristics/FilterChangeIndication';
import LockPhysicalControls from './characteristics/LockPhysicalControls';
import FilterLifeLevel from './characteristics/FilterLifeLevel';
import RotationSpeed from './characteristics/RotationSpeed';
import CurrentState from './characteristics/CurrentState';
import PM25Density from './characteristics/PM25Density';
import TargetState from './characteristics/TargetState';
import AirQuality from './characteristics/AirQuality';
import Active from './characteristics/Active';
import VeSyncFan from './api/VeSyncFan';

import DisplayLight from './experimentalCharacteristics/Display';

export type AccessoryThisType = ThisType<{
  airPurifierCurrentCharacteristic?: Characteristic;
  HomeAirQuality: VeSyncAccessory['HomeAirQuality'];
  airPurifierService: Service;
  platform: Platform;
  device: VeSyncFan;
}>;

export default class VeSyncAccessory {
  private HomeAirQuality = this.platform.Characteristic.AirQuality;
  private airPurifierCurrentCharacteristic?: Characteristic;
  private airPurifierService?: Service;

  public get UUID() {
    return this.device.uuid.toString();
  }

  private get device() {
    return (this.accessory.context as VeSyncContext).device;
  }

  constructor(
    private readonly platform: Platform,
    private readonly accessory: VeSyncPlatformAccessory,
    readonly additional: Record<VeSyncAdditionalType, VeSyncPlatformAccessory | undefined>
  ) {
    try {
      const { manufacturer, model, mac } = this.device;

      this.accessory
        .getService(this.platform.Service.AccessoryInformation)!
        .setCharacteristic(
          this.platform.Characteristic.Manufacturer,
          manufacturer
        )
        .setCharacteristic(this.platform.Characteristic.Model, model)
        .setCharacteristic(this.platform.Characteristic.SerialNumber, mac);

      this.airPurifierService =
        this.accessory.getService(this.platform.Service.AirPurifier) ||
        this.accessory.addService(this.platform.Service.AirPurifier);

      const sensor = additional[VeSyncAdditionalType.Sensor];
      if (sensor) {
        sensor
          .getService(this.platform.Service.AccessoryInformation)!
          .setCharacteristic(
            this.platform.Characteristic.Manufacturer,
            manufacturer
          )
          .setCharacteristic(this.platform.Characteristic.Model, model)
          .setCharacteristic(this.platform.Characteristic.SerialNumber, mac);

        const airQualitySensorService =
          sensor.getService(this.platform.Service.AirQualitySensor) ||
          sensor.addService(this.platform.Service.AirQualitySensor);

        airQualitySensorService
          .getCharacteristic(this.platform.Characteristic.AirQuality)
          .setProps({
            validValues: [
              this.HomeAirQuality.UNKNOWN,
              this.HomeAirQuality.EXCELLENT,
              this.HomeAirQuality.GOOD,
              this.HomeAirQuality.INFERIOR,
              this.HomeAirQuality.POOR
            ]
          })
          .onGet(AirQuality.get.bind(this));

        if (this.device.deviceType.hasPM25) {
          airQualitySensorService
            .getCharacteristic(this.platform.Characteristic.PM2_5Density)
            .onGet(PM25Density.get.bind(this));
        }
      }

      const legacySensor = this.accessory.getService(
        this.platform.Service.AirQualitySensor
      );

      if (legacySensor) {
        this.accessory.removeService(legacySensor);
      }

      const display = additional[VeSyncAdditionalType.Light];
      if (display) {
        display
          .getService(this.platform.Service.AccessoryInformation)!
          .setCharacteristic(
            this.platform.Characteristic.Manufacturer,
            manufacturer
          )
          .setCharacteristic(this.platform.Characteristic.Model, model)
          .setCharacteristic(this.platform.Characteristic.SerialNumber, mac);

        const displayLightService =
          display.getService(this.platform.Service.Lightbulb) ||
          display.addService(this.platform.Service.Lightbulb);

        displayLightService
          .getCharacteristic(this.platform.Characteristic.On)
          .onGet(DisplayLight.get.bind(this))
          .onSet(DisplayLight.set.bind(this));
      }

      this.airPurifierService
        .getCharacteristic(this.platform.Characteristic.Active)
        .onGet(Active.get.bind(this))
        .onSet(Active.set.bind(this));

      this.airPurifierCurrentCharacteristic = this.airPurifierService
        .getCharacteristic(this.platform.Characteristic.CurrentAirPurifierState)
        .onGet(CurrentState.get.bind(this));

      if (this.device.deviceType.hasAutoMode) {
        this.airPurifierService
          .getCharacteristic(this.platform.Characteristic.TargetAirPurifierState)
          .onGet(TargetState.get.bind(this))
          .onSet(TargetState.set.bind(this));
      }

      this.airPurifierService
        .getCharacteristic(this.platform.Characteristic.LockPhysicalControls)
        .onGet(LockPhysicalControls.get.bind(this))
        .onSet(LockPhysicalControls.set.bind(this));

      this.airPurifierService
        .getCharacteristic(this.platform.Characteristic.RotationSpeed)
        .setProps({
          minStep: this.device.deviceType.speedMinStep,
          maxValue: 100
        })
        .onGet(RotationSpeed.get.bind(this))
        .onSet(RotationSpeed.set.bind(this));

      this.airPurifierService
        .getCharacteristic(this.platform.Characteristic.FilterChangeIndication)
        .onGet(FilterChangeIndication.get.bind(this));

      this.airPurifierService
        .getCharacteristic(this.platform.Characteristic.FilterLifeLevel)
        .onGet(FilterLifeLevel.get.bind(this));
    } catch (error: any) {
      this.platform.log.error(`Error: ${error?.message}`);
    }
  }
}
