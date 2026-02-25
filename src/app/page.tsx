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
