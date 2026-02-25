'use client'

import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'

interface Point {
  x: number
  y: number
  pressure: number
  timestamp: number
}

interface Stroke {
  points: Point[]
  color: string
  baseWidth: number
}

interface BrushCanvasProps {
  width: number
  height: number
  color: string
  brushSize: number
  strokes: Stroke[]
  onStrokesChange: (strokes: Stroke[]) => void
}

export interface BrushCanvasRef {
  getCanvas: () => HTMLCanvasElement | null
  clear: () => void
}

const BrushCanvas = forwardRef<BrushCanvasRef, BrushCanvasProps>(
  ({ width, height, color, brushSize, strokes, onStrokesChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const isDrawing = useRef(false)
    const currentStroke = useRef<Stroke | null>(null)

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
      clear: () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      },
    }))

    const redrawStrokes = useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      strokes.forEach((stroke) => {
        drawStroke(ctx, stroke)
      })
    }, [strokes])

    useEffect(() => {
      redrawStrokes()
    }, [redrawStrokes])

    // Non-passive touch listeners so preventDefault works (stops blue selection on iOS)
    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const prevent = (e: TouchEvent) => e.preventDefault()
      canvas.addEventListener('touchstart', prevent, { passive: false })
      canvas.addEventListener('touchmove', prevent, { passive: false })
      return () => {
        canvas.removeEventListener('touchstart', prevent)
        canvas.removeEventListener('touchmove', prevent)
      }
    }, [])

    const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
      if (stroke.points.length < 2) return

      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = stroke.color

      for (let i = 1; i < stroke.points.length; i++) {
        const p0 = stroke.points[i - 1]
        const p1 = stroke.points[i]

        const dx = p1.x - p0.x
        const dy = p1.y - p0.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const dt = p1.timestamp - p0.timestamp || 1
        const speed = distance / dt
        const speedFactor = Math.max(0.3, Math.min(1.5, 1 - speed * 0.02))
        const pressureFactor = (p0.pressure + p1.pressure) / 2
        const lineWidth = stroke.baseWidth * speedFactor * pressureFactor

        ctx.lineWidth = Math.max(1, lineWidth)
        ctx.globalAlpha = 0.85 + pressureFactor * 0.15

        ctx.beginPath()

        if (i === 1) {
          ctx.moveTo(p0.x, p0.y)
          ctx.lineTo(p1.x, p1.y)
        } else {
          const p_prev = stroke.points[i - 2]
          const midX = (p0.x + p1.x) / 2
          const midY = (p0.y + p1.y) / 2
          ctx.moveTo((p_prev.x + p0.x) / 2, (p_prev.y + p0.y) / 2)
          ctx.quadraticCurveTo(p0.x, p0.y, midX, midY)
        }

        ctx.stroke()
      }

      ctx.globalAlpha = 1
    }

    const getPointerPosition = (e: React.PointerEvent): Point => {
      const canvas = canvasRef.current!
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height

      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
        pressure: e.pressure > 0 ? e.pressure : 0.5,
        timestamp: Date.now(),
      }
    }

    const handlePointerDown = (e: React.PointerEvent) => {
      e.preventDefault()
      isDrawing.current = true

      const point = getPointerPosition(e)
      currentStroke.current = {
        points: [point],
        color,
        baseWidth: brushSize,
      }
      canvasRef.current?.setPointerCapture(e.pointerId)
    }

    const handlePointerMove = (e: React.PointerEvent) => {
      if (!isDrawing.current || !currentStroke.current) return
      e.preventDefault()

      const point = getPointerPosition(e)
      currentStroke.current.points.push(point)

      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const stroke = currentStroke.current
      if (stroke.points.length >= 2) {
        const tempStroke: Stroke = {
          ...stroke,
          points: stroke.points.slice(-3),
        }
        drawStroke(ctx, tempStroke)
      }

    }

    const handlePointerUp = (e: React.PointerEvent) => {
      if (!isDrawing.current || !currentStroke.current) return
      e.preventDefault()

      isDrawing.current = false
      canvasRef.current?.releasePointerCapture(e.pointerId)

      if (currentStroke.current.points.length > 1) {
        onStrokesChange([...strokes, currentStroke.current])
      }

      currentStroke.current = null
    }

    const handlePointerLeave = (e: React.PointerEvent) => {
      if (isDrawing.current) {
        handlePointerUp(e)
      }
    }

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="drawing-canvas absolute inset-0 w-full h-full"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        style={{ cursor: 'crosshair', touchAction: 'none' }}
        tabIndex={-1}
      />
    )
  }
)

BrushCanvas.displayName = 'BrushCanvas'

export default BrushCanvas
