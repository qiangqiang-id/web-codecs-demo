export interface CustomTransformVideoOptions {
  /** 编码器 */
  // codec?: string;
  /** 视频格式 */
  format?: string
  /** 裁剪 */
  crop?: {
    x: number

    y: number
    /** 视频宽度 */
    width: number
    /** 视频高度 */
    height: number
  }
  /** 视频帧率 */
  fps?: number
  /** 时间范围 */
  timeRange?: [number, number]
  /** 缩放 */
  scale?: {
    iw: number
    ih: number
  }
  /** 以y翻转 */
  flipH?: boolean
  /** 码率 */
  bitrate?: number

  /** 复制音频流  直接拿取音频源内容 */
  copy?: boolean
}

export interface VideoFrameOptions {
  /** 水平翻转 */
  flipH?: boolean
  time?: string
}
