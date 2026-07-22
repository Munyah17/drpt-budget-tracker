"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/lib/AppDataContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAppData();
  const [submitting, setSubmitting] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setFadingOut(true);
      setTimeout(() => {
        login();
        router.push("/dashboard");
      }, 350);
    }, 700);
  }

  return (
    <div
      className="login-wrap"
      style={{
        transition: "opacity .35s",
        opacity: fadingOut ? 0 : 1,
      }}
    >
      <div className="login-card fade-up">
        <div className="login-visual">
          <div className="login-visual-caption">
            <h3>
              Financial clarity,
              <br />
              every single day.
            </h3>
            <p>Track income, expenses and savings goals in one calm, beautiful place.</p>
          </div>
        </div>
        <div className="login-form">
          <div className="login-logo">
            Dr Patie <span style={{ color: "var(--rose-500)" }}>❤</span>
          </div>
          <h2>Welcome back! Sign in to continue to your account</h2>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" defaultValue="dr.patie@email.com" required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" defaultValue="••••••••" required />
            </div>
            <div className="field-row">
              <label className="remember">
                <input type="checkbox" defaultChecked style={{ accentColor: "var(--rose-500)" }} /> Remember me
              </label>
              <a href="#">Forgot password?</a>
            </div>
            <button type="submit" className="btn btn-primary" style={{ opacity: submitting ? 0.75 : 1 }}>
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>
          <div className="login-footer">
            Don&apos;t have an account? <a href="#">Sign up</a>
          </div>
        </div>
      </div>
    </div>
  );
}
