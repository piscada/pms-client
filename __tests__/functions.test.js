import MediaServerClient from '../lib/MediaServerClient.ts'
import PeerConnectionClient from '../lib/PeerConnectionClient.ts'
import MedoozeConnector from '../lib/MedoozeConnector.ts'
import MedoozePlayer from '../lib/MedoozePlayer.ts'
import clientInfo from '../clientInfo.js'

describe('Test Module Import', () => {
  it('should import all modules without errors', () => {
    expect(MediaServerClient).toBeDefined()
    expect(PeerConnectionClient).toBeDefined()
    expect(MedoozeConnector).toBeDefined()
    expect(MedoozePlayer).toBeDefined()
    expect(clientInfo).toBeDefined()
  })
})
