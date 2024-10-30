import { CustomTransformVideoOptions, VideoFrameOptions } from '@/types/Fmpeg'
import fileToBase64Url from '@/utils/fileToBase64Url'
import { randomString } from '@/utils/random'
import { FFmpeg as FFmpegWasm } from '@ffmpeg/ffmpeg'
import { ProgressEventCallback } from '@ffmpeg/ffmpeg/dist/esm/types'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { fileTypeFromBuffer } from 'file-type'

const BASE_URL =
  'https://digital-bhb-frontend.bhbcdn.com/static/ffmpeg/ffmpeg-multithreading'

const FFMPEG_CORE_JS = `${BASE_URL}/ffmpeg-core.js`

const FFMPEG_CORE_WASM = `${BASE_URL}/ffmpeg-core.wasm`

// const FFMPEG_WORKER_JS = `${BASE_URL}/worker.js`;
const FFMPEG_WORKER_JS = `${BASE_URL}/ffmpeg-core.worker.js`

class FFmpeg {
  static instance: FFmpeg | null = null

  static getInstance() {
    if (FFmpeg.instance === null) {
      FFmpeg.instance = new FFmpeg()
    }
    return FFmpeg.instance
  }

  ffmpeg = new FFmpegWasm()

  /**
   * 是否工作中
   *  */
  isWorked = false

  constructor() {
    this.loadResource()
    this.addLog()
    this.addProgressListener()
  }

  /**
   * 加载资源
   *  */
  private async loadResource() {
    console.log('chufa--------')
    await this.ffmpeg.load({
      // coreURL: await toBlobURL(`./ffmpeg-core.js`, 'text/javascript'),
      // wasmURL: await toBlobURL(`./ffmpeg-core.wasm`, 'application/wasm'),
      // workerURL: await toBlobURL(`./ffmpeg-core.worker.js`, 'text/javascript'),
      coreURL: await toBlobURL(FFMPEG_CORE_JS, 'text/javascript'),
      wasmURL: await toBlobURL(FFMPEG_CORE_WASM, 'application/wasm'),
      workerURL: await toBlobURL(FFMPEG_WORKER_JS, 'text/javascript'),
    })
    console.log('chufa++++++')
  }

  /**
   * 添加进度监听器
   *  */
  public addProgressListener() {
    this.ffmpeg.on('progress', ({ progress }) => {
      console.log('progress', progress)
    })
  }

  /**
   * 添加日志
   *  */
  public addLog() {
    this.ffmpeg.on('log', ({ message }) => {
      /** ffmpeg 参数错误，导致意外中断，改当前工作状态 */
      if (message === 'Conversion failed!') {
        this.isWorked = false
      }
    })
  }

  /**
   *  校验ffmpeg加载成功
   *  */
  public async checkLoaded() {
    if (!this.ffmpeg.loaded) {
      await this.loadResource()
    }
  }

  /**
   * 执行指定的命令并处理文件，返回一个表示处理后文件的 File 对象
   * @param {string[]} commands - 要执行的命令数组
   * @param {string} newName - 处理后的文件名字
   * @param {File} inputFile - 要处理的输入文件
   * @param {ProgressEventCallback} progressCallback - 进度事件的回调函数（可选）
   * @throws {Error} 如果已经有任务正在执行，抛出错误
   * @return {Promise<File>} 一个 Promise，当文件处理完成时解析为 File 对象
   */
  public async run(
    commands: string[],
    newName: string,
    inputFile: File,
    progressCallback?: ProgressEventCallback
  ) {
    if (this.isWorked) {
      throw new Error('FFmpeg正在工作中')
    }

    progressCallback && this.ffmpeg.on('progress', progressCallback)

    this.isWorked = true
    try {
      await this.checkLoaded()
      console.log('chufa')
      await this.ffmpeg.writeFile(inputFile.name, await fetchFile(inputFile))
      await this.ffmpeg.exec(commands)
      if (!this.isWorked) {
        throw new Error('FFmpeg意外中断')
      }

      const fileData = await this.ffmpeg.readFile(newName)
      const data = new Uint8Array(fileData as ArrayBuffer)
      const res = await fileTypeFromBuffer(data)
      return new File([data.buffer], newName, {
        type: res?.mime || 'video/mp4',
      })
    } catch (err) {
      console.error(err)
      throw new Error('FFmpeg转换失败')
    } finally {
      this.isWorked = false
      progressCallback && this.ffmpeg.off('progress', progressCallback)
      this.ffmpeg.deleteFile(newName)
    }
  }

