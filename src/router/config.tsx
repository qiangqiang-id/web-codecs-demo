import { createBrowserRouter } from 'react-router-dom'
import Routes from '@/config/Routes'
import Layout from '@/layout'
// import RichTextInsertBlock from '@/pages/RichTextInsertBlock'
// import Screenshot from '@/pages/Screenshot'
// import FragmentDownload from '@/pages/FragmentDownload'
// import FFmpegExample from '@/pages/FFmpegExample'
// import WebCodecs from '@/pages/WebCodecs'

const routerData = [
  {
    path: '/',
    element: <Layout />,
    children: [
      // {
      //   ...Routes.RichTextInsertBlock,

      {
        ...Routes.FFmpegExample,
        // element: <FFmpegExample />,
      },

      {
        ...Routes.WebCodecs,
        // element: <WebCodecs />,
      },
    ],
  },
]

export default createBrowserRouter(routerData)
