'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Image as ImageIcon, Film, Loader2, AlertCircle } from 'lucide-react'

interface UploadedMedia {
  id: string
  url: string
  path: string
  type: 'image' | 'video'
  name: string
  size: number
}

interface MediaUploaderProps {
  onMediaChange: (media: UploadedMedia[]) => void
  onUploadingChange?: (uploading: boolean) => void
  maxFiles?: number
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
const ACCEPTED_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES]
const MAX_IMAGE_SIZE_MB = 50
const MAX_VIDEO_SIZE_MB = 700
const CLOUD_NAME = 'dnhndstzh'
const UPLOAD_PRESET = 'social_universe'

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function MediaUploader({ onMediaChange, onUploadingChange, maxFiles = 4 }: MediaUploaderProps) {
  const [media, setMedia] = useState<UploadedMedia[]>([])
  const [uploading, setUploading] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(async (file: File) => {
    const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type)
    const sizeLimit = isVideo ? MAX_VIDEO_SIZE_MB : MAX_IMAGE_SIZE_MB

    if (file.size > sizeLimit * 1024 * 1024) {
      setError(`"${file.name}" exceeds ${sizeLimit}MB limit`)
      return null
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(`"${file.name}" is not a supported file type`)
      return null
    }

    setUploading(prev => {
      const next = [...prev, file.name]
      onUploadingChange?.(true)
      return next
    })
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', UPLOAD_PRESET)

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
        { method: 'POST', body: formData }
      )
      const data = await res.json()

      if (data.error) {
        setError(`Upload failed: ${data.error.message}`)
        return null
      }

      return {
        id: data.public_id,
        url: data.secure_url,
        path: data.secure_url,
        type: isVideo ? 'video' as const : 'image' as const,
        name: file.name,
        size: file.size,
      }
    } catch (err: any) {
      setError(`Upload failed: ${err.message}`)
      return null
    } finally {
      setUploading(prev => {
        const next = prev.filter(n => n !== file.name)
        onUploadingChange?.(next.length > 0)
        return next
      })
    }
  }, [onUploadingChange])

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const toUpload = Array.from(files).slice(0, maxFiles - media.length)
    if (toUpload.length === 0) { setError(`Maximum ${maxFiles} files allowed`); return }
    const results = await Promise.all(toUpload.map(uploadFile))
    const successful = results.filter(Boolean) as UploadedMedia[]
    if (successful.length > 0) {
      const updated = [...media, ...successful]
      setMedia(updated)
      onMediaChange(updated)
    }
  }, [media, maxFiles, uploadFile, onMediaChange])

  const removeMedia = (item: UploadedMedia) => {
    const updated = media.filter(m => m.id !== item.id)
    setMedia(updated)
    onMediaChange(updated)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  if (media.length === 0 && uploading.length === 0) {
    return (
      <div className="space-y-2">
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all cursor-pointer py-10
            ${dragOver ? 'border-[#f5c800] bg-[#f5c800]/10' : 'border-[#e0e0e0] bg-[#fafafa] hover:border-[#ccc] hover:bg-white/[0.04]'}`}
        >
          <div className={`p-3 rounded-xl ${dragOver ? 'bg-[#f5c800]/20' : 'bg-[#f5f5f5]'}`}>
            <Upload size={22} className={dragOver ? 'text-[#b8930a]' : 'text-[#777]'} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[#444]">{dragOver ? 'Drop files here' : 'Drag & drop media'}</p>
            <p className="text-xs text-[#888] mt-1">or <span className="text-[#b8930a]">browse files</span> · Images 50MB · Videos 700MB</p>
          </div>
          <input ref={fileInputRef} type="file" multiple accept={ACCEPTED_TYPES.join(',')}
            className="hidden" onChange={e => e.target.files &handleFiles(e.target.files)} />
        </div>
        {error && <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs"><AlertCircle size={13} />{error}</div>}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {media.map(item => (
          <div key={item.id} className="relative group rounded-xl overflow-hidden bg-[#f5f5f5] border border-[#e0e0e0] aspect-video">
            {item.type === 'image'
              ? <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex flex-col items-center justify-center gap-2"><Film size={28} className="text-[#777]" /><p className="text-xs text-[#777] truncate px-2">{item.name}</p></div>
            }
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#1a1a1a] font-medium truncate">{item.name}</p>
                <p className="text-xs text-[#666]">{formatBytes(item.size)}</p>
              </div>
            </div>
            <button onClick={() => removeMedia(item)}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-red-500/80 text-[#1a1a1a] transition-colors opacity-0 group-hover:opacity-100">
              <X size={12} />
            </button>
            <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60 text-xs text-[#444]">
              {item.type === 'image' ? <ImageIcon size={10} /> : <Film size={10} />} {item.type}
            </div>
          </div>
        ))}
        {uploading.map(name => (
          <div key={name} className="rounded-xl bg-[#f5f5f5] border border-dashed border-[#e0e0e0] aspect-video flex flex-col items-center justify-center gap-2">
            <Loader2 size={22} className="text-[#b8930a] animate-spin" />
            <p className="text-xs text-[#777] truncate px-2">{name}</p>
          </div>
        ))}
        {media.length < maxFiles && uploading.length === 0 && (
          <button onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border-2 border-dashed border-[#e0e0e0] hover:border-[#ccc] bg-[#fafafa] hover:bg-white/[0.04] aspect-video flex flex-col items-center justify-center gap-2 transition-all text-[#777] hover:text-[#666]">
            <Upload size={20} /><span className="text-xs">Add more</span>
          </button>
        )}
      </div>
      <input ref={fileInputRef} type="file" multiple accept={ACCEPTED_TYPES.join(',')}
        className="hidden" onChange={e => e.target.files && handleFiles(e.target.files)} />
      <p className="text-xs text-[#888]">{media.length}/{maxFiles} files</p>
      {error && <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs"><AlertCircle size={13} />{error}</div>}
      <div onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-[#e0e0e0] text-xs text-[#888] hover:border-[#ccc] hover:text-[#777] cursor-pointer transition-all">
        <Upload size={12} /> Drop more files or click to browse
      </div>
    </div>
  )
}
