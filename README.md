# pms-client

Library files for creating WebRTC connection to PMS-server:
exports:
- MediaServerClient
- MedoozeConnector
- MedoozePlayer
- PeerConnectionClient
- clientInfo.json

Also contains a small Pub/Sub (lib/yaps.js) to handle reconnection to PMS-server.

## Deployment compatibility

When pushing to `master` branch pipeline automatically patches `x.y.(z+1)` e.g. `2.6.3` => `2.6.4`

If the PMS-server has done upgrades, the **equivalent version** should also be upped in the pms-client, so **they are the same**

| PMS version | PMS client |
| ----------- | ------- |
| v2.4.9 >=   | Legacy (broken)|
| v.2.6.1     | v2.6.1     |

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
