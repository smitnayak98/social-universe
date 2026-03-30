"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log("DATA:", JSON.stringify(data));
    console.log("ERROR:", JSON.stringify(error));
    if (error) {
      setError(error.message);
    } else if (data.session) {
      window.location.href = "/dashboard";
    } else {
      setError("No session: " + JSON.stringify(data));
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f0a2e" }}>
      <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 40, width: 400 }}>
        <h2 style={{ color: "white", marginBottom: 24 }}>Welcome back</h2>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          style={{ width: "100%", padding: "12px", marginBottom: 12, borderRadius: 8, border: "1px solid #444", background: "#1a1a2e", color: "white", boxSizing: "border-box" }}
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          style={{ width: "100%", padding: "12px", marginBottom: 12, borderRadius: 8, border: "1px solid #444", background: "#1a1a2e", color: "white", boxSizing: "border-box" }}
        />
        {error && <p style={{ color: "red", marginBottom: 12 }}>{error}</p>}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: "100%", padding: "12px", borderRadius: 8, background: "#7c3aed", color: "white", border: "none", cursor: "pointer", fontSize: 16 }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <p style={{ color: "#888", textAlign: "center", marginTop: 16 }}>
          No account? <a href="/signup" style={{ color: "#a78bfa" }}>Sign up</a>
        </p>
      </div>
    </div>
  );
}