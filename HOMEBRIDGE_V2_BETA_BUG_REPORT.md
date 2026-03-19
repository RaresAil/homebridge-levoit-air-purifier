# Homebridge 2 Beta Main-Bridge Duplicate Registration

## Summary

Dynamic platform accessories appear to be handled twice on the main bridge path in Homebridge `beta-2.0.0`, which causes a fresh accessory registration to fail with:

`Tried to bridge <accessory> while it was already bridged by <bridge>`

## Observed With

- Homebridge: `2.0.0` from branch `beta-2.0.0`
- Plugin type: dynamic platform plugin
- Plugin under test: `homebridge-levoit-air-purifier`

## Reproduction

1. Use Homebridge `beta-2.0.0`.
2. Configure a dynamic platform plugin on the main bridge.
3. Start Homebridge with an empty accessory cache.
4. Let the plugin discover one new accessory and call `api.registerPlatformAccessories(...)`.

## Actual Result

Homebridge throws during accessory registration:

`Tried to bridge Purifier while it was already bridged by Homebridge V2 Live Test ...`

The plugin only receives one real device from the upstream API and only intends to register one main accessory UUID.

## Expected Result

`api.registerPlatformAccessories(...)` should bridge the new dynamic platform accessory once.

## Why This Looks Upstream

In the Homebridge beta main-bridge code path, `registerPlatformAccessories` appears to be wired twice:

- [`server.js:58`](/Users/tomdootson/Projects/homebridge/dist/server.js#L58)
- [`bridgeService.js:30`](/Users/tomdootson/Projects/homebridge/dist/bridgeService.js#L30)

The plugin worked in live child-bridge testing against the same Homebridge beta and same VeSync account, which suggests the failure is specific to the main-bridge event path.

## Extra Notes

- Live VeSync login succeeded.
- Live device discovery succeeded.
- Child bridge mode succeeded without the `already bridged` failure.
- The plugin was also updated to dedupe device UUIDs during discovery, and the main-bridge error still reproduced after that fix.
