"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MediaUploader from "@/components/MediaUploader";
import { createClient } from "@/lib/supabase/client";
import { ImagePlus, X, Loader2 } from "lucide-react";

const maxChars = 2200;
const supabase = createClient();
const CLOUD_NAME = 'dnhndstzh';
const UPLOAD_PRESET = 'social_universe';

type MediaFile = { url: string; type: string; };
type ClientOption = { id: string; name: string | null; };

const PLATFORM_OPTIONS = [
  { id: "instagram", label: "Instagram" },
  { id: "facebook",  label: "Facebook"  },
  { id: "youtube",   label: "YouTube"   },
  { id: "linkedin",  label: "LinkedIn"  },
  { id: "twitter",   label: "Twitter/X" },
];

export default function CreatePostPage() {
  const router = useRouter();
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [caption,       setCaption]       = useState("");
  const [mediaFiles,    setMediaFiles]    = useState<MediaFile[]>([]);
  const [platforms,     setPlatforms]     = useState<string[]>(["instagram", "facebook"]);
  const [scheduleAt,    setScheduleAt]    = useState("");
  const [clients,       setClients]       = useState<ClientOption[]>([]);
  const [clientId,      setClientId]      = useState("");
  const [contentType,   setContentType]   = useState("Post");
  const [loading,       setLoading]       = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [thumbnailUrl,  setThumbnailUrl]  = useState("");
  const [thumbLoading,  setThumbLoading]  = useState(false);
  const [toast,         setToast]         = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const left = useMemo(() => maxChars - caption.length, [caption]);

  useEffect(() => {
    let active = true;
    const loadClients = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active || !user) return;
      const { data } = await supabase.from("clients").select("id, name").eq("user_id", user.id).order("name");
      if (!active) return;
      const nextClients = (data as ClientOption[]) ?? [];
      setClients(nextClients);
      if (nextClients.length > 0) setClientId(nextClients[0].id);
    };
    loadClients();
    return () => { active = false; };
  }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const togglePlatform = (id: string) => {
    setPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast("Thumbnail must be an image", "error"); return; }
    if (file.size > 10 * 1024 * 1024) { showToast("Thumbnail must be under 10MB", "error"); return; }
    setThumbLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_0/${CLOUD_NAME}/image/upload`, {
        method: "POST", body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        setThumbnailUrl(data.secure_url);
        showToast("Thumbnail uploaded!");
      } else {
        showToast("Thumbnail upload failed", "error");
      }
    } catch {
      showToast("Thumbnail upload failed", "error");
    }
    setThumbLoading(false);
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  };

  const savePost = async (status: string, scheduledAt: string | null) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { showToast("Please login again", "error"); return null; }
    const { data, error } = await supabase.from("posts").insert([{
      user_id: user.id, client_id: clientId, caption, status,
      scheduled_at: scheduledAt || null, platforms,
      thumbnail_url: thumbnailUrl || null,
    }]).select();
    if (error || !data?.[0]?.id) {
      showToast("Failed to save post: " + (error?.message || "Unknown error"), "error");
      return null;
    }
    const postId = data[0].id;
    if (mediaFiles.length > 0) {
      await supabase.from("post_media").insert(
        mediaFiles.map((m, i) => ({
          post_id: postId, storage_path: m.url,
          media_type: m.type.includes("video") ? "video" : "image",
          mime_type: m.type === "video" ? "video/mp4" : "image/jpeg",
          sort_order: i,
        }))
      );
    }
    return postId;
  };

  const handleDraft = async () => {
    if (!caption.trim()) { showToast("Please write a caption", "error"); return; }
    if (!clientId) { showToast("Please select a client", "error"); return; }
    setLoading(true);
    const postId = await savePost("draft", null);
    if (postId) { showToast("Draft saved successfully.", "success"); setTimeout(() => router.push("/posts"), 700); }
    setLoading(false);
  };

  const handleSchedule = async () => {
    if (!caption.trim()) { showToast("Please write a caption", "error"); return; }
    if (!clientId) { showToast("Please select a client", "error"); return; }
    if (platforms.length === 0) { showToast("Select at least one platform", "error"); return; }
    if (!scheduleAt) { showToast("Select a schedule date & time", "error"); return; }
    setLoading(true);
    const postId = await savePost("scheduled", scheduleAt);
    if (postId) { showToast("Post scheduled successfully.", "success"); setTimeout(() => router.push("/posts"), 700); }
    setLoading(false);
  };

  const handlePublishNow = async () => {
    if (!caption.trim()) { showToast("Please write a caption", "error"); return; }
    if (!clientId) { showToast("Please select a client", "error"); return; }
    if (platforms.length === 0) { showToast("Select at least one platform", "error"); return; }
    setLoading(true);
    const postId = await savePost("draft", null);
    if (!postId) { setLoading(false); return; }
    const results: string[] = [];
    const errors: string[] = [];
    for (const platform of platforms) {
      if (platform === "instagram") {
        try {
          const res = await fetch("/api/instagram/publish", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ post_id: postId }),
          });
          const result = await res.json();
          if (result.success) results.push("Instagram");
          else errors.push(`Instagram: ${result.error}`);
        } catch { errors.push("Instagram: network error"); }
      }
      if (platform === "facebook") {
        try {
          const res = await fetch("/api/facebook/publish", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ post_id: postId }),
          });
          const result = await res.json();
          if (result.success) results.push("Facebook");
          else errors.push(`Facebook: ${result.error}`);
        } catch { errors.push("Facebook: network error"); }
      }
    }
    if (results.length > 0) {
      showToast(`Published to ${results.join(" & ")}!`, "success");
      setTimeout(() => router.push("/posts"), 700);
    } else if (errors.length > 0) {
      showToast(errors[0], "error");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl
          ${toast.type === "success" ? "bg-green-500/90 text-[#1a1a1a]" : "bg-red-500/90 text-[#1a1a1a]"}`}>
          {toast.msg}
        </div>
      )}
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Create Post</h1>
        <p className="mt-2 text-sm text-[#555]">Compose, schedule, and route content for client approval.</p>
      </header>
      <section className="rounded-2xl border border-[#e0e0e0] bg-white p-6">
        <form className="grid gap-5" onSubmit={e => e.preventDefault()}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="text-[#333]">Client</span>
              <select value={clientId} onChange={e => setClientId(e.target.value)}
                className="w-full rounded-xl border border-[#e0e0e0] bg-[#f0f0f0] px-3 py-2.5 outline-none ring-[#f5c800] focus:ring">
                {clients.length === 0 && <option value="">No clients available</option>}
                {clients.map((c) => (<option key={c.id} value={c.id}>{c.name ?? "Unnamed Client"}</option>))}
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-[#333]">Content Type</span>
              <select value={contentType} onChange={e => setContentType(e.target.value)}
                className="w-full rounded-xl border border-[#e0e0e0] bg-[#f0f0f0] px-3 py-2.5 outline-none ring-[#f5c800] focus:ring">
                <option>Post</option><option>Reel</option><option>Story</option><option>Carousel</option>
              </select>
            </label>
          </div>

          <label className="space-y-2 text-sm">
            <span className="text-[#333]">Caption</span>
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={6}
              placeholder="Write a compelling caption for your audience..."
              className="w-full rounded-xl border border-[#e0e0e0] bg-[#f0f0f0] px-3 py-3 outline-none ring-[#f5c800] focus:ring" />
            <p className={`text-right text-xs ${left < 100 ? "text-red-400" : "text-[#666]"}`}>
              {caption.length} / {maxChars} ({left} left)
            </p>
          </label>

          <div className="space-y-2 text-sm">
            <span className="text-[#333]">Media <span className="text-[#999]">(optional · Images 50MB · Videos 700MB)</span></span>
            <MediaUploader onMediaChange={setMediaFiles} onUploadingChange={setUploading} maxFiles={15} />
          </div>

          {/* Thumbnail */}
          <div className="space-y-2 text-sm">
            <span className="text-[#333]">Thumbnail <span className="text-[#999]">(optional · for Reels & Videos · max 10MB)</span></span>
            <div className="flex items-center gap-3">
              {thumbnailUrl ? (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-[#e0e0e0] flex-shrink-0">
                  <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setThumbnailUrl("")}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80">
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => thumbnailInputRef.current?.click()}
                  disabled={thumbLoading}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-[#e0e0e0] hover:border-[#f5c800] bg-[#fafafa] hover:bg-[#fffbeb] flex flex-col items-center justify-center gap-1.5 transition-all text-[#999] hover:text-[#b8930a] disabled:opacity-50">
                  {thumbLoading
                    ? <Loader2 size={20} className="animate-spin" />
                    : <><ImagePlus size={20} /><span className="text-xs">Add Thumbnail</span></>
                  }
                </button>
              )}
              {thumbnailUrl && (
                <div className="text-xs text-[#999]">
                  <p className="text-green-600 font-medium">✓ Thumbnail uploaded</p>
                  <button type="button" onClick={() => thumbnailInputRef.current?.click()}
                    className="text-[#b8930a] hover:underline mt-0.5">Change thumbnail</button>
                </div>
              )}
            </div>
            <input ref={thumbnailInputRef} type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
          </div>

          <fieldset>
            <legend className="mb-2 text-sm text-[#333]">Platforms</legend>
            <div className="flex flex-wrap gap-3 text-sm">
              {PLATFORM_OPTIONS.map(({ id, label }) => (
                <label key={id}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition
                    ${platforms.includes(id) ? "border-[#f5c800] bg-[#f5c800]/10 text-[#1a1a1a]" : "border-[#e0e0e0] bg-[#fafafa] text-[#999]"}`}>
                  <input type="checkbox" checked={platforms.includes(id)} onChange={() => togglePlatform(id)}
                    className="h-4 w-4 accent-[#f5c800]" />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="space-y-2 text-sm md:max-w-sm">
            <span className="text-[#333]">Schedule Date & Time <span className="text-[#999]">(required for Schedule)</span></span>
            <input type="datetime-local" value={scheduleAt} onChange={e => setScheduleAt(e.target.value)}
              className="w-full rounded-xl border border-[#e0e0e0] bg-[#f0f0f0] px-3 py-2.5 outline-none ring-[#f5c800] focus:ring" />
          </label>

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="button" disabled={loading} onClick={handleSchedule}
              className="rounded-xl bg-[#f5c800] px-4 py-2.5 text-sm font-semibold text-[#1a1a1a] transition hover:bg-[#e0b800] disabled:opacity-50">
              {loading ? "Saving..." : "Schedule"}
            </button>
            <button type="button" disabled={loading || uploading} onClick={handlePublishNow}
              className="rounded-xl bg-[#f5c800] px-4 py-2.5 text-sm font-semibold text-[#1a1a1a] transition hover:bg-[#e0b800] disabled:opacity-50">
              {uploading ? "Uploading..." : loading ? "Publishing..." : "Publish Now"}
            </button>
            <button type="button" disabled={loading} onClick={handleDraft}
              className="rounded-xl border border-[#ccc] px-4 py-2.5 text-sm font-semibold text-[#555] transition hover:bg-[#f0f0f0] disabled:opacity-50">
              {loading ? "Saving..." : "Save Draft"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}