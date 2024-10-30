import { useState, useRef } from 'react'
import { Button } from 'antd'
import {
  EditorBox,
  dragAction,
  RectData,
  POINT_TYPE,
  ScaleHandlerOptions,
} from '@p/EditorTools'
import Upload from '@/components/Upload'
import Style from './ClipVideo.module.less'
import { calcMaxWidthAndMaxHeight } from '@/utils/crop'
import { decoderHandle, encoderHandle } from '@/core/Codecs'
import { fetchUrlFile } from '@/utils/fetch'
import FFmpeg from '@/core/FFmpeg'
import getVideoDimensions from '@/utils/getVideoDimensions'
import StatusEnum, { StatusLabel } from '@/constants/StatusEnum'

const DEFAULT_RECT: RectData = {
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  rotate: 0,
}

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')

function canvasClip(frame: VideoFrame, rect: RectData) {
  if (!ctx) return
  canvas.width = rect.width
  canvas.height = rect.height
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(
    frame,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    rect.width,
    rect.height
  )
  const newFrame = new VideoFrame(canvas, {
    duration: frame.duration || 0,
    timestamp: frame.timestamp,
  })
  frame.close()

  return newFrame
}

export default function ClipVideo() {
  const [videoUrl, setVideoUrl] = useState('')
  const [newVideoUrl, setNewVideoUrl] = useState('')

  const [status, setStatus] = useState<StatusEnum>()

  const [rectInfo, setRectInfo] = useState<RectData>(DEFAULT_RECT)

  const videoWrapperRef = useRef<HTMLDivElement>(null)

  const handleChange = (files: File[]) => {
    const file = files[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setVideoUrl(url)
  }

  /**
   * 拉伸
   */
  const handleScale = (data: RectData) => {
    setRectInfo((oldData) => ({ ...oldData, ...data }))
  }

  /**
   * 拉伸之前，需要计算根据拉伸点计算，最大的拉伸宽高
   * @param point 当前拉伸的点
   * @returns {ScaleHandlerOptions} 拉伸配置项目
   */
  const handleStartScale = (
    point: POINT_TYPE
  ): ScaleHandlerOptions | undefined => {
    const rect = getVideoWrapperRect()
    if (!rect || !rectInfo) return undefined
    const { width, height } = calcMaxWidthAndMaxHeight(
      { x: 0, y: 0, width: rect.width, height: rect.height },
      rectInfo,
      point
    )

    /** 通过拉伸不同的点，设置不同的最大宽高值 */
    return {
      maxWidth: width,
      maxHeight: height,
      isLockProportions: false,
    }
  }

  const getVideoWrapperRect = () => {
    return videoWrapperRef.current?.getBoundingClientRect()
  }

  /**
   * 移动
   */
  const handleMove = (e: React.MouseEvent) => {
    const rect = getVideoWrapperRect()
    if (!rect) return

    const maxX = rect.width - rectInfo.width
    const maxY = rect.height - rectInfo.height

    dragAction(e.nativeEvent, {
      move: (e) => {
        setRectInfo((oldValues) => {
          const data = {
            ...oldValues,
            x: Math.max(Math.min(oldValues.x + e.movementX, maxX), 0),
            y: Math.max(Math.min(oldValues.y + e.movementY, maxY), 0),
          }
          return data
        })
      },
    })
  }

  const transformRectInfo = async () => {
    const rect = getVideoWrapperRect()
    if (!rect) return rectInfo
    const size = await getVideoDimensions(videoUrl)

    const rate = size.width / rect.width
    const { x, y, width, height } = rectInfo
    return {
      x: x * rate,
      y: y * rate,
      width: width * rate,
      height: height * rate,
    }
  }

  const handleClipByCodecs = async () => {
    console.time('webCodecs处理时间')
    try {
      if (!videoUrl) return

      setStatus(StatusEnum.PENDING)

      const videoSamples: VideoFrame[] = []
      const audioSamples: AudioData[] = []
      const rectInfo = await transformRectInfo()
      const onSamples = async (
        type: 'video' | 'audio',
        samples: VideoFrame | AudioData
      ) => {
        if (type === 'video') {
          const frame = await canvasClip(samples as VideoFrame, rectInfo)
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

      setStatus(StatusEnum.SUCCESS)
    } catch (e) {
      console.error('视频处理失败：', e)
      setStatus(StatusEnum.FAIL)
    } finally {
      console.timeEnd('webCodecs处理时间')
    }
  }

  const handleClipByFFmpeg = async () => {
    console.time('ffmpeg处理时间')
    try {
      if (!videoUrl) return
      setStatus(StatusEnum.PENDING)
      const file = await fetchUrlFile(videoUrl)
      const newFile = await FFmpeg.customTransformVideo(file, {
        crop: await transformRectInfo(),
      })
      setNewVideoUrl(URL.createObjectURL(newFile))
      setStatus(StatusEnum.SUCCESS)
    } catch (e) {
      console.error('视频处理失败：', e)
      setStatus(StatusEnum.FAIL)
    } finally {
      console.timeEnd('ffmpeg处理时间')
    }
  }

  return (
    <div>
      <Upload accept={['video/*']} onChange={handleChange}>
        <Button>获取视频</Button>
      </Upload>

      <Button onClick={handleClipByCodecs} style={{ margin: '0 20px' }}>
        webCodecs裁剪
      </Button>

      <Button onClick={handleClipByFFmpeg}>FFmpeg裁剪</Button>

      <span style={{ marginLeft: 20, color: 'red' }}>
        {status ? StatusLabel[status] : ''}
      </span>

      <div style={{ marginTop: 20 }}>
        <div className={Style['video-item']} ref={videoWrapperRef}>
          {videoUrl && <video src={videoUrl} controls />}

          {videoUrl && (
            <EditorBox
              className={Style['editor-box']}
              rectInfo={rectInfo}
              isShowRotate={false}
              onMouseDown={handleMove}
              onScale={handleScale}
              onStartScale={handleStartScale}
              minHeight={10}
              minWidth={10}
            />
          )}
        </div>

        <div className={Style['video-item']}>
          {newVideoUrl && <video src={newVideoUrl} controls />}
        </div>
      </div>
    </div>
  )
}
