// index.test.js
// INCOMPLETE TEST

import { MedoozeConnector, MedoozePlayer } from '../index.js';

describe('MedoozeConnector and MedoozePlayer Tests', () => {
  let pmsConnection;
  let srcObject;

  beforeAll(async () => {
    const connectionConfig = {
      host: '172.25.25.151',
      httpOnly: true,
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2MDAzNDczMTR9.WsryoZ6JGRHXeBopzH-SMcZUXhMvjdYc5YDwFci5F0Y',
      port: 8000,
      isCloudServer: false,
    };

    pmsConnection = await MedoozeConnector(connectionConfig);
    srcObject = await new MedoozePlayer({ pms: pmsConnection }).streamPromise;
  });

  test('pmsConnection.cameraList should exist and be an array with length > 1', () => {
    expect(pmsConnection.cameraList).toBeDefined();
    expect(Array.isArray(pmsConnection.cameraList)).toBe(true);
    expect(pmsConnection.cameraList.length).toBeGreaterThan(1);
  });

  test('srcObject should exist', () => {
    expect(srcObject).toBeDefined();
  });
});
