import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/utils/nanoid'
import { dataUrlToBuffer, getMimeType, getExtension } from '@/lib/utils/dataUrl'
import { getTemplateById } from '@/templates/templates'

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase not configured. Please set environment variables.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { templateId, imageBase64 } = body

    const template = getTemplateById(templateId)
    if (!template) {
      return NextResponse.json(
        { error: 'Invalid template' },
        { status: 400 }
      )
    }

    if (!imageBase64 || !imageBase64.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image data' },
        { status: 400 }
      )
    }

    const slug = generateSlug(12)
    const imageBuffer = dataUrlToBuffer(imageBase64)
    const mimeType = getMimeType(imageBase64)
    const extension = getExtension(mimeType)
    const filePath = `gifts/${slug}/render.${extension}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('gifts')
      .upload(filePath, imageBuffer, {
        contentType: mimeType,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      )
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('gifts')
      .getPublicUrl(filePath)

    const renderUrl = urlData.publicUrl

    const { error: dbError } = await supabaseAdmin
      .from('gifts')
      .insert({
        slug,
        template_id: templateId,
        render_url: renderUrl,
      })

    if (dbError) {
      console.error('Database error:', dbError)
      await supabaseAdmin.storage.from('gifts').remove([filePath])
      return NextResponse.json(
        { error: 'Failed to save gift' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      slug,
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/g/${slug}`,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
