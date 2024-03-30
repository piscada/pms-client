import { SDPInfo, SDPInfoParams, StreamInfo, TrackInfo } from 'semantic-sdp'
import {
  AllowedMessages,
  Namespace,
  Event as TmEvent
} from './transaction-manager'
import { TrackInfoLike } from 'semantic-sdp/dist/TrackInfo'

interface MedoozeTrackInfo extends TrackInfo {
  streams?: readonly MediaStream[]
}

type MedoozeRTCRtpSender = RTCRtpSender & {
  trackInfo?: MedoozeTrackInfo
  streamId?: string
}

type MedoozeRTCRtpTransceiver = RTCRtpTransceiver & {
  pending?: boolean
  stopped?: boolean
  trackInfo?: MedoozeTrackInfo
  streamId?: string
  trackId?: string
  fixSimulcastEncodings?: RTCRtpEncodingParameters[]
  sender?: MedoozeRTCRtpTransceiver
  codecs?: string[]
}

export interface MedoozeRTCTrackEvent extends Event {
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/RTCTrackEvent/receiver) */
  readonly receiver: RTCRtpReceiver
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/RTCTrackEvent/streams) */
  readonly streams: ReadonlyArray<MediaStream>
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/RTCTrackEvent/track) */
  readonly track: MediaStreamTrack
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/RTCTrackEvent/transceiver) */
  transceiver: MedoozeRTCRtpTransceiver
  remoteStreamId?: string
  remoteTrackId?: string
}

interface MedoozeRTCTrackEventInit extends EventInit {
  receiver: RTCRtpReceiver
  streams?: MediaStream[]
  track: MediaStreamTrack
  transceiver: MedoozeRTCRtpTransceiver
  remoteStreamId?: string
  remoteTrackId?: string
}

declare const MedoozeRTCTrackEvent: {
  prototype: MedoozeRTCTrackEvent
  new (
    type: string,
    eventInitDict: MedoozeRTCTrackEventInit
  ): MedoozeRTCTrackEvent
}

export type SdpString = string

export type PeerConnectionParams = {
  id: string
  ns: Namespace<string, AllowedMessages>
  pc: RTCPeerConnection
  remote: SDPInfoParams
  localInfo: SDPInfo
  strictW3C: boolean
  forceSDPMunging: boolean
  forceRenegotiation: boolean
}
// cSpell:disable

export default class PeerConnectionClient {
  id: string
  ns: Namespace<string, AllowedMessages>
  pc: RTCPeerConnection
  remote: SDPInfoParams
  localInfo: SDPInfo
  remoteInfo: SDPInfo
  streams: Record<string, StreamInfo>
  strictW3C: boolean
  forceSDPMunging: boolean
  forceRenegotiation: boolean
  pending: Set<MedoozeRTCRtpTransceiver>
  renegotiating: boolean
  adding: Set<MedoozeRTCRtpTransceiver>
  removing: Set<MedoozeRTCRtpTransceiver>
  ontrack: (event: MedoozeRTCTrackEvent) => void
  ontrackended: (event: MedoozeRTCTrackEvent) => void

