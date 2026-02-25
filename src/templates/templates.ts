const TEMPLATE_FILES = [
  '1.png',
  '2.png',
  '3.png',
  '4.png',
]

export interface TemplateConfig {
  id: string
  image: string
  writingArea: {
    x: number
    y: number
    width: number
    height: number
  }
  exportWidth: number
  exportHeight: number
}

function idFromFilename(filename: string): string {
  const base = filename.replace(/\.png$/i, '')
  return base.replace(/\s+/g, '-').replace(/[()]/g, '') || 'template'
}

export const templates: TemplateConfig[] = TEMPLATE_FILES.map((filename) => ({
  id: idFromFilename(filename),
  image: `/templates/${encodeURIComponent(filename)}`,
  writingArea: { x: 0, y: 0, width: 1, height: 1 },
  exportWidth: 800,
  exportHeight: 1600,
}))

export function getTemplateById(id: string): TemplateConfig | undefined {
  return templates.find((t) => t.id === id)
}
