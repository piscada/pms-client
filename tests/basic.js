import { MedoozeConnector as medoozeConnect } from '../lib/MedoozeConnector.js'
import { MedoozePlayer } from '../lib/MedoozePlayer.js'



const connectionConfig = {
  host: "pms",
  httpOnly: true,
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2MDAzNDczMTR9.WsryoZ6JGRHXeBopzH-SMcZUXhMvjdYc5YDwFci5F0Y",
  port: 8000,
  isCloudServer: false
}

const pmsConnection = await medoozeConnect(connectionConfig)
pmsConnection.cameras = pmsConnection.cameraList

// Get server-settings:
const pms = store.state.MultiCamera.pms.servers.find(
  (el) => el.host === this.stream.pmsHostname
)

const conf = {
  id: camera.id,
  pms,
  onReconnect: this.onReconnect
}

this.playerInstance = new MedoozePlayer(conf)

// Must await the MediaStream since it is event-based
this.srcObject = await this.playerInstance.streamPromise
