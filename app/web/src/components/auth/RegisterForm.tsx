"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuth } from "@/context/auth";

const GOOGLE_AUTH_URL = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/auth/google`;

function PasswordStrength({ password }: { password: string }) {
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const strength = [hasLength, hasUpper, hasNumber].filter(Boolean).length;
  const colors = ["bg-red-400", "bg-amber-400", "bg-[#52b788]"];
  const labels = ["Weak", "Fair", "Strong"];

  if (!password) return null;

  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < strength ? colors[strength - 1] : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-500">
        {strength > 0 ? labels[strength - 1] : "Too short"}
        {!hasLength && " — min. 8 characters"}
      </p>
    </div>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

export default function RegisterForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = "Full name is required.";
    if (!email.trim()) errors.email = "Email is required.";
    if (password.length < 8)
      errors.password = "Password must be at least 8 characters.";
    if (password !== confirmPassword)
      errors.confirmPassword = "Passwords do not match.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setIsLoading(true);
    try {
      const { access_token } = await authApi.register(email, password, fullName);
      await login(access_token);
      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Registration failed. Please try again.";
      setError(typeof message === "string" ? message : "Registration failed.");
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
        Create your account
      </h1>
      <p className="text-sm mb-7" style={{ color: "var(--text-muted)" }}>
        Start planning amazing trips for free.
      </p>

      {error && (
        <div
          className="rounded-lg p-3.5 mb-5 text-sm"
          style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full name */}
        <div>
          <label htmlFor="fullName" className="label">
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            required
            className={`input ${fieldErrors.fullName ? "border-red-400" : ""}`}
            placeholder="Alex Chen"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isLoading}
          />
          {fieldErrors.fullName && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.fullName}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="label">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className={`input ${fieldErrors.email ? "border-red-400" : ""}`}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          {fieldErrors.email && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              className={`input pr-10 ${fieldErrors.password ? "border-red-400" : ""}`}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
          <PasswordStrength password={password} />
          {fieldErrors.password && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="confirmPassword" className="label">
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              required
              className={`input pr-10 ${fieldErrors.confirmPassword ? "border-red-400" : ""}`}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              <EyeIcon open={showConfirm} />
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
          )}
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
              Creating account…
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <div className="divider my-5">or</div>

      <div className="relative">
        <div className="flex items-center justify-center gap-3 w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-400 font-medium text-sm cursor-not-allowed select-none opacity-60">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </div>
        <span className="absolute -top-2 -right-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
          Coming soon
        </span>
      </div>

      <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="text-[#2d6a4f] hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-[#2d6a4f] hover:underline">
          Privacy Policy
        </Link>
        .
      </p>

      <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
        Already have an account?{" "}
        <Link href="/login" className="font-semibold no-underline hover:underline" style={{ color: "var(--forest)" }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
