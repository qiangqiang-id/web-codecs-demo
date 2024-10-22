import { createBrowserRouter } from 'react-router-dom'
import Routes from '@/config/Routes'
import Layout from '@/layout'
import SupportedCodec from '@/pages/SupportedCodec'

const routerData = [
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        ...Routes.SupportedCodec,
        element: <SupportedCodec />,
      },
    ],
  },
]

export default createBrowserRouter(routerData)
