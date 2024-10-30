import mp4box, {
  MP4ArrayBuffer,
  MP4File,
  MP4Info,
  MP4Sample,
  TrakBoxParser,
} from 'mp4box'
import {
  Muxer as MuxerMp4,
  ArrayBufferTarget as ArrayBufferTargetMp4,
} from 'mp4-muxer'

export const DEFAULT_AUDIO_CONF = {
  sampleRate: 48000,
  channelCount: 2,
  codec: 'mp4a.40.2',
}

type Config = {
  video?: Parameters<VideoDecoder['configure']>[0]
  audio?: Parameters<AudioDecoder['configure']>[0]
}

function isNumber(val: unknown): val is number {
  return typeof val === 'number'
}

// 这个是额外的处理方法，不需要关心里面的细节
function parseVideoCodecDesc(track: TrakBoxParser): Uint8Array {
  for (const entry of track.mdia.minf.stbl.stsd.entries) {
    // @ts-expect-error 暂时这样处理
    const box = entry.avcC ?? entry.hvcC ?? entry.av1C ?? entry.vpcC
    if (box != null) {
      const stream = new mp4box.DataStream(
        undefined,
        0,
        mp4box.DataStream.BIG_ENDIAN
      )
      box.write(stream)
      return new Uint8Array(stream.buffer.slice(8)) // Remove the box header.
    }
  }
  throw Error('avcC, hvcC, av1C or VPX not found')
}

async function parse(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  mp4boxFile: MP4File
) {
  let offset = 0
  async function readFileChunk() {
    const { done, value } = await reader.read()
    if (done) {
      /** 文件读取完成，结束解析 */
      mp4boxFile.flush()
      console.log('File reading complete')
      return
    }
    /** 将读取到的 Uint8Array 转换为 ArrayBuffer 并传递给 MP4Box */
    const buffer = value.buffer as MP4ArrayBuffer
    /**  设置偏移量，确保文件的正确解析 */
    buffer.fileStart = offset
    offset += buffer.byteLength

    /** 将 buffer 传递给 MP4Box */
    mp4boxFile.appendBuffer(buffer)

    await readFileChunk()
  }

  await readFileChunk()
}

export async function decoderHandle(url: string) {
  const reader = (await fetch(url)).body?.getReader()

  if (!reader) return

  const mp4boxFile = mp4box.createFile()

  const videoSamples: VideoFrame[] = []
  const audioSamples: AudioData[] = []
  const config: Config = {}

  const videoDecoder = new VideoDecoder({
    output: (frame) => {
      videoSamples.push(frame)
    },
    error: (err) => {
      console.error(err)
    },
  })

  const audioDecoder = new AudioDecoder({
    output: (ad) => {
      audioSamples.push(ad)
    },
    error: (err) => {
      console.error(err)
    },
  })

  let aTrackId: number | null = null
  let vTrackId: number | null = null

  mp4boxFile.onReady = (info: MP4Info) => {
    console.log('元信息已经准备完毕')
    console.log(info)

    /** 视频 */
    const videoTrack = info.videoTracks[0]
    vTrackId = videoTrack?.id
    if (isNumber(vTrackId)) {
      mp4boxFile.setExtractionOptions(vTrackId, 'video', { nbSamples: 100 })
      /**  视频的宽度和高度 */
      const videoW = videoTrack.track_width
      const videoH = videoTrack.track_height

      const videoDesc = parseVideoCodecDesc(
        mp4boxFile.getTrackById(vTrackId)
      ).buffer

      config.video = {
        codec: videoTrack.codec,
        codedHeight: videoTrack.video.height,
        codedWidth: videoTrack.video.width,
        description: videoDesc,
      }

      videoDecoder.configure({
        codec: videoTrack.codec,
        codedWidth: videoW,
        codedHeight: videoH,
        description: parseVideoCodecDesc(mp4boxFile.getTrackById(vTrackId)),
      })
    }

    /** 音频 */
    const audioTrack = info.audioTracks[0]
    aTrackId = audioTrack?.id
    if (isNumber(aTrackId)) {
      mp4boxFile.setExtractionOptions(aTrackId, 'audio', { nbSamples: 100 })

      config.audio = {
        codec: audioTrack.codec,
        numberOfChannels: audioTrack.audio.channel_count,
        sampleRate: audioTrack.audio.sample_rate,
      }

      audioDecoder.configure({
        // codec: 'mp4a.40.2',
        codec: audioTrack.codec,
        numberOfChannels: audioTrack.audio.channel_count,
        sampleRate: audioTrack.audio.sample_rate,
      })
    }

    console.log(audioTrack)

    mp4boxFile.start()
  }

  let isFirst = true
  mp4boxFile.onSamples = (_id: number, type: unknown, samples: MP4Sample[]) => {
    console.log('数据采集完毕')

    if (type === 'audio') {
      for (const s of samples) {
        const type = s.is_sync ? 'key' : 'delta'
        const chunk = new EncodedAudioChunk({
          type,
          timestamp: (1e6 * s.cts) / s.timescale,
          duration: (1e6 * s.duration) / s.timescale,
          data: s.data,
        })
        audioDecoder.decode(chunk)
      }
    }

    if (type === 'video') {
      for (const s of samples) {
        const type = s.is_sync ? 'key' : 'delta'
        const chunk = new EncodedVideoChunk({
          type,
          timestamp: isFirst ? 0 : (1e6 * s.cts) / s.timescale,
          duration: (1e6 * s.duration) / s.timescale,
          data: s.data,
        })
        isFirst = false
        videoDecoder.decode(chunk)
      }
    }
  }

  await parse(reader, mp4boxFile)

  isNumber(vTrackId) && (await videoDecoder.flush())

  isNumber(aTrackId) && (await audioDecoder.flush())

  return { videoSamples, audioSamples, config }
}

