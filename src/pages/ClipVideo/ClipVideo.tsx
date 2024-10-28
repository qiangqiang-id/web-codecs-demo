import { useState } from 'react'
import { Button } from 'antd'
import Upload from '@/components/Upload'

export default function ClipVideo() {
  const [videoUrl, setVideoUrl] = useState('')

  const handleChange = (files: File[]) => {
    const file = files[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setVideoUrl(url)
  }

  return (
    <div>
      <Upload accept={['video/*']} onChange={handleChange}>
        <Button type="primary">获取视频</Button>
      </Upload>
      <div>视频区域</div>
    </div>
  )
}
