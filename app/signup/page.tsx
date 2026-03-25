"use client";

import type { JSX } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SocialLogo } from "@/components/social-logo";
import { supabase } from "@/lib/supabase";

export default function SignupPage(): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, agency_name: agencyName },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0a2e] text-white">
      <div className="absolute -left-24 top-20 h-64 w-64 rounded-full bg-violet-500/25 blur-3xl" />
      <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center p-6">
        <div className="grid w-full max-w-5xl gap-10 rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl shadow-black/50 backdrop-blur xl:grid-cols-2 xl:p-12">
          <section className="flex flex-col justify-center">
            <SocialLogo />
            <h1 className="mt-8 text-5xl font-semibold leading-tight tracking-tight">Social Universe</h1>
            <p className="mt-4 max-w-md text-base text-violet-100/80">
              Your premium command center for managing clients, campaigns, and platforms.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-7">
            <h2 className="text-2xl font-semibold">Create account</h2>
            <p className="mt-1 text-sm text-violet-100/75">Start managing your agency today.</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm text-violet-100/85">Full Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#130d3b] px-4 py-3 text-sm outline-none ring-violet-400 transition focus:ring"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-violet-100/85">Agency Name</label>
                <input
                  type="text"
                  placeholder="Your agency"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#130d3b] px-4 py-3 text-sm outline-none ring-violet-400 transition focus:ring"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-violet-100/85">Email</label>
                <input
                  type="email"
                  placeholder="you@agency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#130d3b] px-4 py-3 text-sm outline-none ring-violet-400 transition focus:ring"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-violet-100/85">Password</label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#130d3b] px-4 py-3 text-sm outline-none ring-violet-400 transition focus:ring"
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                type="button"
                onClick={handleSignup}
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-[#7F77DD] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#938ce8] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>

              <p className="text-center text-sm text-violet-100/60">
                Already have an account?{" "}
                <a href="/login" className="text-violet-400 hover:underline">
                  Login
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}