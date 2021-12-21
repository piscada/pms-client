<template>
  <div v-if="pmsInstance" class="container">
    <h1>Player</h1>

    <div class="sidebyside padding">
      <div class="mediabox">
        <camera-stream :src-object="srcObject" @stoploading="stopLoading" />
      </div>
      <div>
        <div class="selectBox spaceme">
          <select
            v-model="selectedCamera"
            class="u-full-width"
            @change="addMedoozeVideo()"
          >
            <option v-for="cam in cameraList" :key="cam.id" :value="cam">
              {{ cam.id }} {{ cam.instance && `(instance: ${cam.instance})` }}
            </option>
          </select>
        </div>
        <div>
          <button class="spaceme" @click="stopStream()">Stop</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import "./axios.min.js"
import medoozeConnector from '../../pms/MedoozeConnector.js'
import CameraStream from './CameraStream'

import { cancel, success } from '../../utils/colorLog'
import MedoozePlayer from '../../pms/MedoozePlayer.js'

export default {
  components: {
    CameraStream
  },
  data() {
    return {
      dumpIsRunning: false,
      config: {},
      selectedCamera: { id: '-', instance: '-' },
      pmsInstance: null,
      srcObject: {},

      playerInstance: null
    }
  },
  beforeDestroy() {
    this.stopStream()
  },
  created() {
    this.getConfig().then(async () => {
      this.pmsInstance = await medoozeConnector({
        host: this.config.webrtc.ip,
        httpOnly: this.config.https.httpOnly,
        port: this.config.https.port,
        token: this.$store.state.bearerToken,
        isCloudServer: this.config.meta?.isCloudServer
      })
      this.setCameraList(this.pmsInstance.cameraList)
    })
  },
  methods: {
    stopStream() {
      if (this.playerInstance) {
        cancel('stopping stream')
        this.playerInstance.stop()
      }
    },
    stopLoading() {
      this.loading = false
    },
    getConfig() {
      return axios.get('/api/v1/config/').then((res) => {
        this.config = res.data
      })
    },

    async onReconnect(pms) {
      success('new player ready:', pms)
      this.srcObject = await pms.streamPromise
    },

    async addMedoozeVideo() {
      this.stopStream()

      this.loading = true

      // Create player
      this.playerInstance = new MedoozePlayer({
        id: this.selectedCamera.id,
        pms: this.pmsInstance,
        instanceID: this.selectedCamera.instance,
        onReconnect: this.onReconnect
      })

      // Must await the MediaStream since it is event-based
      this.srcObject = await this.playerInstance.streamPromise
    }
  }
}
</script>