  /**
   * 为媒体文件添加元数据
   * @param {File} inputFile - 要添加元数据的文件
   * @param {ProgressEventCallback} progressCallback - 进度事件的回调函数（可选）
   * @return {Promise<File>} 转换后的视频文件
   */
  public async addMediaFileMeta(
    inputFile: File,
    progressCallback?: ProgressEventCallback
  ) {
    /** 后缀 */
    const ext = inputFile.name.split('.').pop() || ''
    const newName = `${randomString()}.${ext}`
    const commands = ['-i', inputFile.name, '-c', 'copy', '-map', '0', newName]

    return this.run(commands, newName, inputFile, progressCallback)
  }

  /**
   * 自定义转换视频，允许用户进行一系列的视频编辑操作
   * @param {File} inputFile - 要转换的视频文件
   * @param {CustomTransformVideoOptions} options - 视频转换的选项
   * @param {ProgressEventCallback} progressCallback - 转换进度的回调函数（可选）
   * @return {Promise<File>} 转换后的视频文件
   */
  public customTransformVideo(
    inputFile: File,
    options: CustomTransformVideoOptions,
    progressCallback?: ProgressEventCallback
  ) {
    const { crop, scale, fps, timeRange, flipH, bitrate, format, copy } =
      options

    const commands: string[] = []
    if (timeRange) {
      commands.push('-ss', timeRange[0].toString())
    }

    commands.push('-i', inputFile.name)

    if (timeRange) {
      commands.push('-t', (timeRange[1] - timeRange[0]).toString())
    }

    if (crop || flipH || scale) {
      commands.push('-vf')

      const cmds: string[] = []

      if (scale) {
        cmds.push(`scale=iw*${scale.iw}:ih*${scale.ih}`)
      }

      if (crop) {
        const { width, height, x, y } = crop
        cmds.push(`crop=${width}:${height}:${x}:${y}`)
      }
      if (flipH) {
        cmds.push('hflip')
      }

      commands.push(cmds.join(','))
    }

    if (fps) {
      commands.push('-r', fps.toString())
    }

    if (copy) {
      commands.push('-c:v', 'copy')
    }

    /** 音频复制 */
    commands.push('-c:a', 'copy')

    if (bitrate) {
      commands.push('-b:v', `${bitrate}k`)
    }

    const outputFileName = `${randomString()}.${format || 'mp4'}`

    commands.push(outputFileName)

    console.log('commands', commands)

    return this.run(commands, outputFileName, inputFile, progressCallback)
  }

  /**
   * 视频抽帧
   * @param {File} inputFile - 视频文件
   * @param {VideoFrameOptions} options - 视频抽帧的选项
   * @return {Promise<string>} base64 URL
   */
  public async videoFrame(inputFile: File, options?: VideoFrameOptions) {
    const { time = '00:00:01', flipH } = options || {}
    const newName = 'output.jpg'
    const commands = ['-i', inputFile.name, '-ss', time]

    /** 控制宽为 100px，图片文件过大，会报错 */
    let scaleCmd = 'scale=100:-1'

    if (flipH) {
      scaleCmd += ',hflip'
    }

    commands.push('-vf', scaleCmd, '-frames:v', '1', newName)

    console.log('commands', commands)

    /** 将file 转为 base64 URL */
    const file = await this.run(commands, newName, inputFile)
    const base64Url = await fileToBase64Url(file)
    return base64Url
  }

  /**
   * 取消转换
   *  */
  public async cancel() {
    // 终止 FFmpeg 实例以取消操作
    this.ffmpeg.terminate()
    await this.loadResource()
  }
}

export default FFmpeg.getInstance()
