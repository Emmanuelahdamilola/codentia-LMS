// PATH: src/app/api/upload/presign/route.ts
//
// Returns a presigned URL so the client can upload directly to R2
// without passing the file through our server.
//
// Usage from client:
//   const { uploadUrl, publicUrl } = await fetch('/api/upload/presign', {
//     method: 'POST',
//     body: JSON.stringify({ filename, mimeType, folder })
//   }).then(r => r.json())
//
//   await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': mimeType } })
//   // Now publicUrl is the permanent URL for the uploaded file

import { auth } from '@/auth'
import { getPresignedUploadUrl, validateFileSize } from '@/lib/storage'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { filename, mimeType, folder, sizeBytes } = await req.json()

  if (!filename || !mimeType || !folder) {
    return NextResponse.json({ error: 'filename, mimeType and folder are required' }, { status: 400 })
  }

  // Only admins can upload videos and thumbnails
  const adminOnlyFolders = ['videos', 'thumbnails']
  if (adminOnlyFolders.includes(folder) && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can upload videos and thumbnails' }, { status: 403 })
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