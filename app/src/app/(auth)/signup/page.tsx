"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/theme-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Instagram, Loader2, Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const logoSrc = theme === "dark" ? "/6.png" : "/1.png";
  const [form, setForm] = useState({ fullName: "", email: "", password: "", foundUsFrom: "" });
  const [otherSource, setOtherSource] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const finalSource = form.foundUsFrom === "other" ? otherSource : form.foundUsFrom;
      const payload = {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        ...(finalSource ? { foundUsFrom: finalSource } : {})
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json?.type === "SUCCESS" || json?.data) {
        setSuccess(true);
        setTimeout(() => router.replace("/login"), 1500);
      } else {
        setError(json?.message || "Registration failed. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-5">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-full scale-150 group-hover:opacity-100 transition-opacity" />
            <Image 
              src={logoSrc}
              alt="TheHookLab Logo" 
              width={260} 
              height={260} 
              className="relative h-40 w-auto object-contain drop-shadow-[0_0_15px_rgba(251,146,60,0.1)]"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Create Your Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Start building your AI Base Creator Lab intelligence</p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card backdrop-blur-xl p-8 shadow-2xl">
          {success ? (
            <div className="text-center py-6">
              <div className="h-12 w-12 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-success text-xl">✓</span>
              </div>
              <p className="text-foreground font-semibold">Account created!</p>
              <p className="text-sm text-muted-foreground mt-1">Redirecting to sign in...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  placeholder="Name"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="h-12 rounded-xl border-border/50 bg-muted/30 focus:ring-1 focus:ring-primary/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-12 rounded-xl border-border/50 bg-muted/30 focus:ring-1 focus:ring-primary/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="h-12 rounded-xl border-border/50 bg-muted/30 pr-11 focus:ring-1 focus:ring-primary/50"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-border/40">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
                  How did you discover our secret lab?
                </Label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { id: 'instagram', label: 'Instagram' },
                    { id: 'youtube', label: 'YouTube' },
                    { id: 'internet', label: 'Web Search' },
                    { id: 'friend', label: 'A Friend' },
                    { id: 'other', label: 'Other' }
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setForm({ ...form, foundUsFrom: option.id })}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-300 border ${
                        form.foundUsFrom === option.id
                          ? 'bg-primary/10 border-primary/50 text-primary shadow-[0_0_15px_rgba(251,146,60,0.15)] scale-[1.02]'
                          : 'bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                      } ${option.id === 'other' ? 'col-span-2 sm:col-span-1' : ''}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {form.foundUsFrom === "other" && (
                  <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                    <Input
                      placeholder="Tell us the full story..."
                      value={otherSource}
                      onChange={(e) => setOtherSource(e.target.value)}
                      className="h-12 rounded-xl border-primary/30 bg-primary/5 focus:ring-1 focus:ring-primary/50"
                      required
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !form.fullName || !form.email || !form.password || !form.foundUsFrom || (form.foundUsFrom === 'other' && !otherSource)}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-destructive hover:from-primary hover:to-destructive border-0 font-semibold text-sm shadow-lg shadow-primary/20"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating account...</>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          )}

          {!success && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:text-primary font-medium transition-colors">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
