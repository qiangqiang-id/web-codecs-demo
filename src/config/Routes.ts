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
} as const

export default Routes
