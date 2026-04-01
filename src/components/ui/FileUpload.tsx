// PATH: src/components/ui/FileUpload.tsx
'use client'

import { useState, useRef } from 'react'
import { Upload, X, CheckCircle2, Loader2, FileText, CloudUpload } from 'lucide-react'

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
  folder, accept, maxSizeMB = 50, label = 'Upload File',
  onUpload, onError, currentUrl,
}: FileUploadProps) {
  const [status,   setStatus]   = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState('')
  const [error,    setError]    = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (file.size > maxSizeMB * 1024 * 1024) {
      const msg = `File too large. Max size is ${maxSizeMB}MB.`
      setError(msg); setStatus('error'); onError?.(msg); return
    }
    setFileName(file.name); setStatus('uploading'); setProgress(10); setError('')
    try {
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, mimeType: file.type, folder, sizeBytes: file.size }),
      })
      const presignData = await presignRes.json()
      if (!presignRes.ok) throw new Error(presignData.error ?? 'Failed to get upload URL')
      setProgress(35)
      const uploadRes = await fetch(presignData.uploadUrl, {
        method: 'PUT', body: file, headers: { 'Content-Type': file.type },
      })
      if (!uploadRes.ok) throw new Error('Upload to storage failed')
      setProgress(100); setStatus('done'); onUpload(presignData.publicUrl)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setError(msg); setStatus('error'); onError?.(msg)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-2">
      {currentUrl && status === 'idle' && (
        <div className="flex items-center gap-2 text-[12px] px-3 py-2 rounded-xl"
          style={{ background: 'var(--color-primary-faint)', border: '1px solid var(--color-primary-tint)', color: 'var(--color-primary)' }}>
          <FileText size={12} />
          <span className="truncate flex-1">Current: {currentUrl.split('/').pop()}</span>
        </div>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onClick={() => status === 'idle' && inputRef.current?.click()}
        className={`
          rounded-2xl p-7 text-center transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)]
          ${status === 'idle'
            ? dragging
              ? 'cursor-copy scale-[1.01]'
              : 'cursor-pointer hover:scale-[1.005]'
            : ''}
          ${status === 'uploading' ? 'cursor-wait' : ''}
          ${status === 'done'      ? 'cursor-default' : ''}
          ${status === 'error'     ? 'cursor-pointer' : ''}
        `}
        style={{
          border: `2px dashed ${
            status === 'done'  ? '#BBF7D0' :
            status === 'error' ? '#FECACA' :
            dragging           ? 'var(--color-primary)' :
                                 'var(--color-border)'
          }`,
          background:
            status === 'done'  ? '#F0FDF4' :
            status === 'error' ? '#FEF2F2' :
            dragging           ? 'var(--color-primary-faint)' :
                                 'var(--color-bg)',
        }}
      >
        {status === 'idle' && (
          <div className="flex flex-col items-center gap-2.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${dragging ? 'scale-110' : ''}`}
              style={{ background: dragging ? 'var(--color-primary-tint)' : 'var(--color-border-subtle)' }}>
              <CloudUpload size={22} style={{ color: dragging ? 'var(--color-primary)' : '#9591A8' }} />
            </div>
            <div>
              <p className="text-[13.5px] font-semibold text-[#1A1523]">{label}</p>
              <p className="text-[12px] text-[#9591A8] mt-0.5">
                {dragging ? 'Drop it!' : `Drag & drop or click to browse · Max ${maxSizeMB}MB`}
              </p>
            </div>
            {accept && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'var(--color-primary-tint)', color: 'var(--color-primary)' }}>
                {accept.replace(/,/g, ', ')}
              </span>
            )}
          </div>
        )}

        {status === 'uploading' && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-primary-tint)' }}>
              <Loader2 size={22} style={{ color: 'var(--color-primary)' }} className="animate-spin" />
            </div>
            <div>
              <p className="text-[13.5px] font-semibold text-[#1A1523]">Uploading…</p>
              <p className="text-[12px] text-[#9591A8] truncate max-w-[220px] mt-0.5">{fileName}</p>
            </div>
            <div className="w-full max-w-[180px] h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: 'var(--color-primary)' }} />
            </div>
            <p className="text-[11px] font-semibold" style={{ color: 'var(--color-primary)' }}>{progress}%</p>
          </div>
        )}

        {status === 'done' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#DCFCE7' }}>
                <CheckCircle2 size={20} className="text-[#16A34A]" />
              </div>
              <div className="text-left">
                <p className="text-[13px] font-semibold text-[#15803D]">Upload complete!</p>
                <p className="text-[11.5px] text-[#16A34A]/70 truncate max-w-[200px]">{fileName}</p>
              </div>
            </div>
            <button onClick={e => { e.stopPropagation(); setStatus('idle'); setProgress(0); setFileName(''); if (inputRef.current) inputRef.current.value = '' }}
              className="p-1.5 rounded-lg hover:bg-[#BBF7D0] transition-colors">
              <X size={13} className="text-[#16A34A]" />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FEE2E2' }}>
                <X size={20} className="text-[#DC2626]" />
              </div>
              <div className="text-left">
                <p className="text-[13px] font-semibold text-[#B91C1C]">Upload failed</p>
                <p className="text-[11.5px] text-[#DC2626]/70">{error}</p>
              </div>
            </div>
            <button onClick={e => { e.stopPropagation(); setStatus('idle'); setError('') }}
              className="text-[12px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
              style={{ color: '#DC2626', background: '#FEE2E2' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FECACA')}
              onMouseLeave={e => (e.currentTarget.style.background = '#FEE2E2')}>
              Retry
            </button>
          </div>
        )}
      </div>

      <input ref={inputRef} type="file" accept={accept} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} className="hidden" />
    </div>
  )
}
