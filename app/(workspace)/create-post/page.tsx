"use client";

import { useMemo, useState } from "react";

const maxChars = 2200;

export default function CreatePostPage() {
  const [caption, setCaption] = useState("");
  const left = useMemo(() => maxChars - caption.length, [caption]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Create Post</h1>
        <p className="mt-2 text-sm text-violet-100/75">Compose, schedule, and route content for client approval.</p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <form className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="text-violet-100/85">Client</span>
              <select className="w-full rounded-xl border border-white/10 bg-[#130d3b] px-3 py-2.5 outline-none ring-violet-400 focus:ring">
                <option>Astra Retail</option>
                <option>Zenith Foods</option>
                <option>Nova Hotels</option>
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="text-violet-100/85">Content Type</span>
              <select className="w-full rounded-xl border border-white/10 bg-[#130d3b] px-3 py-2.5 outline-none ring-violet-400 focus:ring">
                <option>Post</option>
                <option>Reel</option>
                <option>Story</option>
                <option>Carousel</option>
              </select>
            </label>
          </div>

          <label className="space-y-2 text-sm">
            <span className="text-violet-100/85">Caption</span>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={6}
              placeholder="Write a compelling caption for your audience..."
              className="w-full rounded-xl border border-white/10 bg-[#130d3b] px-3 py-3 outline-none ring-violet-400 focus:ring"
            />
            <p className="text-right text-xs text-violet-100/65">{caption.length} / {maxChars} ({left} left)</p>
          </label>

          <label className="block cursor-pointer rounded-xl border border-dashed border-violet-300/30 bg-violet-500/5 p-6 text-center transition hover:bg-violet-500/10">
            <span className="block text-sm font-medium">Media Upload Zone</span>
            <span className="mt-1 block text-xs text-violet-100/65">Drag & drop media or click to browse files</span>
            <input type="file" className="hidden" multiple />
          </label>

          <fieldset>
            <legend className="mb-2 text-sm text-violet-100/85">Platforms</legend>
            <div className="flex flex-wrap gap-3 text-sm">
              {[
                ["instagram", "Instagram"],
                ["facebook", "Facebook"],
                ["youtube", "YouTube"],
                ["linkedin", "LinkedIn"],
                ["twitter", "Twitter/X"],
              ].map(([id, label]) => (
                <label key={id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                  <input type="checkbox" className="h-4 w-4 accent-violet-400" defaultChecked={id !== "youtube"} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="space-y-2 text-sm md:max-w-sm">
            <span className="text-violet-100/85">Schedule Date & Time</span>
            <input
              type="datetime-local"
              className="w-full rounded-xl border border-white/10 bg-[#130d3b] px-3 py-2.5 outline-none ring-violet-400 focus:ring"
            />
          </label>

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="button" className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-violet-100 transition hover:bg-white/10">
              Submit for Approval
            </button>
            <button type="button" className="rounded-xl bg-[#7F77DD] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#938ce8]">
              Schedule
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
