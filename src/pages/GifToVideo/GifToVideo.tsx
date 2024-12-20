import { Button } from 'antd'
import {
  Muxer as MuxerMp4,
  ArrayBufferTarget as ArrayBufferTargetMp4,
} from 'mp4-muxer'
import Upload from '@/components/Upload'
import { useRef, useState } from 'react'
import { makeImage } from '@/utils/Image'
import Style from './GifToVideo.module.less'
import { fetchUrlByteStream } from '@/utils/fetch'
import StatusEnum, { StatusLabel } from '@/constants/StatusEnum'

function createOutHandler(
  width: number,
  height: number
): {
  handler: EncodedVideoChunkOutputCallback
  muxer: MuxerMp4<ArrayBufferTargetMp4>
} {
  const muxer = new MuxerMp4({
    target: new ArrayBufferTargetMp4(),
    video: {
      codec: 'vp9',
      width,
      height,
    },
    fastStart: 'in-memory',
  })
  return {
    muxer,
    handler: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
  }
}

export default function GifToVideo() {
  const [imageUrl, setImageUrl] = useState('')
  const [videUrl, setVideoUrl] = useState('')
  const [status, setStatus] = useState<StatusEnum>()
  const fileTypeRef = useRef('')

  const imageDecode = async () => {
    if (!imageUrl) return
    const stream = await fetchUrlByteStream(imageUrl)

    const info = {
      type: fileTypeRef.current,
      data: stream,
    }

    const imageDecoder = new ImageDecoder(info)
    await Promise.all([imageDecoder.completed, imageDecoder.tracks.ready])
    const frameCnt = imageDecoder.tracks.selectedTrack?.frameCount ?? 1
    const frames: VideoFrame[] = []
    for (let i = 0; i < frameCnt; i += 1) {
      frames.push((await imageDecoder.decode({ frameIndex: i })).image)
    }
    return frames
  }

  const handleChange = (files: File[]) => {
    const file = files[0]
    if (!file) return
    fileTypeRef.current = file.type
    setImageUrl(URL.createObjectURL(file))
  }

  const handleTransform = async () => {
    try {
      if (!imageUrl) return
      setStatus(StatusEnum.PENDING)
      const frames = await imageDecode()
      const image = await makeImage(imageUrl)
      const width = image.width
      const height = image.height

      const outHandler = createOutHandler(width, height)

      const videoEncoder = new VideoEncoder({
        output: outHandler.handler,
        error: (e) => console.error('Video encoding error', e),
      })

      videoEncoder.configure({
        // codec: 'avc1.42E01F',
        codec: 'vp09.00.10.08',
        width,
        height,
        bitrate: 1e6,
      })

      console.log(frames)

      frames?.forEach((frame) => {
        videoEncoder.encode(frame, { keyFrame: true })
        frame.close()
      })

      await videoEncoder.flush()
      outHandler.muxer.finalize()

      const { buffer } = outHandler.muxer.target

      const file = new File([buffer], 'test.mp4')
      setVideoUrl(URL.createObjectURL(file))
      setStatus(StatusEnum.SUCCESS)
    } catch (e) {
      console.error('动图处理失败：', e)
      setStatus(StatusEnum.FAIL)
    }
  }

  return (
    <div>
      <div>
        <Upload onChange={handleChange} accept={['image/gif', 'image/webp']}>
          <Button>获取动图</Button>
        </Upload>
        <Button style={{ marginLeft: 20 }} onClick={handleTransform}>
          转成视频
        </Button>

        <span style={{ marginLeft: 20, color: 'red' }}>
          {status ? StatusLabel[status] : ''}
        </span>
      </div>

      <div className={Style.container}>
        <div className={Style.content}>
          <img src={imageUrl} />
        </div>

        <div className={Style.content}>
          {videUrl && <video src={videUrl} controls autoPlay loop />}
        </div>
      </div>
    </div>
  )
}
