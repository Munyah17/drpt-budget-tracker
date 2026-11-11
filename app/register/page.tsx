"use client";

import { Suspense } from "react";
import { LoginForm } from "@/app/login/page";

/**
 * Registration — enter your details here first; checkout comes after.
 * Reuses the login/signup form pinned to signup mode.
 */
export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm forceSignup />
    </Suspense>
  );
}
