// PATH: src/app/api/upload/presign/route.ts
import { auth }                              from '@/auth'
import { getPresignedUploadUrl, validateFileSize } from '@/lib/storage'
import { NextResponse }                      from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check R2 is configured before doing anything else
  if (!process.env.STORAGE_ENDPOINT || !process.env.STORAGE_ACCESS_KEY_ID || !process.env.STORAGE_SECRET_ACCESS_KEY) {
    return NextResponse.json({
      error: 'File storage is not configured. Add STORAGE_ENDPOINT, STORAGE_ACCESS_KEY_ID and STORAGE_SECRET_ACCESS_KEY to .env.local (Cloudflare R2 required).',
    }, { status: 503 })
  }

  const { filename, mimeType, folder, sizeBytes } = await req.json()

  if (!filename || !mimeType || !folder) {
    return NextResponse.json({ error: 'filename, mimeType and folder are required' }, { status: 400 })
  }

  // Only admins can upload videos and thumbnails (lesson content)
  const adminOnlyFolders = ['videos', 'thumbnails']
  if (adminOnlyFolders.includes(folder) && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can upload to this folder' }, { status: 403 })
  }

  try {
    if (sizeBytes) validateFileSize(sizeBytes, folder)
    const result = await getPresignedUploadUrl(filename, mimeType, folder)
    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}