function createOutHandler(
  width: number,
  height: number
): {
  videoHandler: EncodedVideoChunkOutputCallback
  audioHandler: EncodedAudioChunkOutputCallback
  muxer: MuxerMp4<ArrayBufferTargetMp4>
} {
  const muxer = new MuxerMp4({
    target: new ArrayBufferTargetMp4(),
    video: {
      codec: 'vp9',
      width,
      height,
    },
    audio: {
      codec: 'aac',
      numberOfChannels: DEFAULT_AUDIO_CONF.channelCount,
      sampleRate: DEFAULT_AUDIO_CONF.sampleRate,
    },
    fastStart: 'in-memory',
  })
  return {
    muxer,
    videoHandler: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    audioHandler: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
  }
}

export async function encoderHandle(
  videoSamples: VideoFrame[],
  audioSamples: AudioData[],
  config: Config
) {
  const { audio: audioConfig } = config
  const firstSample = videoSamples[0]
  console.log(videoSamples)
  const width = firstSample?.codedWidth
  const height = firstSample?.codedHeight

  if (!firstSample) return

  const outHandler = createOutHandler(width, height)

  const videoEncoder = new VideoEncoder({
    output: outHandler.videoHandler,
    error: (e) => console.error('Video encoding error', e),
  })

  const audioEncoder = new AudioEncoder({
    output: outHandler.audioHandler,
    error: (e) => console.error('Audio encoding error', e),
  })

  videoEncoder.configure({
    // codec: 'avc1.42E01F',
    codec: 'vp09.00.10.08',
    width,
    height,
    bitrate: 1e6,
  })

  if (audioConfig) {
    audioEncoder.configure({
      codec: audioConfig.codec,
      numberOfChannels: audioConfig.numberOfChannels,
      sampleRate: audioConfig.sampleRate,
    })
  }

  videoSamples?.forEach((frame) => {
    videoEncoder.encode(frame, { keyFrame: true })
    frame.close()
  })

  audioSamples?.forEach((audioData) => {
    audioEncoder.encode(audioData)
    audioData.close()
  })

  await videoEncoder.flush()
  outHandler.muxer.finalize()

  const { buffer } = outHandler.muxer.target

  const file = new File([buffer], 'test.mp4')

  return file
}
