const Routes = {
  // /** ffmpeg操作视频 */
  // FFmpegExample: {
  //   key: 'ffmpegExample',
  //   path: '/ffmpeg-example',
  //   label: 'ffmpeg操作视频',
  // },
  // /** WebCodecs demo */
  // WebCodecs: {
  //   key: 'webCodecs',
  //   path: '/web-codecs',
  //   label: 'webCodecs',
  // },
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
} as const

export default Routes
