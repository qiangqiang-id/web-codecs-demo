import { useState, useRef } from 'react'
import { Button } from 'antd'
import Upload from '@/components/Upload'
import FFmpeg from '@/core/FFmpeg'
import Style from './FFmpegTransform.module.less'
import StatusEnum, { StatusLabel } from '@/constants/StatusEnum'

export default function FFmpegTransform() {
  const fileRef = useRef<File>()
  const [videoUrl, setVideoUrl] = useState('')
  const [newVideoUrl, setNewVideoUrl] = useState('')

  const [status, setStatus] = useState<StatusEnum>()

  const handleChange = (files: File[]) => {
    const file = files[0]
    if (!file) return
    fileRef.current = file
    setVideoUrl(URL.createObjectURL(file))
  }

  const handleTransform = async () => {
    try {
      if (!fileRef.current) return
      setStatus(StatusEnum.PENDING)
      const newFile = await FFmpeg.customTransformVideo(fileRef.current, {
        crop: {
          x: 0,
          y: 0,
          width: 640,
          height: 360,
        },
        fps: 25,
      })

      setNewVideoUrl(URL.createObjectURL(newFile))
      setStatus(StatusEnum.SUCCESS)
    } catch (e) {
      console.error('视频处理失败：', e)
      setStatus(StatusEnum.FAIL)
    }
  }

  return (
    <div>
      <div>
        <Upload onChange={handleChange} accept={['video/*']}>
          <Button>获取视频</Button>
        </Upload>

        <Button style={{ marginLeft: 20 }} onClick={handleTransform}>
          ffmpeg转换
        </Button>

        <span style={{ marginLeft: 20, color: 'red' }}>
          {status ? StatusLabel[status] : ''}
        </span>
      </div>

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
