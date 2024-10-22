import * as React from 'react'
import { RouterProvider } from 'react-router-dom'
import routerConfig from './config'

export default function Routers() {
  return <RouterProvider router={routerConfig} />
}
