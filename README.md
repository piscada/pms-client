# pms-client

Library files for creating WebRTC connection to PMS-server:
exports:
- MediaServerClient
- MedoozeConnector
- MedoozePlayer
- PeerConnectionClient
- clientInfo.json

Also contains a small Pub/Sub (lib/yaps.js) to handle reconnection to PMS-server.

## Deployment and compatibility

To upgrade the package set semantic versioning by `git tag`, `v2.6.3`

If the PMS-server has done upgrades, the **equivalent version** should also be upped in the pms-client, so **they are the same**

| PMS version | @piscada/pms-client            |
| ----------- | --------------------- |
| <2.4.9    | Legacy   (broken)     |
| >=2.6.0    | >=2.6.0               |

### Warnings
The pms-client will show warnings in the console if there are old/miss-aligned versions between the PMS and pms-client.

## Use package

To use

    npm i @piscada/pms-client
    
    yarn add piscada@pms-client

## Future improvements


- ~~PMS compatibilty check~~ 
- Add examples (for now check integration in WebPMP v3 and PMSWE)
- Rewrite to typescript
- Tests
