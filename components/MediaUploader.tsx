'use client'

import { useState, useRef, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Upload, X, Image as ImageIcon, Film, Loader2, AlertCircle } from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
  maxFiles?: number
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
const ACCEPTED_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES]
const MAX_IMAGE_SIZE_MB = 50
const MAX_VIDEO_SIZE_MB = 700

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function MediaUploader({ onMediaChange, maxFiles = 4 }: MediaUploaderProps) {
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
    setUploading(prev => [...prev, file.name])
    setError(null)
    const ext = file.name.split('.').pop()
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const path = `post-media/${id}.${ext}`
    const { data, error: uploadError } = await supabase.storage
      .from('post-media')
      .upload(path, file, { cacheControl: '3600', upsert: false })
    setUploading(prev => prev.filter(n => n !== file.name))
    if (uploadError) { setError(`Upload failed: ${uploadError.message}`); return null }
    const { data: urlData } = supabase.storage.from('post-media').getPublicUrl(data.path)
    return { id, url: urlData.publicUrl, path: data.path,
      type: ACCEPTED_IMAGE_TYPES.includes(file.type) ? 'image' as const : 'video' as const,
      name: file.name, size: file.size }
  }, [])

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

  const removeMedia = async (item: UploadedMedia) => {
    await supabase.storage.from('post-media').remove([item.path])
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
            ${dragOver ? 'border-indigo-400 bg-indigo-500/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'}`}
        >
          <div className={`p-3 rounded-xl ${dragOver ? 'bg-indigo-500/20' : 'bg-white/5'}`}>
            <Upload size={22} className={dragOver ? 'text-indigo-400' : 'text-slate-500'} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-300">{dragOver ? 'Drop files here' : 'Drag & drop media'}</p>
            <p className="text-xs text-slate-600 mt-1">or <span className="text-indigo-400">browse files</span> · Images 10MB · ViMB</p>
          </div>
          <input ref={fileInputRef} type="file" multiple accept={ACCEPTED_TYPES.join(',')}
            className="hidden" onChange={e => e.target.files && handleFiles(e.target.files)} />
        </div>
        {error && <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs"><AlertCircle size={13} />{error}</div>}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {media.map(item => (
          <div key={item.id} className="relative group rounded-xl overflow-hidden bg-white/5 border border-white/10 aspect-video">
            {item.type === 'image'
              ? <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex flex-col items-center justify-center gap-2"><Film size={28} className="text-slate-500" /><p className="text-xs text-slate-500 truncate px-2">{item.name}</p></div>
            }
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white font-medium truncate">{item.name}</p>
                <p className="text-xs text-slate-400">{formatBytes(item.size)}</p>
              </div>
            </div>
            <button onClick={() => removeMedia(item)}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-red-500/80 text-white transition-colors opacity-0 group-hover:opacity-100">
              <X size={12} />
            </button>
            <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60 text-xs text-slate-300">
              {item.type === 'image' ? <ImageIcon size={10} /> : <Film size={10} />} {item.type}
            </div>
          </div>
        ))}
        {uploading.map(name => (
          <div key={name} className="rounded-xl bg-white/5 border border-dashed border-white/10 aspect-video flex flex-col items-center justify-center gap-2">
            <Loader2 size={22} className="text-indigo-400 animate-spin" />
            <p className="text-xs text-slate-500 truncate px-2">{name}</p>
          </div>
        ))}
        {media.length < maxFiles && uploading.length === 0 && (
          <button onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border-2 border-dashed border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04] aspect-video flex flex-col items-center justify-center gap-2 transition-all text-slate-500 hover:text-slate-400">
            <Upload size={20} /><span className="text-xs">Add more</span>
          </button>
        )}
      </div>
      <input ref={fileInputRef} type="file" multiple accept={ACCEPTED_TYPES.join(',')}
        className="hidden" onChange={e => e.target.files && handleFiles(e.target.files)} />
      <p className="text-xs text-slate-600">{media.length}/{maxFiles} files · Hover a file and click × to remove</p>
      {error && <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs"><AlertCircle size={13} />{error}</div>}
      <div onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed text-xs transition-all cursor-pointer
          ${dragOver ? 'border-indigo-400 bg-indigo-500/10 text-indigo-400' : 'border-white/10 text-slate-600 hover:border-white/20 hover:text-slate-500'}`}>
        <Upload size={12} /> Drop more files or click to browse
      </div>
    </div>
  )
}