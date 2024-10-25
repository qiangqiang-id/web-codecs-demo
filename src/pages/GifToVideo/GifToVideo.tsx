import { Button } from 'antd'
import {
  Muxer as MuxerMp4,
  ArrayBufferTarget as ArrayBufferTargetMp4,
} from 'mp4-muxer'
import Upload from '@/components/Upload'
import { useRef, useState } from 'react'
import { makeImage } from '@/utils/Image'

const fetchImageByteStream = async (url: string) => {
  const response = await fetch(url)
  return response.body!
}

function createOutHandler(
  width: number,
  height: number
): {
  handler: EncodedVideoChunkOutputCallback
  muxer: MuxerMp4<ArrayBufferTargetMp4>
} {
  let muxer = new MuxerMp4({
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

  const fileTypeRef = useRef('')

  const imageDecode = async () => {
    if (!imageUrl) return
    const stream = await fetchImageByteStream(imageUrl)

    const info = {
      type: fileTypeRef.current,
      data: stream,
    }

    const imageDecoder = new ImageDecoder(info)
    await Promise.all([imageDecoder.completed, imageDecoder.tracks.ready])
    let frameCnt = imageDecoder.tracks.selectedTrack?.frameCount ?? 1
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
    if (!imageUrl) return
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

    frames?.forEach((frame) => {
      videoEncoder.encode(frame, { keyFrame: true })
      frame.close()
    })

    await videoEncoder.flush()
    outHandler.muxer.finalize()

    let { buffer } = outHandler.muxer.target

    const file = new File([buffer], 'test.mp4')

    setVideoUrl(URL.createObjectURL(file))
  }

  return (
    <div>
      <Upload onChange={handleChange} accept={['image/gif', 'image/webp']}>
        <Button>获取动图</Button>
      </Upload>

      <Button onClick={handleTransform}>转成视频</Button>

      <img src={imageUrl} />
      <video src={videUrl} controls autoPlay loop />
    </div>
  )
}
