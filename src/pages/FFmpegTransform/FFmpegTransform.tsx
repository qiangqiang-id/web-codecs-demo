import { useState, useRef } from 'react'
import { Button } from 'antd'
import Upload from '@/components/Upload'
import FFmpeg from '@/core/FFmpeg'

export default function FFmpegTransform() {
  const fileRef = useRef<File>()
  const [videoUrl, setVideoUrl] = useState('')
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const handleChange = async (files: File[]) => {
    const file = files[0]
    if (!file) return

    fileRef.current = file

    setVideoUrl(URL.createObjectURL(file))
  }

  const handleTransform = async () => {
    if (!fileRef.current) return

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
  }

  return (
    <div>
      <Upload onChange={handleChange} accept={['video/*']}>
        <Button>获取视频</Button>
      </Upload>

      <Button onClick={handleTransform}>ffmpeg转换</Button>

      <video src={videoUrl} controls />

      <video src={newVideoUrl} controls />
    </div>
  )
}
