export enum DeviceName {
  Core602S = '602S',
  Core601S = '601S',
  Core600S = '600S',
  Core401S = '401S',
  Core400S = '400S',
  Core302S = '302S',
  Core301S = '301S',
  Core300S = '300S',
  Core201S = '201S',
  Core200S = '200S',
  Vital100S  = 'V102S',
  Vital200S = 'V201S',
}

export enum HumidifierDeviceName {
  Dual200SLeg = 'Dual200S',
  Dual200S = 'D301S',
}


export interface DeviceType {
  isValid: (input: string) => boolean;
  hasAirQuality: boolean;
  hasAutoMode: boolean;
  speedMinStep: number;
  speedLevels: number; // With night mode
  hasPM25: boolean;
}

export type DeviceCategory = 'Core' | 'Vital';

export type HumidifierDeviceType = Omit<DeviceType, 'hasPM25' | 'hasAirQuality'> & { isHumidifier: true };

/*
Enforce the name being a whole word within the model. Examples:

  - "V201S" matches "LAP-V201S-WUS"
  - "201S" does NOT match "LAP-V201S-WUS"
  - "Dual200S" matches "Dual200S"

Model numbers may vary by region, so not being too restrictive, but simply checking for substrings would cause issues if
not done in a certain order. For example, checking for Core201S before Vital200S would falsely identify a Vital200S as a
Core201S as seen with https://github.com/RaresAil/homebridge-levoit-air-purifier/issues/100/. Furthermore, a word
boundary is used instead of a hyphen (-) to handle the case where the name is 1:1 with the model.

Finally, some firmware versions may broadcast a C prefix for the Core line air purifiers. The modern names are used in
the enum above, but handle this as an optional case to maximize compatibility. This is only applied for enum values that
do not start with a letter (i.e. already have a well-defined prefix).
*/
const isModelMatch = (model: string, ...names: (DeviceName | HumidifierDeviceName)[]) => {
  const namePatterns = names.map(name => isNaN(parseInt(name.charAt(0), 10)) ? name : `C?${name}`);
  return new RegExp(`\\b(${namePatterns.join("|")})\\b`).test(model);
}

const deviceTypes: DeviceType[] = [
  {
    isValid: (input: string) =>
      isModelMatch(
        input,
        DeviceName.Core602S,
        DeviceName.Core601S,
        DeviceName.Core600S,
        DeviceName.Core401S,
        DeviceName.Core400S
      ),
    hasAirQuality: true,
    hasAutoMode: true,
    speedMinStep: 20,
    speedLevels: 5,
    hasPM25: true
  },
  {
    isValid: (input: string) =>
      isModelMatch(
        input,
        DeviceName.Core302S,
        DeviceName.Core301S,
        DeviceName.Core300S
      ),
    hasAirQuality: true,
    hasAutoMode: true,
    speedMinStep: 25,
    speedLevels: 4,
    hasPM25: true
  },
  {
    isValid: (input: string) =>
      isModelMatch(
        input,
        DeviceName.Core201S,
        DeviceName.Core200S
      ),
    hasAirQuality: false,
    hasAutoMode: false,
    speedMinStep: 25,
    speedLevels: 4,
    hasPM25: false
  },
  {
    isValid: (input: string) =>
      isModelMatch(
        input,
        DeviceName.Vital100S,
        DeviceName.Vital200S
      ),
    hasAirQuality: true,
    hasAutoMode: true,
    speedMinStep: 25,
    speedLevels: 4,
    hasPM25: true
  },
];

export const humidifierDeviceTypes: HumidifierDeviceType[] = [
  {
    isValid: (input: string) =>
      isModelMatch(
        input,
        HumidifierDeviceName.Dual200S,
        HumidifierDeviceName.Dual200SLeg
      ),
    hasAutoMode: true,
    speedMinStep: 50,
    speedLevels: 2,
    isHumidifier: true
  }
];

export default deviceTypes;
