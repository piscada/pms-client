import { info, success } from '@piscada/snackbar'
import MediaServerClient from './MediaServerClient'
import TransactionManager from 'transaction-manager'
import PeerConnectionClient from './PeerConnectionClient'
import { PMSConnector } from './MedoozeConnector'
import yaps from './yaps'

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

class MedoozePlayer {
  id: string
  instanceID: string
  panelNumber: number
  onReconnect?: (instance: MedoozePlayer) => void
  ws: WebSocket
  tm: TransactionManager
  client: MediaServerClient
  pcc: PeerConnectionClient
  viewerId: string | null
  streamPromise: Promise<MediaStream | null>
  stream: MediaStream | null

  constructor(config: PlayerConfig) {
    this.createPlayer(config)
  }

  createPlayer(config: PlayerConfig): void {
    this.id = config.id
    this.instanceID = config.instanceID
    this.panelNumber = config.panelNumber || 1
    this.onReconnect = config.onReconnect
    this.ws = config.pms.ws
    this.tm = config.pms.tm

    this.client = new MediaServerClient(this.tm)
    this.pcc = null
    this.viewerId = null
    this.stream = null
    this.streamPromise = this.createStreamPromise()
    if (this.onReconnect) {
      this.setupReconnectListener()
    }
  }

  private async createStreamPromise(): Promise<MediaStream | null> {
    try {
      const pcc = await this.createPeerConnection(this.client, this.id)
      this.pcc = pcc
      const res: ViewResponse = await this.tm.cmd('view', {
        id: this.id,
        instance: this.instanceID,
        pcId: pcc.id
      })
      if (res.error) {
        throw new Error(res.error)
      }
      this.viewerId = res.viewerId
      return this.stream
    } catch (error) {
      console.error('Error creating stream:', error)
      return null
    }
  }

  private async createPeerConnection(
    cli: MediaServerClient,
    camId: string
  ): Promise<PeerConnectionClient> {
    const pcc = await cli.createManagedPeerConnection()
    pcc.ontrack = (event) => {
      if (event.remoteTrackId === camId) {
        const track = event.track
        this.stream = new MediaStream([track])
      }
    }
    return pcc
  }

  private setupReconnectListener(): void {
    const delay = this.panelNumber * 1000
    const id = yaps.subscribe('pms_reconnect', (freshPMS: PMSConnector) => {
      success(`New WS found. Connecting ${this.id} in ${delay}ms`, 'success')
      setTimeout(() => {
        yaps.unsubscribe(id)
        this.reconnect(freshPMS)
      }, delay)
    })
    info('added subscribe in player reconnectListener', id)
  }

  private reconnect(freshPMS: PMSConnector): void {
    this.stop()
    this.createPlayer({
      id: this.id,
      pms: freshPMS,
      instanceID: this.instanceID,
      panelNumber: this.panelNumber,
      onReconnect: this.onReconnect
    })
    this.onReconnect?.(this)
  }

  private stop(): void {
    this.onReconnect && this.ws.removeEventListener('close', this.reconnect)
    if (this.id) {
      console.log('unviewing', this.id)
      this.tm.cmd('unview', { id: this.id, instance: this.instanceID })
    }
    this.client.ns !== null && this.client.stop()
    this.pcc && this.pcc.close()
  }

  pause(): void {
    if (this.id) {
      console.log('unviewing', this.id)
      this.tm.cmd('unview', { id: this.id, instance: this.instanceID })
    }
  }

  async unPause(): Promise<string | Error | void> {
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

  // Add other public methods (pause, unpause, etc.)
}

export default MedoozePlayer
