'use client'

import { useState } from 'react'
import TemplateGrid from '@/components/TemplateGrid'
import EditorOverlay from '@/components/EditorOverlay'
import { TemplateConfig } from '@/templates/templates'

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig | null>(null)

  return (
    <main className="min-h-screen bg-cartoon-pattern bg-clouds bg-confetti relative">
      <div className="absolute inset-0 z-[1] bg-black/25 pointer-events-none" aria-hidden />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen py-12 px-4">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white text-center mb-4 drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] animate-bounce-in">
          send your 对联~
        </h1>
        <TemplateGrid onSelect={setSelectedTemplate} />

        <div className="mt-8 rounded-2xl px-6 py-4 max-w-md text-center">
          <p className="text-white font-bold">
            Choose a template 👆
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-white/90 text-sm font-medium mb-3">See some couplets others have written ~</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="/g/740GMvReMo1u"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl overflow-hidden ring-2 ring-transparent focus:outline-none"
              aria-label="Open example 1 in a new tab"
            >
              <img
                src="/templates/1.png"
                alt="Example 1 preview"
                className="w-36 h-36 object-cover block"
              />
            </a>

            <a
              href="/g/vVHE7IKbyoVG"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl overflow-hidden ring-2 ring-transparent focus:outline-none"
              aria-label="Open example 2 in a new tab"
            >
              <img
                src="/templates/2.png"
                alt="Example 2 preview"
                className="w-36 h-36 object-cover block"
              />
            </a>
          </div>
        </div>
      </div>

      {selectedTemplate && (
        <EditorOverlay
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
        />
      )}
    </main>
  )
}
