import { debug, success, error as errorMsg } from '@piscada/snackbar'
import { TransactionManager } from './transaction-manager'
import { PmsCameraItem, fetchAllCamerasWithInstances } from './api'
import yaps from './yaps'
import clientInfo from './clientInfo'
import { extractMajorMinorVersion, compareMinorVersions } from './helpers'

interface PMSConnectorSettings {
  host: string
  httpOnly?: boolean
  token: string
  port?: number
  isCloudServer: boolean
  retries?: number
  isReconnecting?: boolean
}

interface ClientInfo {
  buildDate: string
  version: string
}

export class PMSConnector {
  settings: PMSConnectorSettings
  host: string
  httpOnly: boolean
  token: string
  port: number
  isCloudServer: boolean
  url: string
  api: string
  isReconnecting?: boolean
  clientInfo: ClientInfo
  requiredVersion: string
  compatible: boolean | null
  ws: WebSocket | null
  tm: TransactionManager | null
  cameraList: Promise<PmsCameraItem[]> | PmsCameraItem[]

  constructor(settings: PMSConnectorSettings) {
    this.serverConnect(settings)
  }

  serverConnect(settings: PMSConnectorSettings) {
    const {
      host,
      httpOnly = true,
      token,
      port = 8000,
      isCloudServer,
      retries,
      isReconnecting
    } = settings

    if (retries === undefined) {
      settings.retries = 10
    }

    const secure = httpOnly ? '' : 's'

    const url = `ws${secure}://${host}:${port}`
    const api = `http${secure}://${host}:${port}/api/v1`

    this.settings = settings
    this.host = host
    this.httpOnly = httpOnly
    this.token = token
    this.port = port
    this.isCloudServer = isCloudServer
    this.url = url
    this.api = api
    this.isReconnecting = isReconnecting
    this.clientInfo = clientInfo
    this.requiredVersion = extractMajorMinorVersion(clientInfo.version)
    this.compatible = null

    if (isReconnecting) {
      this.cameraList = this.createWebSocket()
    }
  }

  createWebSocket(): Promise<PmsCameraItem[]> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url + '?token=' + this.token, 'rtsp')
        this.tm = new TransactionManager(this.ws)

        this.ws.onopen = async () => {
          this.compatible = await this.checkBuildVersion()
          const camList = await this.fetchCamList()

          if (this.isReconnecting) {
            yaps.publish('pms_reconnect', this)
          }

          success('Added PMS-server successfully => ' + this.host)
          success('Connected to :: ' + this.host)
          resolve(camList)
        }

        this.ws.onclose = () => {
          errorMsg('Websocket closed')
          if (this.settings.retries > 0) {
            this.reconnectWebSocket(this.settings)
          } else {
            reject(
              new Error(
                `Timeout for PMS: ${this.host} - To bypass SSL verification \n => ${this.api}`
              )
            )
          }
        }
      } catch (error) {
        return new Error(error)
      }
    })
  }

  async checkBuildVersion(): Promise<boolean> {
    try {
      const response = await fetch(this.api + '/config/version', {
        headers: {
          Authorization: 'bearer ' + this.token
        }
      })

      const pmsBuild = await response.json()
      const clientBuild = this.clientInfo

      if (
        compareMinorVersions(pmsBuild.version, clientBuild.version) === false
      ) {
        errorMsg(
          `
          ***
          PMS version ${pmsBuild.version} is not compatible with PMS-client version ${clientBuild.version}. 
          Please upgrade PMS ${this.host} to ${this.requiredVersion} or higher.
          ***
          `
        )
        return false
      }
      return true
    } catch (err) {
      errorMsg(
        ` 
        *** 
        Could not read PMS-version from /config/version endpoint. 
        Upgrade PMS server ${this.host} to ${this.requiredVersion} or higher
        ***
        `
      )
      return false
    }
  }

  async fetchCamList(): Promise<PmsCameraItem[]> {
    let camList: PmsCameraItem[] = []
    if (this.isCloudServer) {
      camList = await fetchAllCamerasWithInstances(this.api, this.token)
      console.log('cloud fetch', { camList })
    } else {
      const response = await fetch(this.api + '/cameras', {
        headers: {
          Authorization: 'bearer ' + this.token
        }
      })
      camList = await response.json()
    }
    return camList
  }

  reconnectWebSocket(settings: PMSConnectorSettings) {
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

export default async function MedoozeConnector(settings: PMSConnectorSettings) {
  const connector = new PMSConnector(settings)
  connector.cameraList = await connector.createWebSocket()
  return connector
}
