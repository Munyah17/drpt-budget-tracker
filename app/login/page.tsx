"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppData } from "@/lib/AppDataContext";
import { notifyEvent } from "@/lib/notifyClient";
import { trackEvent } from "@/lib/analytics";
import { minPriceLabel } from "@/lib/pricing";
import { UserRole } from "@/lib/types";

const rolePath = (role?: UserRole) =>
  role === "admin"
    ? "/admin"
    : role === "corporate"
      ? "/corporate/overview"
      : role === "employee"
        ? "/employee"
        : "/dashboard";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, toast, isAuthenticated, authReady, user } = useAppData();
  const [submitting, setSubmitting] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(searchParams.get("signup") === "1");
  const [name, setName] = useState("");

  // Where the user was headed before the auth guard sent them here
  const nextParam = searchParams.get("next");
  const nextPath = nextParam && nextParam.startsWith("/") ? nextParam : null;

  // Already signed in? Go back where they wanted, else to their portal.
  useEffect(() => {
    if (authReady && isAuthenticated) router.replace(nextPath ?? rolePath(user?.role));
  }, [authReady, isAuthenticated, user, router, nextPath]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    if (isSignup) {
      // Create account — registration completes only after the $1 payment
      const { data, error } = await (await import("@/lib/supabase")).supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : 'https://drpt-budget-tracker.vercel.app',
          data: {
            name: name || email.split('@')[0],
          }
        },
      });

      if (error) {
        setSubmitting(false);
        toast(error.message, "x");
        notifyEvent("signup_failed", { email, name, detail: error.message });
        trackEvent("signup_failed", { detail: error.message }, { email });
        return;
      }

      if (data.user) {
        // Confirm email + create the profile server-side (service role) —
        // works even when Supabase email confirmation is on, so the account
        // is immediately sign-in-able and the profile row exists.
        const displayName = name || email.split('@')[0];
        const confirmRes = await fetch("/api/auth/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: data.user.id, email, name: displayName }),
        }).catch(() => null);

        if (confirmRes?.ok) {
          notifyEvent("signup_success", { email, name });
          trackEvent("signup", {}, { email });
        } else {
          notifyEvent("signup_failed", { email, name, detail: "account confirm failed" });
          trackEvent("signup_failed", { detail: "account confirm failed" }, { email });
        }

        // Carry identity to the payment page even without a live session
        sessionStorage.setItem(
          "drpt-pending-pay",
          JSON.stringify({ userId: data.user.id, email, name: displayName })
        );

        // Best-effort sign-in in the background — either way, the next stop
        // is payment. No options, no freebies.
        void login(email, password);

        setFadingOut(true);
        toast(`Account created — one last step: pay from ${minPriceLabel()} to activate.`, "check-circle");
        setTimeout(() => {
          router.push("/payment");
        }, 350);
      }
    } else {
      const result = await login(email, password);

      if (result.success) {
        trackEvent("login", { role: result.role }, { email });
        setFadingOut(true);
        setTimeout(() => {
          router.push(nextPath ?? rolePath(result.role));
        }, 350);
      } else {
        setSubmitting(false);
        toast(result.error || "Invalid email or password", "x");
      }
    }
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
            WellSpend <span style={{ color: "var(--rose-500)" }}>❤</span>
          </div>
          <h2>{isSignup ? "Create your account — $1 unlocks everything, forever" : "Welcome back! Sign in to continue to your account"}</h2>
          <form onSubmit={handleSubmit}>
            {isSignup && (
              <div className="field">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>
            )}
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            {!isSignup && (
              <div className="field-row">
                <label className="remember">
                  <input type="checkbox" defaultChecked style={{ accentColor: "var(--rose-500)" }} /> Remember me
                </label>
                <a href="#">Forgot password?</a>
              </div>
            )}
            <button type="submit" className="btn btn-primary" style={{ opacity: submitting ? 0.75 : 1 }} disabled={submitting}>
              {submitting ? (isSignup ? "Creating account…" : "Signing in…") : (isSignup ? "Create Account & Pay $1" : "Sign In")}
            </button>
          </form>

          <div className="login-footer">
            {isSignup ? "Already have an account? " : "Don't have an account? "}
            <a href="#" onClick={(e) => { e.preventDefault(); setIsSignup(!isSignup); }}>
              {isSignup ? "Sign in" : "Sign up — $1 once"}
            </a>
            <div style={{ marginTop: 8 }}>
              <Link href="/" style={{ color: "var(--ink-500)", fontWeight: 600, fontSize: 12 }}>
                ← Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
