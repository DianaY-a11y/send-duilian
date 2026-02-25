'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { TemplateConfig } from '@/templates/templates'
import BrushCanvas, { BrushCanvasRef } from './BrushCanvas'
import Toast from './Toast'

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

const INK_COLORS = [
  { id: 'black', color: '#1a1a1a', name: 'Ink black' },
  { id: 'brown', color: '#4a3728', name: 'Brown' },
  { id: 'gold', color: '#b8860b', name: 'Gold' },
  { id: 'blue', color: '#1e3a5f', name: 'Navy' },
]

const BRUSH_SIZES = [
  { id: 'small', size: 10, label: 'S' },
  { id: 'medium', size: 16, label: 'M' },
  { id: 'large', size: 26, label: 'L' },
]

interface EditorOverlayProps {
  template: TemplateConfig
  onClose: () => void
}

export default function EditorOverlay({ template, onClose }: EditorOverlayProps) {
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [inkColor, setInkColor] = useState(INK_COLORS[0].color)
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1].size)
  const [isSaving, setIsSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [isAnimating, setIsAnimating] = useState(true)

  const canvasRef = useRef<BrushCanvasRef>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const handleUndo = () => {
    if (strokes.length > 0) {
      setStrokes(strokes.slice(0, -1))
    }
  }

  const handleClear = () => {
    setStrokes([])
    canvasRef.current?.clear()
  }

  const renderToExportCanvas = useCallback(async (): Promise<HTMLCanvasElement> => {
    const bgImage = new Image()
    bgImage.crossOrigin = 'anonymous'
    await new Promise<void>((resolve, reject) => {
      bgImage.onload = () => resolve()
      bgImage.onerror = reject
      bgImage.src = template.image
    })
    const exportW = bgImage.naturalWidth
    const exportH = bgImage.naturalHeight
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = exportW
    exportCanvas.height = exportH
    const ctx = exportCanvas.getContext('2d')!
    ctx.drawImage(bgImage, 0, 0)
    const wa = template.writingArea
    const waX = wa.x * exportW
    const waY = wa.y * exportH
    const waW = wa.width * exportW
    const waH = wa.height * exportH
    const drawCanvas = canvasRef.current?.getCanvas()
    if (!drawCanvas) throw new Error('Canvas not found')
    const scaleX = waW / drawCanvas.width
    const scaleY = waH / drawCanvas.height
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return
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
        const lineWidth = stroke.baseWidth * speedFactor * pressureFactor * Math.min(scaleX, scaleY)
        ctx.lineWidth = Math.max(1, lineWidth)
        ctx.globalAlpha = 0.85 + pressureFactor * 0.15
        ctx.beginPath()
        const x0 = waX + p0.x * scaleX
        const y0 = waY + p0.y * scaleY
        const x1 = waX + p1.x * scaleX
        const y1 = waY + p1.y * scaleY
        if (i === 1) {
          ctx.moveTo(x0, y0)
          ctx.lineTo(x1, y1)
        } else {
          const p_prev = stroke.points[i - 2]
          const x_prev = waX + p_prev.x * scaleX
          const y_prev = waY + p_prev.y * scaleY
          const midX = (x0 + x1) / 2
          const midY = (y0 + y1) / 2
          ctx.moveTo((x_prev + x0) / 2, (y_prev + y0) / 2)
          ctx.quadraticCurveTo(x0, y0, midX, midY)
        }
        ctx.stroke()
      }
    })
    ctx.globalAlpha = 1
    return exportCanvas
  }, [template, strokes])

  const handleSaveLuck = async () => {
    if (strokes.length === 0) return
    try {
      const exportCanvas = await renderToExportCanvas()
      const dataUrl = exportCanvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `couplet-luck-${Date.now()}.png`
      link.click()
      setToastMessage('Saved! 🍀')
      setShowToast(true)
    } catch (e) {
      console.error(e)
      setToastMessage('Could not save image')
      setShowToast(true)
    }
  }

  const handleSaveAndSend = async () => {
    if (isSaving) return
    setIsSaving(true)
    try {
      const exportCanvas = await renderToExportCanvas()
      let imageData: string
      try {
        imageData = exportCanvas.toDataURL('image/webp', 0.9)
        if (!imageData.startsWith('data:image/webp')) {
          imageData = exportCanvas.toDataURL('image/png')
        }
      } catch {
        imageData = exportCanvas.toDataURL('image/png')
      }

      const response = await fetch('/api/gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          imageBase64: imageData,
        }),
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        const errMsg = (errBody as { error?: string }).error || response.statusText || 'Failed to save'
        throw new Error(errMsg)
      }

      const { slug } = await response.json()
      const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/g/${slug}`

      try {
        await navigator.clipboard.writeText(shareUrl)
      } catch {
        const textarea = document.createElement('textarea')
        textarea.value = shareUrl
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }

      setToastMessage('Link copied!')
      setShowToast(true)
    } catch (error) {
      console.error('Save error:', error)
      const message = error instanceof Error ? error.message : 'Something went wrong'
      setToastMessage(message)
      setShowToast(true)
    } finally {
      setIsSaving(false)
    }
  }

  const canvasWidth = 600
  const canvasHeight = 1200

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isAnimating ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        ref={containerRef}
        className={`relative flex flex-col md:flex-row gap-4 max-w-full max-h-full transition-transform duration-500 items-center justify-center ${
          isAnimating ? 'scale-75' : 'scale-100'
        }`}
      >
        <div className="relative flex-shrink-0 flex items-center justify-center">
          <div
            className="relative overflow-hidden max-h-[95vh] aspect-[1/2]"
            style={{ width: 'min(90vw, 47.5vh)' }}
          >
            <img
              src={template.image}
              alt=""
              className="absolute inset-0 w-full h-full object-contain pointer-events-none bg-transparent"
            />
            <div
              className="absolute"
              style={{
                left: `${template.writingArea.x * 100}%`,
                top: `${template.writingArea.y * 100}%`,
                width: `${template.writingArea.width * 100}%`,
                height: `${template.writingArea.height * 100}%`,
              }}
            >
              <BrushCanvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                color={inkColor}
                brushSize={brushSize}
                strokes={strokes}
                onStrokesChange={setStrokes}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-row md:flex-col gap-3 bg-white p-4 border-2 border-red-700 self-center">
          <button
            onClick={onClose}
            className="btn-editor px-4 py-2 text-sm"
          >
            Cancel
          </button>

          <div className="flex flex-row md:flex-col gap-2">
            <span className="text-red-700 text-xs font-bold hidden md:block">Ink</span>
            <div className="flex gap-2">
              {INK_COLORS.map((ink) => (
                <button
                  key={ink.id}
                  onClick={() => setInkColor(ink.color)}
                  className={`w-9 h-9 border-2 flex-shrink-0 transition-colors ${
                    inkColor === ink.color ? 'border-red-700 ring-2 ring-red-700 ring-offset-1' : 'border-red-300 hover:border-red-500'
                  }`}
                  style={{ backgroundColor: ink.color }}
                  title={ink.name}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-row md:flex-col gap-2">
            <span className="text-red-700 text-xs font-bold hidden md:block">Brush</span>
            <div className="flex gap-2">
              {BRUSH_SIZES.map((brush) => (
                <button
                  key={brush.id}
                  onClick={() => setBrushSize(brush.size)}
                  className={`w-10 h-10 border-2 font-bold text-sm transition-colors ${
                    brushSize === brush.size
                      ? 'bg-red-700 text-white border-red-700'
                      : 'bg-white text-red-700 border-red-700 hover:bg-red-50'
                  }`}
                >
                  {brush.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleUndo}
              disabled={strokes.length === 0}
              className="btn-editor px-3 py-2 text-sm"
            >
              ↩ Undo
            </button>
            <button
              onClick={handleClear}
              disabled={strokes.length === 0}
              className="btn-editor px-3 py-2 text-sm"
            >
              Clear
            </button>
          </div>

          <button
            onClick={handleSaveLuck}
            disabled={strokes.length === 0}
            className="btn-editor px-4 py-3 text-sm w-full"
          >
            SAVE THE LUCK
          </button>

          <button
            onClick={handleSaveAndSend}
            disabled={isSaving || strokes.length === 0}
            className="btn-editor px-4 py-3 text-sm w-full"
          >
            Send
          </button>
        </div>
      </div>

      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  )
}