  constructor(params: PeerConnectionParams) {
    // Initialize properties
    this.id = params.id
    this.ns = params.ns
    this.pc = params.pc
    this.remote = params.remote
    this.localInfo = params.localInfo
    this.remoteInfo = null
    this.streams = {}
    this.strictW3C = params.strictW3C
    this.forceSDPMunging = params.forceSDPMunging
    this.forceRenegotiation = params.forceRenegotiation
    this.pending = new Set<MedoozeRTCRtpTransceiver>()
    this.renegotiating = false
    this.adding = new Set<MedoozeRTCRtpTransceiver>()
    this.removing = new Set<MedoozeRTCRtpTransceiver>()

    // Disable all existing transceivers
    this.pc
      .getTransceivers()
      .forEach((transceiver: MedoozeRTCRtpTransceiver) => {
        transceiver.direction = 'inactive'
        transceiver.pending = true
        this.pending.add(transceiver)
      })

    // Dummy events
    this.ontrack = (event) => console.log('ontrack', event)
    this.ontrackended = (event) => console.log('ontrackended', event)

    // Forward events
    this.pc.ontrack = (event: MedoozeRTCTrackEvent) => {
      event.transceiver.trackInfo.streams = event.streams
      event.remoteStreamId = event.transceiver.streamId
      event.remoteTrackId = event.transceiver.trackId
      try {
        this.ontrack(event)
      } catch (e) {
        console.error(e)
      }
    }

    this.pc.getTransceivers = () => {
      return this.pc.getTransceivers() as MedoozeRTCRtpTransceiver[]
    }

    this.pc.onnegotiationneeded = () => this.renegotiate()

    // Listen for events
    this.ns.on('event', (event: TmEvent) => {
      const data = event.data
      switch (event.name) {
        case 'addedtrack':
          this.adding.add(data as MedoozeRTCRtpTransceiver)
          this.renegotiate()
          break
        case 'removedtrack':
          this.removing.add(data as MedoozeRTCRtpTransceiver)
          this.renegotiate()
          break
        case 'stopped':
          this.close()
          break
      }
    })

    // Renegotiate now
    this.renegotiate()
  }

