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
  Everest = '551S'
}

export interface DeviceType {
  isValid: (input: string) => boolean;
  hasAirQuality: boolean;
  hasAutoMode: boolean;
  speedMinStep: number;
  speedLevels: number; // With night mode
  hasPM25: boolean;

  isEverest: boolean;
}

const deviceTypes: DeviceType[] = [
  {
    isValid: (input: string) =>
      input.includes(DeviceName.Core602S) ||
      input.includes(DeviceName.Core601S) ||
      input.includes(DeviceName.Core600S) ||
      input.includes(DeviceName.Core401S) ||
      input.includes(DeviceName.Core400S),
    hasAirQuality: true,
    hasAutoMode: true,
    isEverest: false,
    speedMinStep: 20,
    speedLevels: 5,
    hasPM25: true
  },
  {
    isValid: (input: string) =>
      input.includes(DeviceName.Core302S) ||
      input.includes(DeviceName.Core301S) ||
      input.includes(DeviceName.Core300S),
    hasAirQuality: true,
    hasAutoMode: true,
    isEverest: false,
    speedMinStep: 25,
    speedLevels: 4,
    hasPM25: true
  },
  {
    isValid: (input: string) =>
      input.includes(DeviceName.Core201S) ||
      input.includes(DeviceName.Core200S),
    hasAirQuality: false,
    hasAutoMode: false,
    isEverest: false,
    speedMinStep: 25,
    speedLevels: 4,
    hasPM25: false
  },
  {
    isValid: (input: string) => input.includes(DeviceName.Everest),
    hasAirQuality: false,
    hasAutoMode: false,
    isEverest: true,
    speedMinStep: 25,
    speedLevels: 4,
    hasPM25: false
  }
];

export default deviceTypes;
