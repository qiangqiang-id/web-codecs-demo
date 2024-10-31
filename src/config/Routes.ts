const Routes = {
  SupportedCodec: {
    key: 'SupportedCodec',
    path: '/supported-codec',
    label: '兼容性检测',
  },

  CanvasExportVideo: {
    key: 'CanvasExportVideo',
    path: '/canvas-export-video',
    label: 'canvas导出视频',
  },

  FFmpegTransform: {
    key: 'FFmpegTransform',
    path: '/ffmpeg-transform',
    label: 'ffmpeg转码',
  },

  GifToVideo: {
    key: 'GifToVideo',
    path: '/gif-to-video',
    label: '动图转视频',
  },

  ClipVideo: {
    key: 'ClipVideo',
    path: '/clip-video',
    label: '视频裁剪',
  },

  VideoWatermark: {
    key: 'VideoWatermark',
    path: '/video-watermark',
    label: '视频水印',
  },

  ChromaKey: {
    key: 'ChromaKey',
    path: '/chroma-key',
    label: '视频抠像',
  },
} as const

export default Routes
