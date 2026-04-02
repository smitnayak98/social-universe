'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

interface PackageUsage {
  client_id: string
  client_name: string
  package_reels: number
  package_posts: number
  package_stories: number
  used_reels: number
  used_posts: number
  used_stories: number
}

function ProgressBar({ used, total, label }: { used: number; total: number; label: string }) {
  const pct = total === 0 ? 0 : Math.min((used / total) * 100, 100)
  const over = used > total
  const color = over
    ? 'bg-red-500'
    : pct >= 80
    ? 'bg-yellow-500'
    : 'bg-green-500'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className={over ? 'text-red-400 font-semibold' : 'text-slate-400'}>
          {used} / {total}
          {over && ' ⚠️ Over limit!'}
        </span>
      </div    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function PackageTracker({ clientId }: { clientId?: string }) {
  const [data, setData] = useState<PackageUsage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)

      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      let query = supabase
        .from('clients')
        .select('id, name, package_reels, package_posts, package_stories')

      if (clientId) query = query.eq('id', clientId)

      const { data: clients } = await query

      if (!clients) { setLoading(false); return }

      const results: PackageUsage[] = []

      for (const client of clients) {
        const { data: posts } = await supabase
          .from('posts')
          .select('content_type, status')
          .eq('client_id', client.id)
          .gte('created_at', startOfMonth.toISOString())
          .neq('status', 'draft')

        const used_reels   = posts?.filter(p => p.content_type?.toLowerCase() === 'reel').length ?? 0
        const used_stories = posts?.filter(p => p.content_type?.toLowerCase() === 'story').length ?? 0
        const used_posts   = posts?.filter(p =>
          !['reel','story'].includes(p.content_type?.toLowerCase() ?? '')
        ).length ?? 0

        results.push({
          client_id:      client.id,
          client_name:    client.name,
          package_reels:   client.package_reels ?? 0,
          package_posts:   client.package_posts ?? 0,
          package_stories: client.package_stories ?? 0,
          used_reels,
          used_posts,
          used_stories,
        })
      }

      setData(results)
      setLoading(false)
    }

    fetch()
  }, [clientId])

  if (loading) return (
    <div className="space-y-3">
      {[1,2].map(i => (
        <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-4 animate-pulse h-28" />
      ))}
    </div>
  )

  if (data.length === 0) return (
    <div className="text-center py-8 text-slate-500 text-sm">
      No clients found. Add clients and set their package limits.
    </div>
  )

  return (
    <div className="space-y-3">
      {data.map(c => {
        const anyOver = c.used_reels > c.package_reels ||
                        c.used_posts > c.package_posts ||
                        c.used_stories > c.package_stories
        return (
          <div key={c.client_id}
            className={`rounded-2xl border p-4 transition-all
              ${anyOver
                ? 'border-red-500/30 bg-red-500/5'
                : 'border-white/10 bg-white/[0.03]'}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">{c.client_name}</h3>
              {anyOver
                ? <span className="text-xs text-red-400 font-medium">Over limit</span>
                : <span className="text-xs text-green-400">On track</span>}
            </div>
            <div className="space-y-2.5">
              <ProgressBar used={c.used_posts}   total={c.package_posts}   label="Posts" />
              <ProgressBar used={c.used_reels}   total={c.package_reels}   label="Reels" />
              <ProgressBar used={c.used_stories} total={c.package_stories} label="Stories" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
