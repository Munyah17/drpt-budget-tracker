"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAppData } from "@/lib/AppDataContext";
import { roleHome } from "@/lib/adminClient";

interface AuthLinkProps {
  /** "login" for sign-in links, "signup" for sign-up links */
  mode: "login" | "signup";
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Sign in / Sign up links: guests go to the auth page, signed-in users go
 * straight to their portal — never to checkout.
 */
export default function AuthLink({ mode, children, className, style }: AuthLinkProps) {
  const { isAuthenticated, user } = useAppData();
  const href = isAuthenticated
    ? roleHome(user?.role ?? "user")
    : mode === "signup"
      ? "/register"
      : "/login";
  return (
    <Link href={href} className={className} style={style}>
      {children}
    </Link>
  );
}
