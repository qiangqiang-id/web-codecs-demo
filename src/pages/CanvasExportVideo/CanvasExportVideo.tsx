import { useEffect, useRef, useState } from 'react'
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
  buffers: Uint8Array[]
} {
  const { width, height } = size
  const buffers: Uint8Array[] = []
  let muxer = new MuxerMp4({
    target: new StreamTarget({
      onData: (buffer, _) => {
        // console.log('buffer', buffer)
        buffers.push(buffer)
        sourceBuffer.appendBuffer(buffer)
      },
    }),
    video: {
      codec: 'avc',
      width,
      height,
    },
    fastStart: 'fragmented',
    // firstTimestampBehavior: 'offset',
  })
  return {
    buffers,
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
  ctx.strokeStyle = 'black'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.stroke()
}

async function record(canvas: HTMLCanvasElement, video: HTMLVideoElement) {
  let mediaSource = new MediaSource()
  const width = canvas.width
  const height = canvas.height

  video.src = URL.createObjectURL(mediaSource)

  mediaSource.addEventListener('sourceopen', async () => {
    let sourceBuffer = mediaSource.addSourceBuffer(
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

    let startTime = document.timeline.currentTime
    let lastKeyFrame = -Infinity
    let framesGenerated = 0
    let intervalId: NodeJS.Timeout | null = null

    const cas = document.createElement('canvas')
    cas.width = width
    cas.height = height
    const ctx = cas.getContext('2d')
    document.body.appendChild(cas)

    const encodeVideoFrame = () => {
      let elapsedTime =
        (document.timeline.currentTime as number) - (startTime as number)

      let frame = new VideoFrame(canvas, {
        timestamp: (framesGenerated * 1e6) / 30,
        duration: 1e6 / 30,
      })

      ctx?.drawImage(frame, 0, 0, width, height)

      framesGenerated++

      let needsKeyFrame = elapsedTime - lastKeyFrame >= 500
      if (needsKeyFrame) lastKeyFrame = elapsedTime

      videoEncoder.encode(frame, { keyFrame: needsKeyFrame })
      frame.close()
    }
    encodeVideoFrame()

    intervalId = setInterval(encodeVideoFrame, 1000 / 30)
  })
}

function getRelativeMousePos(canvas: HTMLCanvasElement, e: PointerEvent) {
  let rect = canvas.getBoundingClientRect()
  return { x: e.clientX - rect.x, y: e.clientY - rect.y }
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
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = `rgba(255,165,0,1)`
    // ctx.fillStyle = `rgba(255,255,255,1)`
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    canvas.addEventListener('pointerdown', (event: PointerEvent) => {
      lastPos = getRelativeMousePos(canvas, event)

      draw(ctx, lastPos, lastPos)

      const handleMove = (event: PointerEvent) => {
        let newPos = getRelativeMousePos(canvas, event)
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

  useEffect(() => {
    registerEvent()
  }, [])

  return (
    <div>
      <Button onClick={handleStart}>开始录制</Button>

      <canvas ref={canvasRef} width={720} height={480} />

      <video
        ref={videoRef}
        controls
        autoPlay
        style={{
          width: 720,
          height: 480,
        }}
      />
    </div>
  )
}
