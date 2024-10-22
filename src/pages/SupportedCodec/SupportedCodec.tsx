import { useState, useEffect } from 'react'
import { Badge, Button, InputNumber, Table } from 'antd'
import Style from './SupportedCodec.module.less'
import { ColumnsType } from 'antd/es/table/interface'

const CODECS = [
  'avc1.42E01F',
  'vp8',
  'vp09.00.10.08',
  'av01.0.04M.08',
  'hvc1.1.6.L123',
]

const ACCELERATIONS: HardwareAcceleration[] = [
  'prefer-hardware',
  'prefer-software',
]

type Config = VideoDecoderConfig | VideoEncoderConfig

export default function SupportedCodec() {
  const [decodes, setDecodes] = useState<
    VideoDecoderSupport & { key: string }[]
  >([])
  const [encodes, setEncodes] = useState<
    VideoEncoderSupport & { key: string }[]
  >([])

  const [width, setWidth] = useState(720)
  const [height, setHeight] = useState(1280)

  const getConfigs = (type: 'decode' | 'encode') => {
    const configs: Config[] = []
    for (const codec of CODECS) {
      for (const acceleration of ACCELERATIONS) {
        let config: Partial<Config> = {
          codec,
          hardwareAcceleration: acceleration,
        }

        if (type === 'decode') {
          config = {
            ...config,
            codedWidth: width,
            codedHeight: height,
          }
        }

        if (type === 'encode') {
          config = {
            ...config,
            width: width,
            height: height,
            framerate: 30,
          }
        }

        configs.push(config as Config)
      }
    }
    return configs
  }

  /**
   * 获取解码格式
   *  */
  const getDecodeCodec = async () => {
    const configs = getConfigs('decode')
    const infoList = await Promise.all(
      configs.map(async (config, index) => {
        const data = await VideoDecoder.isConfigSupported(config)
        return { ...data, key: String(index) }
      })
    )
    setDecodes(infoList)
  }

  /**
   * 获取编码格式
   *  */
  const getEncodeCodec = async () => {
    const configs = getConfigs('encode') as VideoEncoderConfig[]

    const infoList = await Promise.all(
      configs.map(async (config, index) => {
        const data = await VideoEncoder.isConfigSupported(config)
        return { ...data, key: String(index) }
      })
    )
    setEncodes(infoList)
  }

  const changeWidth = (val: number | null) => {
    if (val !== null) {
      setWidth(val)
    }
  }
  const changeHeight = (val: number | null) => {
    if (val !== null) {
      setHeight(val)
    }
  }

  useEffect(() => {
    getDecodeCodec()
    getEncodeCodec()
  }, [width, height])

  const decodesColumns: ColumnsType<VideoDecoderSupport & { key: string }> = [
    {
      title: '支持情况',
      dataIndex: 'supported',
      render: (supported) => {
        return (
          <div>
            <Badge status={supported ? 'success' : 'error'} />{' '}
            {supported ? '支持' : '不支持'}
          </div>
        )
      },
    },
    {
      title: '解码格式',
      dataIndex: ['config', 'codec'],
    },

    {
      title: '解码模式',
      dataIndex: ['config', 'hardwareAcceleration'],
      render: (model) => {
        const isPreferHardware = model === 'prefer-hardware'
        return (
          <div>
            <Badge status={isPreferHardware ? 'success' : 'error'} />{' '}
            {isPreferHardware ? '硬解' : '软解'}
          </div>
        )
      },
    },
    {
      title: '宽',
      dataIndex: ['config', 'codedWidth'],
    },
    {
      title: '高',
      dataIndex: ['config', 'codedHeight'],
    },
  ]

  const encodesColumns: ColumnsType<VideoEncoderSupport & { key: string }> = [
    {
      title: '支持情况',
      dataIndex: 'supported',
      render: (supported) => {
        return (
          <div>
            <Badge status={supported ? 'success' : 'error'} />{' '}
            {supported ? '支持' : '不支持'}
          </div>
        )
      },
    },

    {
      title: '编码格式',
      dataIndex: ['config', 'codec'],
    },

    {
      title: '编码模式',
      dataIndex: ['config', 'hardwareAcceleration'],
      render: (model) => {
        const isPreferHardware = model === 'prefer-hardware'
        return (
          <div>
            <Badge status={isPreferHardware ? 'success' : 'error'} />{' '}
            {isPreferHardware ? '硬编' : '软编'}
          </div>
        )
      },
    },

    {
      title: '帧率',
      dataIndex: ['config', 'framerate'],
    },
    {
      title: '宽',
      dataIndex: ['config', 'width'],
    },
    {
      title: '高',
      dataIndex: ['config', 'height'],
    },
  ]

  return (
    <>
      <div className={Style['size-box']}>
        <InputNumber addonBefore="宽" value={width} onChange={changeWidth} />
        *
        <InputNumber addonBefore="高" value={height} onChange={changeHeight} />
      </div>

      <div className={Style.container}>
        <div className={Style.box}>
          <Button
            onClick={getDecodeCodec}
            type="primary"
            style={{ marginBottom: 16 }}
          >
            获取解码格式
          </Button>

          <Table
            dataSource={decodes}
            columns={decodesColumns}
            pagination={false}
          />
        </div>
        <div className={Style.box}>
          <Button
            onClick={getEncodeCodec}
            type="primary"
            style={{ marginBottom: 16 }}
          >
            获取编码格式
          </Button>
          <Table
            dataSource={encodes}
            columns={encodesColumns}
            pagination={false}
          />
        </div>
      </div>
    </>
  )
}
