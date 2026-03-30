"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth";

const OAUTH_ERRORS: Record<string, string> = {
  oauth_failed: "Google sign-in failed. Please try again.",
  no_email:     "Google didn't share your email address.",
  auth_failed:  "Authentication failed. Please try again.",
};

function CallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const token = params.get("token");
    const error = params.get("error");

    if (error) {
      router.replace(`/login?error=${error}`);
      return;
    }

    if (!token) {
      router.replace("/login");
      return;
    }

    login(token)
      .then(() => router.replace("/dashboard"))
      .catch(() => router.replace("/login?error=auth_failed"));
  }, [params, login, router]);

  return null;
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8faf5]">
      <div className="flex items-center gap-2 text-[#2d6a4f] text-sm">
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Signing you in…
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CallbackHandler />
      <Spinner />
    </Suspense>
  );
}
