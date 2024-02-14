import { MedoozeConnector, MedoozePlayer } from '../types/index.js'

const connectionConfig = {
  host: '172.25.25.151',
  httpOnly: true,
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2MDAzNDczMTR9.WsryoZ6JGRHXeBopzH-SMcZUXhMvjdYc5YDwFci5F0Y',
  port: 8000,
  isCloudServer: false
}

const pmsConnection = await MedoozeConnector(connectionConfig)
pmsConnection.cameras = pmsConnection.cameraList

const conf = {
  id: 'PI-02',
  pmsConnection
}

const playerInstance = new MedoozePlayer(conf)

// Must await the MediaStream since it is event-based
const srcObject = await playerInstance.streamPromise

console.log({ srcObject })
