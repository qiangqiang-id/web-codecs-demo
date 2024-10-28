import { useEffect, useRef } from 'react'
import { Button } from 'antd'
import { Muxer as MuxerMp4, StreamTarget } from 'mp4-muxer'

type Size = {
  width: number
  height: number
}

type Position = {
  x: number
  y: number
}

let lastPos = { x: 0, y: 0 }

function createOutHandler(
  sourceBuffer: SourceBuffer,
  size: Size
): {
  handler: EncodedVideoChunkOutputCallback
  muxer: MuxerMp4<StreamTarget>
} {
  const { width, height } = size
  const muxer = new MuxerMp4({
    target: new StreamTarget({
      onData: (buffer) => {
        sourceBuffer.appendBuffer(buffer)
      },
    }),
    video: {
      codec: 'avc',
      width,
      height,
    },
    fastStart: 'fragmented',
    firstTimestampBehavior: 'offset',
  })
  return {
    muxer,
    handler: (chunk, meta) => {
      muxer.addVideoChunk(chunk, meta)
    },
  }
}

function draw(ctx: CanvasRenderingContext2D, from: Position, to: Position) {
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.stroke()
}

async function record(canvas: HTMLCanvasElement, video: HTMLVideoElement) {
  const mediaSource = new MediaSource()
  const width = canvas.width
  const height = canvas.height

  video.src = URL.createObjectURL(mediaSource)

  mediaSource.addEventListener('sourceopen', async () => {
    const sourceBuffer = mediaSource.addSourceBuffer(
      'video/mp4; codecs="avc1.64001F'
    )

    const outHandler = createOutHandler(sourceBuffer, { width, height })

    const videoEncoder = new VideoEncoder({
      output: outHandler.handler,
      error: (e) => console.error('Video encoding error', e),
    })

    videoEncoder.configure({
      codec: 'avc1.64001F',
      width,
      height,
      bitrate: 3_000_000,
    })

    const startTime = document.timeline.currentTime
    let lastKeyFrame = -Infinity
    let framesGenerated = 0
    // let intervalId: NodeJS.Timeout | null = null

    const encodeVideoFrame = () => {
      const elapsedTime =
        (document.timeline.currentTime as number) - (startTime as number)

      const frame = new VideoFrame(canvas, {
        timestamp: (framesGenerated * 1e6) / 30,
        duration: 1e6 / 30,
      })

      framesGenerated++

      const needsKeyFrame = elapsedTime - lastKeyFrame >= 500
      if (needsKeyFrame) lastKeyFrame = elapsedTime

      videoEncoder.encode(frame, { keyFrame: needsKeyFrame })
      frame.close()
    }
    encodeVideoFrame()

    // intervalId =
    setInterval(encodeVideoFrame, 1000 / 30)
  })
}

function getRelativeMousePos(canvas: HTMLCanvasElement, e: PointerEvent) {
  const rect = canvas.getBoundingClientRect()
  return { x: e.clientX - rect.x, y: e.clientY - rect.y }
}

function initCanvas(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  // ctx.fillStyle = `rgba(255,165,0,1)`
  ctx.fillStyle = `rgba(0,0,0,1)`
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
}

export default function CanvasExportVideo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const videoRef = useRef<HTMLVideoElement>(null)

  const handleStart = () => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!canvasRef.current || !ctx || !videoRef.current) return
    record(canvasRef.current, videoRef.current)
  }

  const registerEvent = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    initCanvas(ctx)
    canvas.addEventListener('pointerdown', (event: PointerEvent) => {
      lastPos = getRelativeMousePos(canvas, event)

      draw(ctx, lastPos, lastPos)

      const handleMove = (event: PointerEvent) => {
        const newPos = getRelativeMousePos(canvas, event)
        draw(ctx, lastPos, newPos)
        lastPos = newPos
      }
      const handleUp = () => {
        canvas.removeEventListener('pointermove', handleMove)
        canvas.removeEventListener('pointerup', handleUp)
      }

      canvas.addEventListener('pointermove', handleMove)
      canvas.addEventListener('pointerup', handleUp)
    })
  }

  const handleClearCanvas = () => {
    const ctx = canvasRef.current?.getContext('2d')
    ctx && initCanvas(ctx)
  }

  useEffect(() => {
    registerEvent()
  }, [])

  return (
    <div>
      <Button onClick={handleClearCanvas}>擦除画布</Button>
      <Button onClick={handleStart}>开始录制</Button>

      <div style={{ marginTop: 20 }}>
        <canvas
          ref={canvasRef}
          width={480}
          height={480}
          style={{ marginRight: 20 }}
        />

        <video
          ref={videoRef}
          controls
          autoPlay
          style={{
            width: 480,
            height: 480,
          }}
        />
      </div>
    </div>
  )
}
