"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuth } from "@/context/auth";

const OAUTH_ERRORS: Record<string, string> = {
  oauth_failed: "Google sign-in failed. Please try again.",
  no_email:     "Google didn't share your email address. Please try a different sign-in method.",
  auth_failed:  "Authentication failed. Please try again.",
};

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);

  const oauthError = params.get("error");
  const [error, setError] = useState<string | null>(
    oauthError ? (OAUTH_ERRORS[oauthError] ?? "Sign-in failed. Please try again.") : null
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const { access_token } = await authApi.login(email, password);
      await login(access_token);
      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Invalid email or password. Please try again.";
      setError(typeof message === "string" ? message : "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <h1
        className="font-extrabold mb-1.5"
        style={{ fontSize: "26px", letterSpacing: "-0.5px", color: "var(--text-dark)" }}
      >
        Sign in to MyTravel
      </h1>
      <p className="text-sm mb-7" style={{ color: "var(--text-muted)" }}>
        Good to see you again.
      </p>

      {error && (
        <div
          className="rounded-lg p-3.5 mb-5 text-sm"
          style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}
        >
          {error}
        </div>
      )}

      {/* Google button — decorative */}
      <button
        type="button"
        disabled
        className="w-full flex items-center justify-center gap-3 font-medium text-sm py-2.5 rounded-lg mb-5 transition-all"
        style={{
          background: "white",
          border: "1.5px solid var(--border-mid)",
          color: "var(--text-dark)",
          cursor: "not-allowed",
          opacity: 0.7,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full ml-1"
          style={{ background: "#fef3c7", color: "#92400e", border: "1px solid rgba(212,160,23,0.3)" }}
        >
          Soon
        </span>
      </button>

      <div className="divider mb-5">or sign in with email</div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label" style={{ marginBottom: 0 }} htmlFor="password">Password</label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold no-underline hover:underline"
              style={{ color: "var(--forest)" }}
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className="input"
              style={{ paddingRight: "3rem" }}
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-sm font-medium transition-colors"
              style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
              tabIndex={-1}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary w-full justify-center mt-2"
          style={{ padding: "11px 20px", fontSize: "15px" }}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Signing in…
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold no-underline hover:underline" style={{ color: "var(--forest)" }}>
          Create one free
        </Link>
      </p>
    </div>
  );
}
