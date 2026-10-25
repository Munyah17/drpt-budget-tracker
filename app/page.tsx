"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/lib/AppDataContext";
import { UserRole } from "@/lib/types";

const rolePath = (role?: UserRole) =>
  role === "admin"
    ? "/admin"
    : role === "corporate"
      ? "/corporate/overview"
      : role === "employee"
        ? "/employee"
        : "/dashboard";

export default function LoginPage() {
  const router = useRouter();
  const { login, toast, isAuthenticated, authReady, user } = useAppData();
  const [submitting, setSubmitting] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");

  // Already signed in? Go straight to the right portal.
  useEffect(() => {
    if (authReady && isAuthenticated) router.replace(rolePath(user?.role));
  }, [authReady, isAuthenticated, user, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    if (isSignup) {
      // Guest signup - create account with restricted access
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
        return;
      }

      if (data.user) {
        // Create profile with isPaid = false
        const { error: profileError } = await (await import("@/lib/supabase")).supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email,
            name: name || email.split('@')[0],
            role: 'user',
            currency: 'USD',
            is_paid: false,
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        // Automatically sign in the user after successful signup
        const loginResult = await login(email, password);

        if (loginResult.success) {
          setFadingOut(true);
          setTimeout(() => {
            router.push(rolePath(loginResult.role));
          }, 350);
        } else {
          toast("Account created! Please sign in to continue.", "check-circle");
          setIsSignup(false);
          setSubmitting(false);
        }
      }
    } else {
      const result = await login(email, password);

      if (result.success) {
        setFadingOut(true);
        setTimeout(() => {
          router.push(rolePath(result.role));
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
            Dr PT <span style={{ color: "var(--rose-500)" }}>❤</span>
          </div>
          <h2>{isSignup ? "Create your account" : "Welcome back! Sign in to continue to your account"}</h2>
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
              {submitting ? (isSignup ? "Creating account…" : "Signing in…") : (isSignup ? "Create Account" : "Sign In")}
            </button>
          </form>
          <div className="login-footer">
            {isSignup ? "Already have an account? " : "Don't have an account? "}
            <a href="#" onClick={(e) => { e.preventDefault(); setIsSignup(!isSignup); }}>
              {isSignup ? "Sign in" : "Sign up"}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
