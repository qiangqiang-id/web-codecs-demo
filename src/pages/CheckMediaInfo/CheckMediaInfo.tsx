import { useState } from 'react'
import { Button } from 'antd'
import Upload from '@/components/Upload'
import MediaInfo from '@/core/MediaInfo'

export default function CheckMediaInfo() {
  const [info, setInfo] = useState('')
  const handleChange = async (files: File[]) => {
    const file = files[0]
    if (!file) return

    const res = await MediaInfo.getMetadata(file)
    const str = JSON.stringify(res, null, 2)
    console.log(str)
    setInfo(str)
  }

  return (
    <div>
      <Upload onChange={handleChange} accept={['video/*']}>
        <Button>上传视频</Button>
      </Upload>

      <pre>{info}</pre>
    </div>
  )
}