  async renegotiate() {
    let simulcast03 = false

    if (this.renegotiating) return

    this.renegotiating = true

    // Process additions first
    for (const data of this.adding) {
      let transceiver: MedoozeRTCRtpTransceiver
      const trackInfo: MedoozeTrackInfo = TrackInfo.expand(data.track)
      for (const reused of this.pc.getTransceivers() as MedoozeRTCRtpTransceiver[]) {
        if (
          reused.receiver.track.kind === trackInfo.getMedia() &&
          reused.direction === 'inactive' &&
          !reused.pending &&
          !reused.stopped
        ) {
          transceiver = reused
          transceiver.direction = 'recvonly'
          break
        }
      }
      if (!transceiver)
        // MedoozeRTCRtpTransceiver
        transceiver = this.pc.addTransceiver(trackInfo.getMedia(), {
          direction: 'recvonly'
        }) as MedoozeRTCRtpTransceiver

      let stream = this.streams[data.streamId]
      if (!stream)
        this.streams[data.streamId] = stream = new StreamInfo(data.streamId)
      stream.addTrack(trackInfo)

      transceiver.streamId = data.streamId
      transceiver.trackId = trackInfo.getId()
      transceiver.trackInfo = trackInfo
      transceiver.pending = true
      this.pending.add(transceiver)
    }
    this.adding.clear()

    // Process pending tracks to be removed
    for (const data of this.removing) {
      const streamInfo = this.streams[data.streamId]
      const trackInfo = streamInfo.getTrack(data.trackId)
      const mid = trackInfo.getMediaId()
      for (const transceiver of this.pc.getTransceivers() as MedoozeRTCRtpTransceiver[]) {
        if (
          !transceiver.pending &&
          transceiver.mid &&
          transceiver.mid === mid
        ) {
          transceiver.direction = 'inactive'
          streamInfo.removeTrack(trackInfo)
          if (!streamInfo.getTracks().size)
            delete this.streams[transceiver.streamId]
          try {
            this.ontrackended(
              new MedoozeRTCTrackEvent('trackended', {
                receiver: transceiver.receiver,
                track: transceiver.receiver.track,
                streams: trackInfo.streams,
                transceiver,
                remoteStreamId: streamInfo.getId(),
                remoteTrackId: trackInfo.getId()
              })
            )
          } catch (e) {
            console.error(e)
          }
          delete transceiver.streamId
          delete transceiver.trackId
          delete transceiver.trackInfo
          this.removing.delete(data)
          break
        }
      }
    }

    const processing = this.pending
    this.pending = new Set()
    const transceivers = this.pc.getTransceivers() as MedoozeRTCRtpTransceiver[]

    if (this.pc.signalingState !== 'have-local-offer') {
      const offer = await this.pc.createOffer()
      let sdp = offer.sdp

      if (!this.strictW3C) {
        sdp = fixLocalSDP(sdp, transceivers)
        if (this.forceSDPMunging)
          offer.sdp = sdp
            .replace(/a=simulcast(.*)\r\n/, '')
            .replace(/a=rid(.*)\r\n/, '')
        else offer.sdp = sdp
      }

      await this.pc.setLocalDescription(offer)

      if (!this.strictW3C) simulcast03 = offer.sdp.includes(': send rid=')

      const sdpInfo = simulcast03
        ? offer.sdp.replace(': send rid=', ':send ')
        : sdp
      this.localInfo = SDPInfo.parse(sdpInfo)
    } else {
      simulcast03 = (
        this.pc.pendingLocalDescription || this.pc.currentLocalDescription
      ).sdp.includes(': send rid=')
    }

    this.remoteInfo = this.localInfo.answer(this.remote)

    for (const transceiver of this.pc.getTransceivers() as MedoozeRTCRtpTransceiver[]) {
      if (transceiver.codecs && transceiver.mid) {
        const localMedia = this.localInfo.getMediaById(transceiver.mid)
        const capabilities = this.remote.capabilities[localMedia.getType()]
        if (!capabilities) continue
        const cloned = { ...capabilities }
        cloned.codecs = []
        for (const codec of transceiver.codecs)
          for (const supported of capabilities.codecs as string[])
            if (codec.toLowerCase() === supported.split(';')[0].toLowerCase())
              cloned.codecs.push(supported)
        const answer = localMedia.answer(cloned)
        this.remoteInfo.replaceMedia(answer)
      }
    }

    for (const transceiver of processing) {
      if (transceiver.direction === 'sendonly') {
        const mid = transceiver.mid
        const trackInfo = this.localInfo.getTrackByMediaId(mid)
        this.ns.event('addedtrack', {
          streamId: transceiver.sender.streamId,
          track: trackInfo.plain()
        })
        transceiver.sender.trackInfo = trackInfo
      } else if (transceiver.direction === 'recvonly') {
        const mid = transceiver.mid
        const trackInfo = transceiver.trackInfo
        trackInfo.setMediaId(mid)
      } else if (
        transceiver.direction === 'inactive' &&
        transceiver.sender &&
        transceiver.sender.trackInfo
      ) {
        this.ns.event('removedtrack', {
          streamId: transceiver.sender.streamId,
          trackId: transceiver.sender.trackInfo.getId()
        })
        delete transceiver.sender.streamId
        delete transceiver.fixSimulcastEncodings
      }
    }

    for (const stream of Object.values(this.streams)) {
      const cloned = new StreamInfo(stream.getId())
      for (const [_, track] of stream.getTracks())
        if (track.getMediaId()) cloned.addTrack(track)
      this.remoteInfo.addStream(cloned)
    }

    let sdp = this.remoteInfo.toString()
    if (this.forceSDPMunging)
      sdp = sdp.replace(/a=simulcast(.*)\r\n/, '').replace(/a=rid(.*)\r\n/, '')

    if (simulcast03) sdp = sdp.replace(':recv ', ': recv rid=')

    await this.pc.setRemoteDescription({
      type: 'answer',
      sdp
    })

    for (const transceiver of processing) delete transceiver.pending

    this.renegotiating = false

    if (this.pending.size || this.removing.size || this.adding.size)
      this.renegotiate()
  }

  getStats(selector: MediaStreamTrack | null) {
    return this.pc.getStats(selector)
  }

