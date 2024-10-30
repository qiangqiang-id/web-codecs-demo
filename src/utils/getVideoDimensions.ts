import { Size } from '@p/EditorTools'

export default function getVideoDimensions(url: string): Promise<Size> {
  return new Promise((resolve, reject) => {
    // 创建 video 元素
    const video = document.createElement('video')

    // 设置视频源
    video.src = url

    // 设置事件监听器，确保元数据已加载后可以获取视频宽高
    video.addEventListener('loadedmetadata', () => {
      // 获取视频的宽和高
      const width = video.videoWidth
      const height = video.videoHeight
      resolve({ width, height })
    })

    // 错误处理
    video.addEventListener('error', () => {
      reject(new Error('Failed to load video metadata'))
    })
  })
}
