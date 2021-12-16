export enum DeviceName {
  Core601S = '601S',
  Core600S = '600S',
  Core401S = '401S',
  Core400S = '400S',
  Core300S = '300S',
  Core201S = '201S',
  Core200S = '200S'
}

export interface DeviceType {
  isValid: (input: string) => boolean;
  hasAirQuality: boolean;
  hasAutoMode: boolean;
  speedMinStep: number;
  speedLevels: number; // With night mode
  hasPM25: boolean;
}

const deviceTypes: DeviceType[] = [
  {
    isValid: (input: string) =>
      input.includes(DeviceName.Core601S) ||
      input.includes(DeviceName.Core600S) ||
      input.includes(DeviceName.Core401S) ||
      input.includes(DeviceName.Core400S),
    hasAirQuality: true,
    hasAutoMode: true,
    speedMinStep: 20,
    speedLevels: 5,
    hasPM25: true
  },
  {
    isValid: (input: string) => input.includes(DeviceName.Core300S),
    hasAirQuality: true,
    hasAutoMode: true,
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
    speedMinStep: 25,
    speedLevels: 4,
    hasPM25: false
  }
];

export default deviceTypes;
