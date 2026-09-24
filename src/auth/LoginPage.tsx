import { useState, type FormEvent } from "react";
import { Guitar, ArrowRight } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { useStudio } from "../app/StoreProvider";

export function LoginPage() {
  const { status, login } = useStudio();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  if (status === "ready") return <Navigate to="/home" replace />;
  if (status === "loading") return <div className="auth-loading">Loading Guitarist…</div>;
  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true); setError("");
    const result = await login(username, password);
    setPending(false);
    if (result.ok) navigate(result.value.role === "teacher" ? "/teacher" : "/student", { replace: true });
    else setError(result.error);
  }
  return <main className="login-page">
    <div className="login-art" aria-hidden="true">
      <img src="/images/acoustic-guitar-hero.webp" alt="" />
      <span>Find your sound.</span>
    </div>
    <section className="login-panel" aria-labelledby="login-heading">
      <div className="login-brand"><span className="brand-symbol"><Guitar size={25} /></span> Guitarist<span className="brand-dot">.</span></div>
      <div className="login-intro">
        <span className="eyebrow">YOUR MUSIC STUDIO</span>
        <h1 id="login-heading">Sign in to Guitarist</h1>
        <p>Pick up where your music left off.</p>
      </div>
      <form className="login-form" onSubmit={submit}>
        <label htmlFor="login-username">Username</label>
        <input id="login-username" name="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required />
        <label htmlFor="login-password">Password</label>
        <input id="login-password" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        {error && <p role="alert" className="form-message">{error}</p>}
        <button className="button" type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"} <ArrowRight size={17} /></button>
      </form>
      <p className="login-help">Need a student account or a password reset? Ask your teacher.</p>
    </section>
  </main>;
}