  async addTrack(track: string | MediaStreamTrack, stream: any, params: any) {
    let transceiver: MedoozeRTCRtpTransceiver
    let force = this.forceRenegotiation
    const sendEncodings: RTCRtpEncodingParameters[] = params?.encodings || []

    try {
      transceiver = this.pc.addTransceiver(track, {
        direction: 'sendonly',
        streams: stream ? [stream] : [],
        sendEncodings: !this.forceSDPMunging ? sendEncodings : undefined
      }) as MedoozeRTCRtpTransceiver
    } catch (e) {
      if (this.strictW3C) throw e
      transceiver = this.pc.addTransceiver(track, {
        direction: 'sendonly',
        streams: stream ? [stream] : []
      }) as MedoozeRTCRtpTransceiver
    }

    transceiver.sender.streamId = stream ? stream.id : '-'

    if (!this.strictW3C)
      try {
        if (sendEncodings.length) {
          await transceiver.sender.setParameters({
            encodings: sendEncodings,
            transactionId: '',
            codecs: [],
            headerExtensions: [],
            rtcp: undefined
          })
          force = true
        }
      } catch (e) {
        console.error(e)
      }

    if (!this.strictW3C) {
      const sendParameters = transceiver.sender.getParameters()
      if (sendParameters.encodings) {
        if (sendParameters.encodings.length !== sendEncodings.length)
          transceiver.fixSimulcastEncodings = sendEncodings
        else this.forceSDPMunging = false
      }
    }
    // If we have to override codec
    if (params && params.codecs)
      // Set it on transceicer
      transceiver.codecs = params.codecs

    transceiver.pending = true
    this.pending.add(transceiver)

    if (force) setTimeout(() => this.renegotiate(), 0)
    return transceiver.sender
  }

  removeTrack(sender: TrackInfo) {
    // INCOMPLETE? NEver used?
    for (const transceiver of this.pc.getTransceivers() as MedoozeRTCRtpTransceiver[]) {
      if (transceiver.sender === sender) {
        transceiver.pending = true
        this.pending.add(transceiver)
      }
    }
    this.pc.removeTrack(sender)
  }

  close() {
    console.log('closing pc')
    this.pc && this.pc.close()
    this.ns && this.ns.close()
    this.pc = null
    this.ns = null
  }
}

let ssrcGen = 0

function getNextSSRC() {
  return ++ssrcGen
}

