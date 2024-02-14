import MediaServerClient from '../lib/MediaServerClient.js'
import PeerConnectionClient from '../lib/PeerConnectionClient.js'
import MedoozeConnector from '../lib/MedoozeConnector.js'
import MedoozePlayer from '../lib/MedoozePlayer.js'
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
