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
  const [toastDuration, setToastDuration] = useState(3000)
  const [isAnimating, setIsAnimating] = useState(true)
  const [panelOpen, setPanelOpen] = useState(false)
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 600, height: 1200 })

  const canvasRef = useRef<BrushCanvasRef>(null)

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      const w = img.naturalWidth || template.exportWidth
      const h = img.naturalHeight || template.exportHeight
      if (w > 0 && h > 0) {
        const base = 600
        setCanvasDimensions({
          width: base,
          height: Math.round(base * (h / w)),
        })
      }
    }
    img.src = template.image
  }, [template.image, template.exportWidth, template.exportHeight])

  const copyToClipboard = useCallback((text: string): boolean => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
        return true
      }
    } catch {
      // continue to fallback
    }
    try {
      const el = document.createElement('textarea')
      el.value = text
      el.setAttribute('readonly', '')
      el.style.position = 'fixed'
      el.style.left = '-9999px'
      el.style.top = '0'
      document.body.appendChild(el)
      el.select()
      el.setSelectionRange(0, text.length)
      const ok = document.execCommand('copy')
      document.body.removeChild(el)
      return ok
    } catch {
      return false
    }
  }, [])

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
    await new Promise<void>((resolve, reject) => {
      bgImage.onload = () => resolve()
      bgImage.onerror = reject
      bgImage.src = template.image
    })
    const MAX_EXPORT_PX = 1200
    let exportW = bgImage.naturalWidth || template.exportWidth
    let exportH = bgImage.naturalHeight || template.exportHeight
    if (exportW <= 0 || exportH <= 0) {
      exportW = template.exportWidth
      exportH = template.exportHeight
    }
    const maxSide = Math.max(exportW, exportH)
    if (maxSide > MAX_EXPORT_PX) {
      const scale = MAX_EXPORT_PX / maxSide
      exportW = Math.round(exportW * scale)
      exportH = Math.round(exportH * scale)
    }
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = exportW
    exportCanvas.height = exportH
    const ctx = exportCanvas.getContext('2d')!
    // Ensure a white background for exported images (JPEG doesn't support transparency)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, exportW, exportH)
    ctx.drawImage(bgImage, 0, 0, exportW, exportH)
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
      setToastDuration(3000)
      setToastMessage('Saved! 🍀')
      setShowToast(true)
    } catch (e) {
      console.error(e)
      setToastDuration(3000)
      setToastMessage('Could not save image')
      setShowToast(true)
    }
  }

  const handleSaveAndSend = async () => {
    if (isSaving) return
    setIsSaving(true)
    try {
      // Same resolution as download (1200px cap) for high-quality send
      const exportCanvas = await renderToExportCanvas()
      const JPEG_QUALITY = 0.94
      let imageData: string
      try {
        try {
          imageData = exportCanvas.toDataURL('image/jpeg', JPEG_QUALITY)
          if (!imageData.startsWith('data:image/jpeg')) imageData = exportCanvas.toDataURL('image/png')
        } catch {
          imageData = exportCanvas.toDataURL('image/png')
        }
      } catch (e) {
        console.error('toDataURL failed', e)
        try {
          const small = document.createElement('canvas')
          small.width = Math.min(800, exportCanvas.width)
          small.height = Math.min(1600, exportCanvas.height)
          const sctx = small.getContext('2d')!
          sctx.drawImage(exportCanvas, 0, 0, small.width, small.height)
          imageData = small.toDataURL('image/jpeg', JPEG_QUALITY) || small.toDataURL('image/png')
        } catch (e2) {
          console.error('toDataURL fallback failed', e2)
          setToastDuration(3000)
          setToastMessage('Could not export image')
          setShowToast(true)
          return
        }
      }
      if (!imageData || !imageData.startsWith('data:image/')) {
        setToastDuration(3000)
        setToastMessage('Could not export image')
        setShowToast(true)
        return
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

      copyToClipboard(shareUrl)
      setToastMessage(`Copied link: ${shareUrl}`)
      setToastDuration(8000)
      setShowToast(true)
    } catch (error) {
      console.error('Save error:', error)
      const message = error instanceof Error ? error.message : 'Something went wrong'
      setToastDuration(3000)
      setToastMessage(message)
      setShowToast(true)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className={`editor-overlay-root fixed inset-0 z-50 bg-black/80 flex flex-col items-center p-3 pb-8 overflow-y-auto transition-opacity duration-300 md:flex-row md:justify-center md:overflow-visible ${
        isAnimating ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`relative flex flex-col md:flex-row gap-4 w-full max-w-full min-h-0 transition-transform duration-500 items-center justify-center md:max-h-full ${
          isAnimating ? 'scale-75' : 'scale-100'
        }`}
      >
        <div className="editor-draw-area relative flex-shrink-0 flex items-center justify-center">
          <div
            className="relative overflow-hidden w-[min(90vw,45vh)] max-h-[90vh] md:w-[min(90vw,47.5vh)] md:max-h-[95vh]"
            style={{
              aspectRatio: `${canvasDimensions.width} / ${canvasDimensions.height}`,
            }}
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
                width={canvasDimensions.width}
                height={canvasDimensions.height}
                color={inkColor}
                brushSize={brushSize}
                strokes={strokes}
                onStrokesChange={setStrokes}
              />
            </div>
          </div>
        </div>

        {/* Mobile: toggle to open tools panel */}
        <button
          type="button"
          onClick={() => setPanelOpen((o) => !o)}
          className="md:hidden flex-shrink-0 btn-editor px-4 py-3 text-sm"
          aria-expanded={panelOpen}
          aria-label={panelOpen ? 'Close tools' : 'Open tools'}
        >
          {panelOpen ? 'Close tools' : 'Tools'}
        </button>

        {/* Panel: vertical layout when open (mobile) or always visible (desktop); vertical stack like laptop */}
        <div
          className={`flex flex-shrink-0 flex-col gap-3 bg-white p-4 border-2 border-red-700 self-center mt-2 md:mt-0 ${
            panelOpen ? 'flex' : 'hidden md:flex'
          }`}
        >
          <button
            onClick={onClose}
            className="btn-editor px-4 py-2 text-sm"
          >
            Cancel
          </button>

          <div className="flex flex-col gap-2">
            <span className="text-red-700 text-xs font-bold">Ink</span>
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

          <div className="flex flex-col gap-2">
            <span className="text-red-700 text-xs font-bold">Brush</span>
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
        duration={toastDuration}
      />
    </div>
  )
}
