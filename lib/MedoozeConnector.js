import { snackbar, debug, success, warning } from '@piscada/snackbar'
import TransactionManager from 'transaction-manager'
import { fetchAllCamerasWithInstances } from './api'
import yaps from './yaps'
import { clientInfo } from '../index'

export class PMSConnector {
  // Check that not duplicate PMS-inits exist for this server
  constructor(settings) {
    this.serverConnect(settings)
  }

  serverConnect(settings) {
    const {
      host,
      httpOnly = true,
      token,
      port = 8000,
      isCloudServer,
      retries,
      isReconnecting
    } = settings

    // Sets default retries first time
    if (retries === undefined) {
      settings.retries = 10
    }

    const secure = httpOnly ? '' : 's'

    const url = `ws${secure}://${host}:${port}`
    const api = `http${secure}://${host}:${port}/api/v1`

    // Store vars

    this.settings = settings

    this.host = host
    this.httpOnly = httpOnly
    this.token = token
    this.port = port
    this.isCloudServer = isCloudServer
    this.url = url
    this.api = api
    this.isReconnecting = isReconnecting

    // Create websocket connection to PMS
    if (isReconnecting) {
      this.cameraList = this.createWebSocket()
    }
  }

  createWebSocket() {
    try {
      return new Promise((resolve) => {
        // Connect with websocket
        this.ws = new WebSocket(this.url + '?token=' + this.token, 'rtsp')

        // Crete transaction manager
        this.tm = new TransactionManager(this.ws)

        // Start on open
        this.ws.onopen = async () => {
          await this.checkBuildVersion()

          const camList = await this.fetchCamList()

          if (this.isReconnecting) {
            yaps.publish('pms_reconnect', this)
          }

          success('Added PMS-server successfully => ' + this.host)
          success('Connected to :: ' + this.host)
          resolve(camList)
        }

        // On socket close
        this.ws.onclose = () => {
          snackbar('Websocket closed', 'error')

          // If found , Try to reconnect
          if (this.settings.retries > 0) {
            this.reconnectWebSocket(this.settings)
          } else {
            resolve(
              `Timeout for PMS: ${this.host} - To bypass SSL verification \n => ${this.api}`
            )
          }
        }
      })
    } catch (error) {
      return new Error(error)
    }
  }

  async checkBuildVersion() {
    const response = await fetch(this.api + '/config/version', {
      headers: {
        Authorization: 'bearer ' + this.token
      }
    })

    const pmsBuild = await response.json()
    const clientBuild = clientInfo

    if (pmsBuild.version !== clientBuild.version) {
      warning(
        `PMS version ${pmsBuild.version} is not compatible with PMS-client version ${clientBuild.version}. Please the PMS to ${clientBuild.version} or higher.`,
        'error'
      )
    }
  }

  async fetchCamList() {
    let camList = []

    // If PMCS
    if (this.isCloudServer) {
      camList = await fetchAllCamerasWithInstances(this.api, this.token)
      console.log('cloud fetch', { camList })
    }

    // If PMS
    else {
      const response = await fetch(this.api + '/cameras', {
        headers: {
          Authorization: 'bearer ' + this.token
        }
      })

      // Add cameralist
      camList = await response.json()
    }

    return camList
  }

  reconnectWebSocket(settings) {
    settings.retries--
    settings.isReconnecting = true

    debug(
      `Reconnecting, attempts left: #${settings.retries} for ${settings.host}`
    )
    setTimeout(() => {
      this.serverConnect(settings)
    }, 3000)
  }
}

export default async function MedoozeConnector(settings) {
  const o = new PMSConnector(settings)
  o.cameraList = await o.createWebSocket()
  return o
}
