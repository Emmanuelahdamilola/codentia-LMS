// PATH: src/components/ui/AvatarUpload.tsx
'use client'

import { useState, useRef } from 'react'

interface Props {
  currentImage: string | null
  initials:     string
  size?:        number          // px, default 72
  onUpload:     (url: string) => void
  onError?:     (msg: string)  => void
}

export default function AvatarUpload({
  currentImage, initials, size = 72, onUpload, onError,
}: Props) {
  const [preview,   setPreview]   = useState<string | null>(currentImage)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    // Validate
    if (!file.type.startsWith('image/')) {
      onError?.('Please select an image file.'); return
    }
    if (file.size > 5 * 1024 * 1024) {
      onError?.('Image must be under 5MB.'); return
    }

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    setUploading(true)

    try {
      // Get presigned URL from R2
      const presignRes = await fetch('/api/upload/presign', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          filename:  file.name,
          mimeType:  file.type,
          folder:    'thumbnails',
          sizeBytes: file.size,
        }),
      })
      const presign = await presignRes.json()
      if (!presignRes.ok) throw new Error(presign.error ?? 'Failed to get upload URL')

      // Upload directly to R2
      const uploadRes = await fetch(presign.uploadUrl, {
        method:  'PUT',
        body:    file,
        headers: { 'Content-Type': file.type },
      })
      if (!uploadRes.ok) throw new Error('Upload failed')

      onUpload(presign.publicUrl)
    } catch (err) {
      // Revert preview on failure
      setPreview(currentImage)
      onError?.(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      URL.revokeObjectURL(localUrl)
    }
  }

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      {/* Avatar circle */}
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center font-bold text-white cursor-pointer"
        style={{
          background: preview ? 'transparent' : 'linear-gradient(135deg,#7C5CDB,#6146C4)',
          fontSize: size * 0.32,
          border: '3px solid white',
          boxShadow: '0 2px 8px rgba(0,0,0,.12)',
        }}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>

      {/* Camera overlay button */}
      <button
        type="button"
        onClick={() => !uploading && inputRef.current?.click()}
        disabled={uploading}
        className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center transition-all"
        style={{
          background: uploading ? '#EDE8FF' : '#7C5CDB',
          border: '2px solid white',
          boxShadow: '0 1px 4px rgba(0,0,0,.15)',
        }}
        title="Change profile photo"
      >
        {uploading ? (
          <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" stroke="#7C5CDB" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}