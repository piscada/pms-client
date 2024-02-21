import { MediaServerClient, PeerConnectionClient, MedoozeConnector, MedoozePlayer, clientInfo } from '../index';

describe('Test Module Import', () => {
  it('should import all modules without errors', () => {
    expect(MediaServerClient).toBeDefined();
    expect(PeerConnectionClient).toBeDefined();
    expect(MedoozeConnector).toBeDefined();
    expect(MedoozePlayer).toBeDefined();
    expect(clientInfo).toBeDefined();
  });
});
