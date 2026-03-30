"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Save, Calendar, Hash } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PLATFORMS = ["instagram", "twitter", "facebook", "linkedin", "youtube"];
const STATUSES = ["draft", "scheduled", "published", "failed"];

const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280,
  instagram: 2200,
  facebook: 63206,
  linkedin: 3000,
  youtube: 5000,
};

interface Post {
  id: string;
  content: string;
  platform: string;
  status: string;
  scheduled_at: string | null;
  client_id: string | null;
}

interface Client {
  id: string;
  name: string;
}

interface EditPostModalProps {
  post: Post | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditPostModal({ post, onClose, onSaved }: EditPostModalProps) {
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [status, setStatus] = useState("draft");
  const [scheduledAt, setScheduledAt] = useState("");
  const [clientId, setClientId] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("clients").select("id, name").order("name").then(({ data }) => {
      if (data) setClients(data);
    });
  }, []);

  useEffect(() => {
    if (post) {
      setContent(post.content ?? "");
      setPlatform(post.platform ?? "instagram");
      setStatus(post.status ?? "draft");
      setClientId(post.client_id ?? "");
      if (post.scheduled_at) {
        // Convert to local datetime-local format
        const d = new Date(post.scheduled_at);
        const pad = (n: number) => String(n).padStart(2, "0");
        setScheduledAt(
          `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
        );
      } else {
        setScheduledAt("");
      }
    }
  }, [post]);

  if (!post) return null;

  const limit = PLATFORM_LIMITS[platform] ?? 2200;
  const remaining = limit - content.length;
  const isOverLimit = remaining < 0;

  async function handleSave() {
    if (!content.trim()) { setError("Content cannot be empty."); return; }
    if (isOverLimit) { setError(`Content exceeds the ${platform} limit.`); return; }
    setSaving(true);
    setError("");

    const { error: dbError } = await supabase
      .from("posts")
      .update({
        content,
        platform,
        status,
        client_id: clientId || null,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", post.id);

    setSaving(false);
    if (dbError) { setError(dbError.message); return; }
    onSaved();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--card, #1a1a2e)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Save size={16} className="text-indigo-400" />
            </div>
            <h2 className="text-base font-semibold text-white">Edit Post</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Client + Platform row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5 block">Client</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all"
              >
                <option value="">No client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5 block">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all capitalize"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5 block">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Write your post content..."
              className="w-full rounded-lg px-3 py-2.5 text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none placeholder:text-white/20"
            />
            {/* Character counter */}
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex items-center gap-1.5">
                <Hash size={11} className="text-white/30" />
                <span className="text-xs text-white/30">{platform} limit: {limit.toLocaleString()} chars</span>
              </div>
              <span className={`text-xs font-mono font-semibold tabular-nums ${
                isOverLimit ? "text-red-400" : remaining < limit * 0.1 ? "text-amber-400" : "text-white/40"
              }`}>
                {remaining.toLocaleString()}
              </span>
            </div>
            {/* Progress bar */}
            <div className="mt-1 h-0.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isOverLimit ? "bg-red-500" : remaining < limit * 0.1 ? "bg-amber-400" : "bg-indigo-500"
                }`}
                style={{ width: `${Math.min((content.length / limit) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Status + Scheduled At row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5 block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                <Calendar size={11} />
                Schedule Date
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || isOverLimit}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all flex items-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
