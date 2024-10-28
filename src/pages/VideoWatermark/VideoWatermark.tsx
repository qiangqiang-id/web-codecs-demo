import { useState } from 'react'
import { Button } from 'antd'
import Upload from '@/components/Upload'
import { decoderHandle, encoderHandle } from './Codecs'
import Style from './VideoWatermark.module.less'

/** 横向移动速度 */
let DIRECTION_X = 16
/** 纵向移动速度 */
let DIRECTION_Y = 10

const FONT_SIZE = 80

const WATERMARK_TEXT = '闪剪智能'

function movements(x: number, y: number, canvas: HTMLCanvasElement) {
  /** 更新盒子位置 */
  x += DIRECTION_X
  y += DIRECTION_Y

  /** 检测边界并反弹 */
  if (x + FONT_SIZE * WATERMARK_TEXT.length > canvas.width || x < 0) {
    /** 反转水平速度 */
    DIRECTION_X *= -1
  }
  if (y + FONT_SIZE > canvas.height || y < 0) {
    /** 反转垂直速度 */
    DIRECTION_Y *= -1
  }
  return { x, y }
}

function addWatermark(
  frames: VideoFrame[],
  config?: Parameters<VideoDecoder['configure']>[0]
) {
  const canvas = document.createElement('canvas')
  canvas.width = config?.codedWidth || 400
  canvas.height = config?.codedHeight || 400

  const ctx = canvas.getContext('2d')
  if (!ctx) return []

  const videoFrames: VideoFrame[] = []

  let x = 0
  let y = FONT_SIZE

  frames.forEach((frame) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.drawImage(frame, 0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = `${FONT_SIZE}px Arial`

    ctx.fillText(WATERMARK_TEXT, x, y)
    const position = movements(x, y, canvas)
    x = position.x
    y = position.y
    const newFrame = new VideoFrame(canvas, {
      duration: frame.duration || 0,
      timestamp: frame.timestamp,
    })
    frame.close()
    videoFrames.push(newFrame)
  })
  return videoFrames
}

export default function VideoWatermark() {
  const [videoUrl, setVideoUrl] = useState('')

  const [newVideoUrl, setNewVideoUrl] = useState('')

  const handleChange = (files: File[]) => {
    const file = files[0]
    if (!file) return
    setVideoUrl(URL.createObjectURL(file))
  }

  const handleAddWatermark = async () => {
    if (!videoUrl) return
    const res = await decoderHandle(videoUrl)
    if (!res) return
    const { videoSamples, audioSamples, config } = res
    const frames = addWatermark(videoSamples, config.video)
    const file = await encoderHandle(frames, audioSamples, config)
    file && setNewVideoUrl(URL.createObjectURL(file))
  }

  return (
    <div>
      <Upload onChange={handleChange} accept={['video/*']}>
        <Button>获取视频</Button>
      </Upload>

      <Button
        onClick={handleAddWatermark}
        style={{
          marginLeft: 20,
        }}
      >
        增加水印
      </Button>

      <div style={{ marginTop: 20 }}>
        <div className={Style['video-item']}>
          {videoUrl && <video src={videoUrl} controls />}
        </div>

        <div className={Style['video-item']}>
          {newVideoUrl && <video src={newVideoUrl} controls />}
        </div>
      </div>
    </div>
  )
}
