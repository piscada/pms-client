# pms-client

Library files for creating WebRTC connection to PMS-server:

- MediaServerClient
- MedoozeConnector
- MedoozePlayer
- PeerConnectionClient

Also contains a small Pub/Sub lib (src/yaps.js) to handle reconnection to PMS-server.

## Version compatibility

The PMS-server and the pms-client should always follow the **equivalent minor version**.

E.g 2.X.123 <=> 2.X.414.

X should be the same minor version.

| PMS version | @piscada/pms-client        |
| ----------- | -------------------------- |
| <2.4.9      | Deprecated with pms-client |
| 2.6.0       | 2.6.1                      |
| 2.7.0       | 2.7.1                      |

The pms-client will show warnings in the console if there are the PMS is deprecated/miss-aligned with its version.

## Use package

To use

```bash
npm i @piscada/pms-client
# or
yarn add piscada@pms-client
```

### Update package and deploy

Bitbucket pipelines are slow and sluggish. Deploy from localhost instead:

    npm run deploy

To just test build

    npm run build

## Future improvements

- ~~PMS compatibilty check~~
- Add examples (for now check integration in WebPMP v3 and PMSWE)
- Rewrite to typescript
- Tests
