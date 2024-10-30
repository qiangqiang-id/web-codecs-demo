import { useState } from 'react'
import { Button } from 'antd'
import Upload from '@/components/Upload'
import { decoderHandle, encoderHandle } from '@/core/Codecs'
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
  if (y > canvas.height || y < FONT_SIZE) {
    /** 反转垂直速度 */
    DIRECTION_Y *= -1
  }
  return { x, y }
}

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
let x = 0
let y = FONT_SIZE

function addWatermark(frame: VideoFrame) {
  if (!ctx) return

  canvas.width = frame.codedWidth
  canvas.height = frame.codedHeight

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

  return newFrame
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

    const videoSamples: VideoFrame[] = []
    const audioSamples: AudioData[] = []
    const onSamples = async (
      type: 'video' | 'audio',
      samples: VideoFrame | AudioData
    ) => {
      if (type === 'video') {
        const frame = await addWatermark(samples as VideoFrame)
        frame && videoSamples.push(frame)
        return
      }
      audioSamples.push(samples as AudioData)
    }

    const res = await decoderHandle(videoUrl, onSamples)
    if (!res) return
    const { config } = res
    const file = await encoderHandle(videoSamples, audioSamples, config)
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
