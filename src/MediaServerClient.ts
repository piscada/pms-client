import { SDPInfo } from 'semantic-sdp'
import PeerConnectionClient from './PeerConnectionClient.js'
import TransactionManager from 'transaction-manager'

type Options = {
  sdpSemantics?: string
  strictW3C?: boolean
  forceSDPMunging?: boolean
}

export default class MediaServerClient {
  tm: TransactionManager
  ns: any // Type as per your namespace

  constructor(tm: TransactionManager) {
    // Crete namespace for us
    this.tm = tm
    this.ns = tm.namespace('medooze::pc')

    // Listen events
    this.ns.on('event', (event: any) => {
      // Check event name
      switch (event.name) {
        case 'stopped':
          // Stop us
          this.stop()
          break
      }
    })
  }

  async createManagedPeerConnection(
    options?: Options
  ): Promise<PeerConnectionClient> {
    // Check if running
    if (!this.ns)
      // Error
      throw new Error('MediaServerClient is closed')

    // Clone
    const cloned = { ...options }
    // Add unified plan flag for chrome
    cloned.sdpSemantics = 'unified-plan'
    // Create new peer connection
    const pc = new RTCPeerConnection()

    // Add sendonly transceivers for getting full codec capabilities
    pc.addTransceiver('video', { direction: 'sendonly' })

    // Hack for firefox to retrieve all the header extensions
    // try {
    //   const val = await video.sender.setParameters({
    //     encodings: [{ rid: 'a' }, { rid: 'b', scaleResolutionDownBy: 2.0 }],
    //     transactionId: '',
    //     codecs: [],
    //     headerExtensions: [],
    //     rtcp: undefined
    //   })

    //   console.log(val)
    // } catch (e) {
    //   console.log('Error setting parameters with firefox')
    //   console.log(e)
    // }

    // Create offer
    const offer = await pc.createOffer()

    // Parse local info
    const localInfo = SDPInfo.parse(offer.sdp.replace(': send rid=', ':send '))

    // Set local description
    await pc.setLocalDescription(offer)

    // Connect
    const remote = await this.ns.cmd('create', localInfo.plain())

    // Get peer connection id
    const id = remote.id
    // Create namespace for pc
    const pcNs = this.tm.namespace('medooze::pc::' + id)

    // create new managed pc client
    return new PeerConnectionClient({
      id,
      ns: pcNs,
      pc,
      remote,
      localInfo,
      strictW3C: options && options.strictW3C,
      forceSDPMunging: options && options.forceSDPMunging,
      forceRenegotiation: !(options && options.strictW3C)
    })
  }

  stop() {
    this.ns.close()
    this.ns = null
  }
}
