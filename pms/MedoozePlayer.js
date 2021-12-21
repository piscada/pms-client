/* eslint-disable no-console */
import MediaServerClient from '../lib/MediaServerClient'
import yaps from './yaps'
import { info, success } from '../utils/colorLog'

export default class MedoozePlayer {
  constructor(config) {
    // Constructor
    this.createPlayer(config)
  }

  createPlayer(config) {
    const { id, pms, instanceID, panelNumber = 1, onReconnect } = config

    this.id = id
    this.onReconnect = onReconnect
    this.instanceID = instanceID
    this.panelNumber = panelNumber

    this.pc = null
    this.ws = pms.ws
    this.tm = pms.tm
    this.viewerId = null

    this.stop = this.stop.bind(this)

    // Create managed peer connection
    this.client = new MediaServerClient(this.tm)

    // Auto reconnect listener if onReconnect is enabled
    if (onReconnect) {
      this.reconnect = () => {
        if (this.pc && this.client) this.reConnectListener()
      }
      this.ws.addEventListener('close', this.reconnect, { once: true })
    }

    // Important one here:
    // Need to resolve this.streamPromsise to get srcObject

    this.streamPromise = new Promise((resolve) => {
      this.createPeerConnection(this.client, resolve).then((pc) => {
        this.pc = pc
        this.tm
          .cmd('view', { id: this.id, instance: this.instanceID })
          .then((res) => {
            console.log({ response: res })
            this.viewerId = res.viewerId
          })
      })
    })
  }

  async createPeerConnection(cli, resolve) {
    let pc = null
    pc = await cli.createManagedPeerConnection()

    // On new remote tracks
    pc.ontrack = (event) => {
      const track = event.track
      this.stream = new MediaStream([track])
      resolve(this.stream)
    }

    return pc
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
    this.pc && this.pc.close() // WORKS
  }

  reConnectListener() {
    const delay = this.panelNumber * 1000

    // Subscribe to when pms reconnects
    const id = yaps.subscribe('pms_reconnect', (freshPMS) => {
      success(`New WS found. Connecting ${this.id} in ${delay}ms`, 'success')

      setTimeout(() => {
        // Remove the subscription
        yaps.unsubscribe(id)

        // Clean up pc and client
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
        this.onReconnect(this)
      }, delay)
    })

    info('added subscribe in player reconnectListener', id)
  }
}
