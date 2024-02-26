import { info, success } from '@piscada/snackbar'
import MediaServerClient from './MediaServerClient'
import yaps from './yaps'
import TransactionManager from 'transaction-manager'
import PeerConnectionClient from './PeerConnectionClient'
import { PMSConnector } from './MedoozeConnector'

interface PlayerConfig {
  id: string
  pms: {
    ws: WebSocket
    tm: TransactionManager
  }
  instanceID: string
  panelNumber?: number
  onReconnect?: (instance: MedoozePlayer) => void
}

interface TransactionManagerError {
  error?: string
}

interface ViewResponse extends TransactionManagerError {
  viewerId?: string
}

export default class MedoozePlayer {
  id: string
  onReconnect?: (instance: MedoozePlayer) => void
  instanceID: string
  panelNumber: number
  pcc: PeerConnectionClient
  ws: WebSocket
  tm: TransactionManager
  viewerId: string | null
  client: MediaServerClient
  streamPromise: Promise<MediaStream | null>
  stream: MediaStream | null
  reconnect: () => void

  constructor(config: PlayerConfig) {
    // Constructor
    this.createPlayer(config)
  }

  createPlayer(config: PlayerConfig) {
    const { id, pms, instanceID, panelNumber = 1, onReconnect } = config

    this.id = id
    this.onReconnect = onReconnect
    this.instanceID = instanceID
    this.panelNumber = panelNumber

    this.pcc = null
    this.ws = pms.ws
    this.tm = pms.tm
    this.viewerId = null

    this.stop = this.stop.bind(this)
    this.pause = this.pause.bind(this)
    this.unPause = this.unPause.bind(this)

    // Create managed peer connection
    this.client = new MediaServerClient(this.tm)

    // Auto reconnect listener if onReconnect is enabled
    if (onReconnect) {
      this.reconnect = () => {
        if (this.pcc && this.client) this.reConnectListener()
      }
      this.ws.addEventListener('close', this.reconnect, { once: true })
    }

    // Important one here:
    // Need to resolve this.streamPromise to get srcObject

    this.streamPromise = new Promise((resolve, reject) => {
      ;(async () => {
        try {
          const pcc = await this.createPeerConnection(
            this.client,
            resolve,
            this.id
          )
          this.pcc = pcc

          const res: ViewResponse = await this.tm.cmd('view', {
            id: this.id,
            instance: this.instanceID,
            pcId: pcc.id
          })
          console.log({ response: res })

          if (res.error) {
            return reject(res.error)
          }

          this.viewerId = res.viewerId
        } catch (err) {
          return reject(err)
        }
      })()
    })
  }

  async createPeerConnection(
    cli: MediaServerClient,
    resolve: (stream: MediaStream) => void,
    camId: string
  ) {
    const pcc: PeerConnectionClient = await cli.createManagedPeerConnection()

    // On new remote tracks
    pcc.ontrack = (event) => {
      if (event.remoteTrackId === camId) {
        const track = event.track
        this.stream = new MediaStream([track])
        resolve(this.stream)
      }
    }

    return pcc
  }

  pause() {
    const id = this.id

    if (this.id) {
      console.log('unviewing', id)
      this.tm.cmd('unview', { id, instance: this.instanceID })
    }
  }

  async unPause() {
    if (this.pcc && this.id) {
      try {
        const res: ViewResponse = await this.tm.cmd('view', {
          id: this.id,
          instance: this.instanceID,
          pcId: this.pcc.id
        })
        console.log({ response: res })

        if (res.error) {
          return res.error
        }

        this.viewerId = res.viewerId
      } catch (err) {
        return err
      }
    }
  }

  stop() {
    const id = this.id

    // Remove the single listener if defined
    this.onReconnect && this.ws.removeEventListener('close', this.reconnect)

    // Only if WS is open. TM gives error
    if (id) {
      console.log('unviewing', id)
      this.tm.cmd('unview', { id, instance: this.instanceID })
    }

    // Clean up event listener and namespace + tm
    this.client.ns !== null && this.client.stop()

    // Closing the PeerConnection directly. No need to wait for ontrackended.
    this.pcc && this.pcc.close() // WORKS
  }

  reConnectListener() {
    const delay = this.panelNumber * 1000

    // Subscribe to when pms reconnects
    const id = yaps.subscribe('pms_reconnect', (freshPMS: PMSConnector) => {
      success(`New WS found. Connecting ${this.id} in ${delay}ms`, 'success')

      setTimeout(() => {
        // Remove the subscription
        yaps.unsubscribe(id)

        // Clean up pcc and client
        this.stop()

        // Recreate the player, and thus "this"
        this.createPlayer({
          id: this.id,
          pms: freshPMS,
          instanceID: this.instanceID,
          panelNumber: this.panelNumber,
          onReconnect: this.onReconnect
        })

        // Use callback to set the srcObject
        this.onReconnect?.(this)
      }, delay)
    })

    info('added subscribe in player reconnectListener', id)
  }
}
