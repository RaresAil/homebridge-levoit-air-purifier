import type { API, PlatformPluginConstructor } from 'homebridge';

import { PLATFORM_NAME } from './settings.js';
import Platform from './platform.js';

export default (api: API) => {
  api.registerPlatform(PLATFORM_NAME, Platform as unknown as PlatformPluginConstructor);
};
