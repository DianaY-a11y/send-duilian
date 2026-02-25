'use client'

import { templates, TemplateConfig } from '@/templates/templates'

interface TemplateGridProps {
  onSelect: (template: TemplateConfig) => void
}

export default function TemplateGrid({ onSelect }: TemplateGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 md:gap-x-8 gap-y-1 md:gap-y-2 p-6 max-w-4xl mx-auto">
      {templates.map((template) => (
        <button
          key={template.id}
          onClick={() => onSelect(template)}
          className="template-card group flex justify-center w-full bg-transparent border-0 p-0 shadow-none focus:outline-none focus:ring-0"
        >
          <div className="relative w-[160px] h-[320px] min-w-[160px] min-h-[320px] overflow-hidden flex items-center justify-center bg-transparent">
            <img
              src={template.image}
              alt=""
              width={160}
              height={320}
              className="w-full h-full object-contain bg-transparent"
            />
          </div>
        </button>
      ))}
    </div>
  )
}
