import { createHashRouter } from 'react-router-dom'
import Routes from '@/config/Routes'
import Layout from '@/layout'
import SupportedCodec from '@/pages/SupportedCodec'
import CanvasExportVideo from '@/pages/CanvasExportVideo'
import FFmpegTransform from '@/pages/FFmpegTransform'
import GifToVideo from '@/pages/GifToVideo'
import ClipVideo from '@/pages/ClipVideo'
import VideoWatermark from '@/pages/VideoWatermark'
import ChromaKey from '@/pages/ChromaKey'
import CheckMediaInfo from '@/pages/CheckMediaInfo'

const routerData = [
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        ...Routes.SupportedCodec,
        element: <SupportedCodec />,
      },

      {
        ...Routes.CanvasExportVideo,
        element: <CanvasExportVideo />,
      },

      {
        ...Routes.FFmpegTransform,
        element: <FFmpegTransform />,
      },

      {
        ...Routes.GifToVideo,
        element: <GifToVideo />,
      },

      {
        ...Routes.ClipVideo,
        element: <ClipVideo />,
      },

      {
        ...Routes.VideoWatermark,
        element: <VideoWatermark />,
      },

      {
        ...Routes.ChromaKey,
        element: <ChromaKey />,
      },

      {
        ...Routes.CheckMediaInfo,
        element: <CheckMediaInfo />,
      },
    ],
  },
]

export default createHashRouter(routerData)