function fixLocalSDP(sdp: SdpString, transceivers: MedoozeRTCRtpTransceiver[]) {
  let ini = sdp.indexOf('\r\nm=')
  let fixed = sdp.substr(0, ini !== -1 ? ini + 2 : ini)

  for (const transceiver of transceivers) {
    const end = sdp.indexOf('\r\nm=', ini + 4)
    let media = sdp.substring(ini + 2, end !== -1 ? end + 2 : undefined)
    ini = end

    const fixSimulcastEncodings = transceiver.fixSimulcastEncodings
      ? transceiver.fixSimulcastEncodings.sort(
          (a: RTCRtpEncodingParameters, b: RTCRtpEncodingParameters) => {
            return (
              (b.scaleResolutionDownBy || 1) - (a.scaleResolutionDownBy || 1)
            )
          }
        )
      : null

    if (fixSimulcastEncodings && !fixSimulcastEncodings.inited) {
      const reg1 = RegExp('m=video.*?a=ssrc:(\\d*) cname:(.+?)\\r\\n', 's')
      const reg2 = RegExp('m=video.*?a=ssrc:(\\d*) mslabel:(.+?)\\r\\n', 's')
      const reg3 = RegExp('m=video.*?a=ssrc:(\\d*) msid:(.+?)\\r\\n', 's')
      const reg4 = RegExp('m=video.*?a=ssrc:(\\d*) label:(.+?)\\r\\n', 's')
      const res = reg1.exec(media)
      const ssrc = res[1]
      const cname = res[2]
      const mslabel = reg2.exec(media)[2]
      const msid = reg3.exec(media)[2]
      const label = reg4.exec(media)[2]
      const num = fixSimulcastEncodings.length - 1
      const ssrcs = [ssrc]

      for (let i = 0; i < num; ++i) {
        const ssrc = getNextSSRC()
        const rtx = getNextSSRC()
        ssrcs.push(ssrc)
        media +=
          'a=ssrc-group:FID ' +
          ssrc +
          ' ' +
          rtx +
          '\r\n' +
          'a=ssrc:' +
          ssrc +
          ' cname:' +
          cname +
          '\r\n' +
          'a=ssrc:' +
          ssrc +
          ' msid:' +
          msid +
          '\r\n' +
          'a=ssrc:' +
          ssrc +
          ' mslabel:' +
          mslabel +
          '\r\n' +
          'a=ssrc:' +
          ssrc +
          ' label:' +
          label +
          '\r\n' +
          'a=ssrc:' +
          rtx +
          ' cname:' +
          cname +
          '\r\n' +
          'a=ssrc:' +
          rtx +
          ' msid:' +
          msid +
          '\r\n' +
          'a=ssrc:' +
          rtx +
          ' mslabel:' +
          mslabel +
          '\r\n' +
          'a=ssrc:' +
          rtx +
          ' label:' +
          label +
          '\r\n'
      }
      media += 'a=ssrc-group:SIM ' + ssrcs.join(' ') + '\r\n'
      media +=
        'a=simulcast:send ' +
        fixSimulcastEncodings
          .map((e: RTCRtpEncodingParameters) => e.rid)
          .join(';') +
        '\r\n'
      for (let i = 0; i < fixSimulcastEncodings.length; ++i) {
        media +=
          'a=rid:' +
          fixSimulcastEncodings[i].rid +
          ' send ssrc=' +
          ssrcs[i] +
          '\r\n'
      }
      media += 'a=x-google-flag:conference\r\n'
      fixSimulcastEncodings.inited = true
    }
    if (transceiver.codecs)
      for (const codec of ['vp8', 'vp9', 'h264'])
        if (!transceiver.codecs.includes(codec))
          media = removeCodec(media, codec)

    fixed += media

    if (fixed.includes('\r\n\r\n')) throw fixed
  }

  return fixed
}

function removeCodec(orgsdp: string, codec: string) {
  const internalFunc = function (sdp: string) {
    const codecre = new RegExp(
      '(a=rtpmap:(\\d*) ' + codec + '/90000\\r\\n)',
      'i'
    )
    const rtpmaps = sdp.match(codecre)
    if (rtpmaps === null || rtpmaps.length <= 2) return sdp

    const rtpmap = rtpmaps[2]
    let modsdp = sdp.replace(codecre, '')

    const rtcpre = new RegExp('(a=rtcp-fb:' + rtpmap + '.*\r\n)', 'g')
    modsdp = modsdp.replace(rtcpre, '')

    const fmtpre = new RegExp('(a=fmtp:' + rtpmap + '.*\r\n)', 'g')
    modsdp = modsdp.replace(fmtpre, '')

    const aptpre = new RegExp('(a=fmtp:(\\d*) apt=' + rtpmap + '\\r\\n)')
    const aptmaps = modsdp.match(aptpre)
    let fmtpmap = ''
    if (aptmaps != null && aptmaps.length >= 3) {
      fmtpmap = aptmaps[2]
      modsdp = modsdp.replace(aptpre, '')

      const rtppre = new RegExp('(a=rtpmap:' + fmtpmap + '.*\r\n)', 'g')
      modsdp = modsdp.replace(rtppre, '')
    }

    const videore = /(m=video.*\r\n)/
    const videolines = modsdp.match(videore)
    if (videolines != null) {
      const videoline = videolines[0].substring(0, videolines[0].length - 2)
      const videoelem = videoline.split(' ')
      let modvideoline = videoelem[0]
      for (let i = 1; i < videoelem.length; i++) {
        if (videoelem[i] === rtpmap || videoelem[i] === fmtpmap) continue
        modvideoline += ' ' + videoelem[i]
      }
      modvideoline += '\r\n'
      modsdp = modsdp.replace(videore, modvideoline)
    }
    return internalFunc(modsdp)
  }
  return internalFunc(orgsdp)
}
