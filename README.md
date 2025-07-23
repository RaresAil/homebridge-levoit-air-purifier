[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)

[![Build and Lint](https://github.com/RaresAil/homebridge-levoit-air-purifier/actions/workflows/build.yml/badge.svg)](https://github.com/RaresAil/homebridge-levoit-air-purifier/actions/workflows/build.yml)
[![CodeQL](https://github.com/RaresAil/homebridge-levoit-air-purifier/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/RaresAil/homebridge-levoit-air-purifier/actions/workflows/codeql-analysis.yml)

![NPM Package Downloads](https://badgen.net/npm/dm/homebridge-levoit-air-purifier)
![Snyk Vulnerabilities for NPM Package](https://img.shields.io/snyk/vulnerabilities/npm/homebridge-levoit-air-purifier)

# Homebridge Levoit Air Purifier

This is a Homebridge plugin to control Levoit Air Purifiers/Humidifiers with via the VeSync Platform.

| Supported Versions | Tested |
| ------------------ | ------ |
| Core 600S          | ✅     |
| Core 400S Pro      | ✅     |
| Core 400S          | ✅     |
| Core 300S          | ✅     |
| Core 200S          | ✅     |
| Other versions     | ❌     |

**The versions lower then 200 are not supported (e.g. 131S) because they require API v1 and this plugin uses v2**

**If you have a newer version that is not in this table, then open a issue
and i will try to add support for it**

Any device from VeSync that is not listed in the supported versions are automatically skipped when discovering devices.

### Features for Purifiers

1. Displaying the air quality (the same display as the one on the physical device) (Not for 200S)
2. Display the PM2.5 Density value in Home App shown in µg/m^3 (Not for 200S)
3. Child Lock option
4. Speed option:
   - 0 -> Off
   - 1 -> Sleep Mode
   - 2 -> Level 1
   - 3 -> Level 2
   - 4 -> Level 3
   - 5 -> Level 4 (Only for Core 400S, 400S Pro and 600S)
5. Filter Change Indicator & Filter Life Level
6. Mode change (Not for 200S)
   - Auto
   - Manual

### Humidifiers (Experimental Feature)

The version 2.x adds support for humidifiers as an experimental feature which by default is disabled, the devices and features are limited for this devices for now

| Supported Versions | Tested |
| ------------------ | ------ |
| Dual 200S          | ✅     |
| Other versions     | ❌     |

**If you have a newer version that is not in this table, then open a issue
and i will try to add support for it**

#### Features

1. Displaying the humidity level
2. Target Humidity
3. Speed option:
   - 0 -> Off
   - 1 -> LOW
   - 2 -> HIGH
4. Mode change as Swing in home app
   - Auto (Swing enabled)
   - Manual (Swing disabled)

### Experimental Features

For the experimental features to be activated you need to add them in the config file of the platform, e.g.

```json
{
  "name": "Levoit Air Purifiers",
  "experimentalFeatures": ["DeviceDisplay", "Humidifiers"]
}
```

---

1. Show the display's switch as a light in the app (`DeviceDisplay`)

The read data is cached for 5 seconds to not trigger the rate limiter for the API.
Each request is delayed by 500ms to not trigger the rate limiter if a huge number of requests are sent.

The timers are not included because you can accomplish similar results by using Home App's Automatization or the Shortcuts app

2. Discovers supported humidifiers (`Humidifiers`)

### Configuration

- Via the Homebridge UI, enter the Homebridge VeSync Client plugin settings.
- Enter your VeSync app credentials.
- Optionally enter a region. This will be the top level domain (TLD) for the VeSync API. Default ist "com". EU users must use "eu".
- Setup the platform plugin as a child bridge for better performance
- Save and restart Homebridge.

This plugin requires your VeSync credentials as it communicates with the VeSync devices via VeSync's own API. Your credentials are only stored in the Homebridge config and not sent to any server except VeSync's.

You can also do this directly via the homebridge config by adding your credentials to the config file under platforms. Replace the values of `username` and `password` by your credentials.

```json
{
  "platforms": [
    {
      "name": "Levoit Air Purifiers",
      "email": "email",
      "password": "password",
      "platform": "LevoitAirPurifiers",
      "experimentalFeatures": []
    }
  ]
}
```

### Enabling Debug Mode

In the config file, add `enableDebugMode: true`

```json
{
  "platforms": [
    {
      "name": "Levoit Air Purifiers",
      "email": "email",
      "password": "password",
      "platform": "LevoitAirPurifiers",
      "enableDebugMode": true
    }
  ]
}
```

### Local Development

To setup the local project clone the files and inside the root directory of the project run:

```
yarn install
```

After that to start the local server use

```
yarn watch
```
