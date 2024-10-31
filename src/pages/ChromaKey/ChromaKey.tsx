import Upload from '@/components/Upload'
import StatusEnum, { StatusLabel } from '@/constants/StatusEnum'
import { Button } from 'antd'
import { ChangeEvent, useState } from 'react'
import { createCanvas, initTexture, updateTexture } from './WebGl'
import Style from './ChromaKey.module.less'
import { decoderHandle, encoderHandle } from '@/core/Codecs'
import getVideoDimensions from '@/utils/getVideoDimensions'

const OPTIONS = {
  similarity: 0.4,
  smoothness: 0.05,
  spill: 0.05,
}

function hexToRgb(hex: string): [number, number, number] | null {
  // 去掉前导的 `#` 符号
  hex = hex.replace(/^#/, '')

  // 确保颜色码长度为 6（格式为 RRGGBB）
  if (hex.length !== 6) {
    return null // 无效的 16 进制颜色
  }

  // 将 16 进制字符串转换成 RGB 数值
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)

  return [r, g, b]
}

export default function ChromaKey() {
  const [videoUrl, setVideoUrl] = useState('')

  const [newVideoUrl, setNewVideoUrl] = useState('')

  const [color, setColor] = useState('#00ff00')

  const [status, setStatus] = useState<StatusEnum>()

  const handleChange = (files: File[]) => {
    const file = files[0]
    if (!file) return
    setVideoUrl(URL.createObjectURL(file))
  }

  const onChromaKey = async () => {
    try {
      if (!videoUrl) return
      const size = await getVideoDimensions(videoUrl)
      const colorKey = hexToRgb(color) || [0, 255, 0]
      const data = createCanvas({
        ...OPTIONS,
        ...size,
        colorKey,
      })
      if (!data) return
      setStatus(StatusEnum.PENDING)
      const { canvas, gl } = data
      const texture = initTexture(gl)

      const videoSamples: VideoFrame[] = []
      const audioSamples: AudioData[] = []

      const onSamples = async (
        type: 'video' | 'audio',
        samples: VideoFrame | AudioData
      ) => {
        if (type === 'video') {
          const frame = samples as VideoFrame
          updateTexture(gl, frame, texture)
          const newFrame = new VideoFrame(canvas, {
            alpha: 'keep',
            timestamp: frame.timestamp,
            duration: frame.duration ?? undefined,
          })
          frame.close()
          videoSamples.push(newFrame)
          return
        }

        audioSamples.push(samples as AudioData)
      }

      const res = await decoderHandle(videoUrl, onSamples)
      if (!res) {
        setStatus(StatusEnum.FAIL)
        return
      }
      const { config } = res
      const file = await encoderHandle(videoSamples, audioSamples, config)
      file && setNewVideoUrl(URL.createObjectURL(file))
      setStatus(StatusEnum.SUCCESS)
    } catch (e) {
      console.error('视频处理失败：', e)
      setStatus(StatusEnum.FAIL)
    }
  }

  const onChangeColor = (e: ChangeEvent<HTMLInputElement>) => {
    setColor(e.target.value)
  }

  return (
    <div>
      <Upload onChange={handleChange} accept={['video/*']}>
        <Button>获取视频</Button>
      </Upload>

      <Button
        onClick={onChromaKey}
        style={{
          margin: '0 20px',
        }}
      >
        视频抠像
      </Button>

      <input type="color" value={color} onChange={onChangeColor} />

      <span style={{ marginLeft: 20, color: 'red' }}>
        {status ? StatusLabel[status] : ''}
      </span>

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
