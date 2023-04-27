import { API, PlatformPluginConstructor } from 'homebridge';

import { PLATFORM_NAME } from './settings';
import Platform from './platform';

export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, Platform as unknown as PlatformPluginConstructor);
};
