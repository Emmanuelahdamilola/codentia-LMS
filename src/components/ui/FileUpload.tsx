// PATH: src/components/ui/FileUpload.tsx
'use client'

import { useState, useRef } from 'react'
import { Upload, X, CheckCircle, Loader2, File } from 'lucide-react'

type UploadFolder = 'videos' | 'thumbnails' | 'assignments' | 'resources'

interface FileUploadProps {
  folder:      UploadFolder
  accept?:     string
  maxSizeMB?:  number
  label?:      string
  onUpload:    (publicUrl: string) => void
  onError?:    (error: string) => void
  currentUrl?: string | null
}

export default function FileUpload({
  folder,
  accept,
  maxSizeMB = 50,
  label = 'Upload File',
  onUpload,
  onError,
  currentUrl,
}: FileUploadProps) {
  const [status,   setStatus]   = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState('')
  const [error,    setError]    = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    // Client-side size validation
    if (file.size > maxSizeMB * 1024 * 1024) {
      const msg = `File too large. Max size is ${maxSizeMB}MB.`
      setError(msg)
      setStatus('error')
      onError?.(msg)
      return
    }

    setFileName(file.name)
    setStatus('uploading')
    setProgress(10)
    setError('')

    try {
      // Step 1: Get presigned URL from our API
      const presignRes = await fetch('/api/upload/presign', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          filename:  file.name,
          mimeType:  file.type,
          folder,
          sizeBytes: file.size,
        }),
      })

      const presignData = await presignRes.json()
      if (!presignRes.ok) throw new Error(presignData.error ?? 'Failed to get upload URL')

      setProgress(30)

      // Step 2: Upload directly to R2 using the presigned URL
      const uploadRes = await fetch(presignData.uploadUrl, {
        method:  'PUT',
        body:    file,
        headers: { 'Content-Type': file.type },
      })

      if (!uploadRes.ok) throw new Error('Upload to storage failed')

      setProgress(100)
      setStatus('done')
      onUpload(presignData.publicUrl)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setError(msg)
      setStatus('error')
      onError?.(msg)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function reset() {
    setStatus('idle')
    setProgress(0)
    setFileName('')
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      {/* Current file */}
      {currentUrl && status === 'idle' && (
        <div className="flex items-center gap-2 text-xs text-[#8A8888] bg-[#F8F6FF] px-3 py-2 rounded-lg">
          <File size={12} />
          <span className="truncate flex-1">Current: {currentUrl.split('/').pop()}</span>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => status === 'idle' && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
          ${status === 'idle'      ? 'border-[#C4B8EE] hover:border-[#8A70D6] hover:bg-[#F8F6FF]' : ''}
          ${status === 'uploading' ? 'border-[#8A70D6] bg-[#F8F6FF] cursor-wait' : ''}
          ${status === 'done'      ? 'border-green-300 bg-green-50 cursor-default' : ''}
          ${status === 'error'     ? 'border-red-300 bg-red-50 cursor-pointer' : ''}
        `}
      >
        {status === 'idle' && (
          <>
            <Upload size={24} className="text-[#C4B8EE] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#424040]">{label}</p>
            <p className="text-xs text-[#8A8888] mt-1">
              Drag & drop or click to browse · Max {maxSizeMB}MB
            </p>
          </>
        )}

        {status === 'uploading' && (
          <>
            <Loader2 size={24} className="text-[#8A70D6] mx-auto mb-2 animate-spin" />
            <p className="text-sm font-semibold text-[#424040]">Uploading {fileName}...</p>
            <div className="mt-3 w-full bg-[#E9E3FF] rounded-full h-1.5">
              <div
                className="bg-[#8A70D6] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        )}

        {status === 'done' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-semibold text-green-700">Upload complete</p>
                <p className="text-xs text-green-600 truncate max-w-[200px]">{fileName}</p>
              </div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); reset() }}
              className="p-1 rounded hover:bg-green-100 transition-colors"
            >
              <X size={14} className="text-green-600" />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <X size={20} className="text-red-500 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-semibold text-red-700">Upload failed</p>
                <p className="text-xs text-red-600">{error}</p>
              </div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); reset() }}
              className="text-xs text-red-600 font-semibold hover:underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}