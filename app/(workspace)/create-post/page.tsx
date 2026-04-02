"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MediaUploader from "@/components/MediaUploader";
import { createClient } from "@/lib/supabase/client";

const maxChars = 2200;
const supabase = createClient();

type MediaFile = {
  url: string;
  type: string;
};

type ClientOption = {
  id: string;
  name: string | null;
};

const PLATFORM_OPTIONS = [
  { id: "instagram", label: "Instagram" },
  { id: "facebook",  label: "Facebook"  },
  { id: "youtube",   label: "YouTube"   },
  { id: "linkedin",  label: "LinkedIn"  },
  { id: "twitter",   label: "Twitter/X" },
];

export default function CreatePostPage() {
  const router = useRouter();
  const [caption,     setCaption]     = useState("");
  const [mediaFiles,  setMediaFiles]  = useState<MediaFile[]>([]);
  const [platforms,   setPlatforms]   = useState<string[]>(["instagram", "facebook", "linkedin", "twitter"]);
  const [scheduleAt,  setScheduleAt]  = useState("");
  const [clients,     setClients]     = useState<ClientOption[]>([]);
  const [clientId,    setClientId]    = useState("");
  const [contentType, setContentType] = useState("Post");
  const [loading,     setLoading]     = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [toast,       setToast]       = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const left = useMemo(() => maxChars - caption.length, [caption]);

  useEffect(() => {
    let active = true;

    const loadClients = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active || !user) return;

      const { data } = await supabase
        .from("clients")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name");

      if (!active) return;

      const nextClients = (data as ClientOption[]) ?? [];
      setClients(nextClients);
      if (nextClients.length > 0) {
        setClientId(nextClients[0].id);
      }
    };

    loadClients();
  
  const handlePublishNow = async () => {
    if (!caption.trim()) { showToast("Please write a caption", "error"); return; }
    if (!clientId) { showToast("Please select a client", "error"); return; }
    if (platforms.length === 0) { showToast("Select at least one platform", "error"); return; }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    // First save the post
    const { data, error } = await supabase
      .from("posts")
      .insert([{
        user_id:      user?.id,
        client_id:    clientId,
        caption,
        status:       "draft",
        scheduled_at: null,
      }])
      .select();

    if (error || !data?.[0]?.id) {
      showToast("Failed to save post: " + (error?.message || "Unknown error"), "error");
      setLoading(false);
      return;
    }

    const postId = data[0].id;

    // Save media
    if (mediaFiles.length > 0) {
      await supabase.from("post_media").insert(
        mediaFiles.map((m, i) => ({
          post_id:      postId,
          storage_path: m.url,
          media_type:   m.type.includes('video') ? 'video' : 'image',
          mime_type:    m.type === 'video' ? 'video/mp4' : 'image/jpeg',
          sort_order:   i,
        }))
      );
    }

    // Now publish to Instagram
    const res = await fetch("/api/instagram/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        post_id: postId,
        image_url: mediaFiles.length > 0 ? mediaFiles[0].url : null
      }),
    });
    const result = await res.json();

    if (result.success) {
      showToast("Published to Instagram!", "success");
      setCaption(""); setMediaFiles([]); setScheduleAt("");
      setPlatforms(["instagram", "facebook", "linkedin", "twitter"]);
      setTimeout(() => router.push("/posts"), 700);
    } else {
      showToast(result.error || "Failed to publish", "error");
    }
    setLoading(false);
  };
  return () => {
      active = false;
    };
  }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const togglePlatform = (id: string) => {
    setPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (
    status: "pending_approval" | "scheduled" | "draft",
  ) => {
    if (!caption.trim()) { showToast("Please write a caption", "error"); return; }
    if (!clientId) { showToast("Please select a client", "error"); return; }
    if (platforms.length === 0) { showToast("Select at least one platform", "error"); return; }
    if (status === "scheduled" && !scheduleAt) {
      showToast("Select a schedule date & time", "error");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast("Please login again", "error");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("posts")
      .insert([{
        user_id:         user.id,
        client_id:       clientId,
        caption,
        status,
        scheduled_at:    scheduleAt || null,
      }])
      .select();
    if (error) {
      showToast("Failed to save post: " + error.message, "error");
      setLoading(false);
      return;
    }
    if (mediaFiles.length > 0 && data?.[0]?.id) {
      await supabase.from("post_media").insert(
        mediaFiles.map((m, i) => ({
          post_id:    data[0].id,
          media_url:  m.url,
          media_type: m.type,
          position:   i,
        }))
      );
    }

    const successMsg =
      status === "pending_approval"
        ? "Post submitted for approval."
        : status === "scheduled"
          ? "Post scheduled successfully."
          : "Draft saved successfully.";

    showToast(successMsg, "success");
    setLoading(false);
    setTimeout(() => router.push("/posts"), 700);
  };


  const handlePublishNow = async () => {
    if (!caption.trim()) { showToast("Please write a caption", "error"); return; }
    if (!clientId) { showToast("Please select a client", "error"); return; }
    if (platforms.length === 0) { showToast("Select at least one platform", "error"); return; }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    // First save the post
    const { data, error } = await supabase
      .from("posts")
      .insert([{
        user_id:      user?.id,
        client_id:    clientId,
        caption,
        status:       "draft",
        scheduled_at: null,
      }])
      .select();

    if (error || !data?.[0]?.id) {
      showToast("Failed to save post: " + (error?.message || "Unknown error"), "error");
      setLoading(false);
      return;
    }

    const postId = data[0].id;

    // Save media
    if (mediaFiles.length > 0) {
      await supabase.from("post_media").insert(
        mediaFiles.map((m, i) => ({
          post_id:      postId,
          storage_path: m.url,
          media_type:   m.type.includes('video') ? 'video' : 'image',
          mime_type:    m.type === 'video' ? 'video/mp4' : 'image/jpeg',
          sort_order:   i,
        }))
      );
    }

    // Now publish to Instagram
    const res = await fetch("/api/instagram/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        post_id: postId,
        image_url: mediaFiles.length > 0 ? mediaFiles[0].url : null
      }),
    });
    const result = await res.json();

    if (result.success) {
      showToast("Published to Instagram!", "success");
      setCaption(""); setMediaFiles([]); setScheduleAt("");
      setPlatforms(["instagram", "facebook", "linkedin", "twitter"]);
      setTimeout(() => router.push("/posts"), 700);
    } else {
      showToast(result.error || "Failed to publish", "error");
    }
    setLoading(false);
  };
  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl
          ${toast.type === "success" ? "bg-green-500/90 text-white" : "bg-red-500/90 text-white"}`}>
          {toast.msg}
        </div>
      )}
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Create Post</h1>
        <p className="mt-2 text-sm text-violet-100/75">Compose, schedule, and route content for client approval.</p>
      </header>
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <form className="grid gap-5" onSubmit={e => e.preventDefault()}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="text-violet-100/85">Client</span>
              <select value={clientId} onChange={e => setClientId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#130d3b] px-3 py-2.5 outline-none ring-violet-400 focus:ring">
                {clients.length === 0 && <option value="">No clients available</option>}
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name ?? "Unnamed Client"}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-violet-100/85">Content Type</span>
              <select value={contentType} onChange={e => setContentType(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#130d3b] px-3 py-2.5 outline-none ring-violet-400 focus:ring">
                <option>Post</option>
                <option>Reel</option>
                <option>Story</option>
                <option>Carousel</option>
              </select>
            </label>
          </div>
          <label className="space-y-2 text-sm">
            <span className="text-violet-100/85">Caption</span>
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={6}
              placeholder="Write a compelling caption for your audience..."
              className="w-full rounded-xl border border-white/10 bg-[#130d3b] px-3 py-3 outline-none ring-violet-400 focus:ring" />
            <p className={`text-right text-xs ${left < 100 ? "text-red-400" : "text-violet-100/65"}`}>
              {caption.length} / {maxChars} ({left} left)
            </p>
          </label>
          <div className="space-y-2 text-sm">
            <span className="text-violet-100/85">Media <span className="text-violet-100/40">(optional · max 10MB each)</span></span>
            <MediaUploader onMediaChange={setMediaFiles} onUploadingChange={setUploading} maxFiles={15} />
          </div>
          <fieldset>
            <legend className="mb-2 text-sm text-violet-100/85">Platforms</legend>
            <div className="flex flex-wrap gap-3 text-sm">
              {PLATFORM_OPTIONS.map(({ id, label }) => (
                <label key={id}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition
                    ${platforms.includes(id) ? "border-violet-400/50 bg-violet-500/10 text-white" : "border-white/10 bg-white/[0.02] text-violet-100/60"}`}>
                  <input type="checkbox" checked={platforms.includes(id)} onChange={() => togglePlatform(id)}
                    className="h-4 w-4 accent-violet-400" />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="space-y-2 text-sm md:max-w-sm">
            <span className="text-violet-100/85">Schedule Date & Time</span>
            <input type="datetime-local" value={scheduleAt} onChange={e => setScheduleAt(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#130d3b] px-3 py-2.5 outline-none ring-violet-400 focus:ring" />
          </label>
          <div className="flex flex-wrap gap-3 pt-2">

            <button type="button" disabled={loading} onClick={() => handleSubmit("scheduled")}
              className="rounded-xl bg-[#7F77DD] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#938ce8] disabled:opacity-50">
              {loading ? "Saving..." : "Schedule"}
            </button>
            <button type="button" disabled={loading || uploading} onClick={handlePublishNow}
              className="rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 shadow-lg">
              {uploading ? "Uploading media..." : loading ? "Publishing..." : "Publish Now to Instagram"}
            </button>
            <button type="button" disabled={loading} onClick={() => handleSubmit("draft")}
              className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-violet-100 transition hover:bg-white/10 disabled:opacity-50">
              {loading ? "Saving..." : "Save Draft"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
