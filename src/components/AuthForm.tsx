"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isReg = mode === "register";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isReg ? { name, email, password } : { email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth-box">
        <h1>My Week</h1>
        <p className="sub">{isReg ? "Create your account" : "Log in to your planner"}</p>
        <form onSubmit={submit}>
          {isReg && (
            <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)}
              maxLength={40} required aria-label="Name" autoComplete="name" />
          )}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            required aria-label="Email" autoComplete="email" />
          <input type="password" placeholder={isReg ? "Password (min 8 characters)" : "Password"}
            value={password} onChange={(e) => setPassword(e.target.value)} required minLength={isReg ? 8 : 1}
            aria-label="Password" autoComplete={isReg ? "new-password" : "current-password"} />
          {error && <p className="err" role="alert">{error}</p>}
          <button className="btn" disabled={busy}>{busy ? "Please wait..." : isReg ? "Sign up" : "Log in"}</button>
        </form>
        <p className="alt">
          {isReg ? <>Already have an account? <Link href="/login">Log in</Link></>
                 : <>New here? <Link href="/register">Create an account</Link></>}
        </p>
      </div>
    </div>
  );
}
