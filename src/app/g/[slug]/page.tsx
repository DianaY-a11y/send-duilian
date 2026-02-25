'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface Gift {
  id: string
  slug: string
  template_id: string
  render_url: string
  created_at: string
}

export default function GiftPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [gift, setGift] = useState<Gift | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAnimation, setShowAnimation] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchGift() {
      try {
        const res = await fetch(`/api/gifts/${slug}`)
        if (!res.ok) {
          throw new Error('Gift not found')
        }
        const data = await res.json()
        setGift(data)
      } catch (err) {
        setError("Can't find this couplet ")
      } finally {
        setLoading(false)
      }
    }

    fetchGift()
  }, [slug])

  useEffect(() => {
    if (!loading && gift) {
      const timer = setTimeout(() => setShowAnimation(false), 800)
      return () => clearTimeout(timer)
    }
  }, [loading, gift])

  const handleCopyLink = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!gift) return
    const link = document.createElement('a')
    link.href = gift.render_url
    link.download = `couplet-${slug}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-cartoon-pattern bg-clouds flex items-center justify-center">
        <div className="text-white text-2xl font-bold animate-pulse">
          Opening couplet...
        </div>
      </main>
    )
  }

  if (error || !gift) {
    return (
      <main className="min-h-screen bg-cartoon-pattern bg-clouds flex flex-col items-center justify-center p-4">
        <h1 className="text-white text-2xl font-bold mb-4">{error || 'Something went wrong'}</h1>
        <a
          href="/"
          className="btn-cartoon bg-couplet-gold text-black px-6 py-3 text-lg"
        >
          Create new couplet →
        </a>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-cartoon-pattern bg-clouds bg-confetti flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl md:text-4xl font-bold text-white mb-6 drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]">
        Someone sent you a couplet!
      </h1>

      <div
        className={`relative overflow-hidden ${
          showAnimation ? 'animate-unroll' : ''
        }`}
        style={{
          maxWidth: '90vw',
          maxHeight: '70vh',
        }}
      >
        <img
          src={gift.render_url}
          alt="Couplet"
          className="w-auto h-auto max-w-full max-h-[70vh] object-contain"
        />
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={handleDownload}
          className="bg-white text-red-700 border-2 border-red-700 px-6 py-3 text-lg font-bold hover:bg-red-50 transition-colors"
        >
          Download
        </button>
        <button
          onClick={handleCopyLink}
          className="bg-white text-red-700 border-2 border-red-700 px-6 py-3 text-lg font-bold hover:bg-red-50 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>

      <a
        href="/"
        className="mt-8 text-couplet-light-gold font-bold hover:underline text-lg"
      >
        I want to write one too
      </a>

      {gift.created_at && (
        <p className="mt-4 text-white/60 text-sm">
          Created on {new Date(gift.created_at).toLocaleDateString('en-US')}
        </p>
      )}
    </main>
  )
}
