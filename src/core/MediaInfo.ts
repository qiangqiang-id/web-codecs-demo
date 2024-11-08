import MediaInfoFactory, {
  ReadChunkFunc,
  type MediaInfo as MediaData,
  VideoTrack,
  AudioTrack,
  Track,
} from 'mediainfo.js'

const WASM_CDN =
  'https://bhb-frontend.bhbcdn.com/static/script/wasm/media/MediaInfoModule.wasm'

export function isVideo(track?: Track): track is VideoTrack {
  return track?.['@type'] === 'Video'
}

export function isAudio(track?: Track): track is AudioTrack {
  return track?.['@type'] === 'Audio'
}

class MediaInfo {
  static instance: MediaInfo | null = null

  private mediaInstance: MediaData<'object'> | null = null

  /**
   * 获取 MediaInfo 类的单例实例。如果实例不存在，则创建一个新的实例。
   * @returns MediaInfo 的单例实例。
   */
  static getInstance() {
    if (!MediaInfo.instance) {
      // mediainfo.js.org/api/
      MediaInfo.instance = new MediaInfo()
    }
    return MediaInfo.instance
  }

  constructor() {
    this.initMedia()
  }

  /**
   * 初始化媒体工厂
   * */
  private async initMedia(cdn?: string) {
    if (this.mediaInstance) {
      this.close()
    }
    this.mediaInstance = await MediaInfoFactory({
      format: 'object',
      /** wasm 文件路径*/
      locateFile: () => cdn || WASM_CDN,
    })
  }

  /**
   * 获取给定文件的元数据
   * @param {File} file - 要获取其元数据的文件。
   * @returns {Promise} - 一个 Promise 对象，其解析结果为文件的元数据。
   */
  async getMetadata(file: File) {
    if (!this.mediaInstance) {
      await this.initMedia()
    }

    const getSize = () => file.size
    const readChunk: ReadChunkFunc = (chunkSize, offset) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (event: ProgressEvent<FileReader>) => {
          if (event.target?.error) {
            reject(event.target.error)
          }
          resolve(new Uint8Array(event.target?.result as ArrayBuffer))
        }
        reader.readAsArrayBuffer(file.slice(offset, offset + chunkSize))
      })
    return this.mediaInstance?.analyzeData(getSize, readChunk)
  }

  /**
   * 获取视频文件信息
   * @param file - 要获取其视频信息的文件。
   * @returns 一个 Promise 对象，如果成功解析，它将解析为包含视频信息的对象，否则为 `null`。
   */
  async getVideoInfo(file: File) {
    try {
      const res = await this.getMetadata(file)
      if (!res) return null
      const track = res.media?.track.find((item) => isVideo(item))

      if (isVideo(track)) {
        return track
      }
      return null
    } catch (err) {
      console.error('获取视频信息失败', err)
      return null
    }
  }

  /**
   * 获取音频文件信息
   * @param {File} file - 要获取其音频信息的文件。
   * @returns {Promise} - 一个 Promise 对象，其解析结果为文件的音频信息。
   */
  async getAudioInfo(file: File) {
    try {
      const res = await this.getMetadata(file)
      if (!res) return null

      const track = res.media?.track.find((item) => isAudio(item))
      if (isAudio(track)) {
        return track
      }
      return null
    } catch (err) {
      console.error('获取音频信息失败', err)
      return null
    }
  }

  /**
   * 页面离开关闭实例，释放内存
   *  */
  async close() {
    this.mediaInstance?.close()
    this.mediaInstance = null
  }
}

export default MediaInfo.getInstance()
