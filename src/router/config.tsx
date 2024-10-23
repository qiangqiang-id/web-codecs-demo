import { createBrowserRouter } from 'react-router-dom'
import Routes from '@/config/Routes'
import Layout from '@/layout'
import SupportedCodec from '@/pages/SupportedCodec'
import CanvasExportVideo from '@/pages/CanvasExportVideo'
import FFmpegTransform from '@/pages/FFmpegTransform'
import GifToVideo from '@/pages/GifToVideo'

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
    ],
  },
]

export default createBrowserRouter(routerData)
