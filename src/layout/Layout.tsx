import { useEffect, useState } from 'react'
import { Layout, Menu, MenuProps, theme } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import Routes from '@/config/Routes'
import Style from './Layout.module.less'

const { Header, Content, Sider } = Layout

type MenuItem = Required<MenuProps>['items'][number]

function getItems(): MenuItem[] {
  return Object.values(Routes).map((item) => {
    const { path, label } = item
    return { key: path, label }
  })
}

const items: MenuItem[] = getItems()

function LayoutComponent() {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const [defaultSelectedKeys, setDefaultSelectedKeys] = useState('')

  const navigateTo = useNavigate()

  const location = useLocation()

  useEffect(() => {
    setDefaultSelectedKeys(location.pathname)
  }, [])

  return (
    <Layout style={{ height: '100%' }}>
      <Sider className={Style.sider}>
        <div className="demo-logo-vertical" />
        <Menu
          onSelect={(val) => {
            setDefaultSelectedKeys(val.key)
            navigateTo(val.key)
          }}
          theme="light"
          mode="inline"
          selectedKeys={[defaultSelectedKeys]}
          items={items}
        />
      </Sider>
      <Layout>
        <Header
          className={Style.header}
          style={{ background: colorBgContainer }}
        >
          WebCodecs
        </Header>
        <Content style={{ margin: '24px 16px' }}>
          <div
            className={Style.content}
            style={{
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default LayoutComponent
