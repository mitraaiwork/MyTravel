"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { authApi } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } catch {
      // Show a generic message to avoid leaking whether an email exists
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-[#d8f3dc] flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-[#2d6a4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#1a2e1a] mb-2">Check your email</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          If <span className="font-medium text-[#1a2e1a]">{email}</span> is associated with an
          account, you&apos;ll receive a password reset link shortly.
        </p>
        <p className="text-xs text-gray-400 mb-6">
          Didn&apos;t receive it? Check your spam folder or{" "}
          <button
            onClick={() => { setSubmitted(false); setEmail(""); }}
            className="text-[#2d6a4f] hover:underline font-medium"
          >
            try again
          </button>
          .
        </p>
        <Link href="/login" className="btn-primary inline-flex">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#2d6a4f] transition-colors mb-5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to sign in
        </Link>
        <h1 className="text-2xl font-bold text-[#1a2e1a] mb-1">Reset your password</h1>
        <p className="text-gray-500 text-sm">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#1a2e1a] mb-1.5">
            Email address
          </label>
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

        <button type="submit" className="btn-primary w-full mt-2" disabled={isLoading}>
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sending…
            </>
          ) : (
            "Send reset link"
          )}
        </button>
      </form>
    </div>
  );
}
