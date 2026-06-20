"use client";

import { useState, useEffect } from "react";
import { BASE_URL } from "@/lib/config";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SavedCollections } from "@/components/profile/saved-collections";
import { MyCreatorProfile } from "@/components/profile/my-creator-profile";
import {
  Mail,
  Instagram,
  Linkedin,
  Pencil,
  Check,
  X,
  Loader2,
  Users,
  Layout,
  Globe,
  Facebook,
  Zap,
  UserCircle,
  TrendingUp,
  Files
} from "lucide-react";
import { toast } from "sonner";

interface ProfileStats {
  instagram: {
    creators: number;
    reelsAnalyzed: number;
    standardAnalyzed: number;
  };
  linkedin: {
    profiles: number;
    reports: number;
  };
  facebook: {
    ads: number;
  };
  total: number;
}

interface ProfileData {
  id: number;
  email: string;
  fullName: string;
  createdAt: string;
  instagramHandle: string | null;
  linkedInHandle: string | null;
  facebookPageUrl: string | null;
  stats: ProfileStats;
}

export default function ProfilePage() {
  const { token, user, login } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit states
  const [editing, setEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  // const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

  const fetchProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.data) {
        setProfile(json.data);
      } else {
        toast.error("Failed to load profile data");
      }
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const saveField = async (field: string, value: string) => {
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: value }),
      });
      const json = await res.json();

      if (json.data) {
        setProfile((prev) => prev ? { ...prev, ...json.data } : null);
        setEditing(null);
        toast.success("Profile updated");

        if (field === "fullName" && user) {
          login(token, { ...user, fullName: value }, user.loginSource || "thehooklab");
        }
      } else {
        toast.error(json.message || "Failed to update profile");
      }
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (field: string, currentValue: string) => {
    setEditing(field);
    setEditValues({ ...editValues, [field]: currentValue || "" });
  };

  const cancelEdit = () => setEditing(null);

  const confirmEdit = async (field: string) => {
    await saveField(field, editValues[field] || "");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!profile) return null;

  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24 pt-4">
      {/* ── Simple Minimalist Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg">
            Manage your account details and view your platform-wide content performance statistics.
          </p>
        </div>
      </div>
      <div className="grid gap-8 px-4">
        <MyCreatorProfile profile={profile} onSaveField={saveField} memberSince={memberSince} />
        <SavedCollections />
      </div>
    </div>
  );
}

function DetailedStat({ value, label, highlight = false }: { value: number; label: string; highlight?: boolean }) {
  return (
    <div>
      <p className={`text-4xl font-black tracking-tighter ${highlight ? "text-foreground" : "text-foreground/80"}`}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mt-1">{label}</p>
    </div>
  );
}

function SocialLink({ field, value, prefix = "@", onSave }: any) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || "");

  if (editing) {
    return (
      <div className="flex items-center gap-2 mt-1">
        <Input value={val} onChange={(e) => setVal(e.target.value)} className="h-8 w-full max-w-[180px] rounded-lg text-xs" />
        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-500" onClick={() => { onSave(val); setEditing(false); }}>
          <Check className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <button onClick={() => setEditing(true)} className="mt-1 flex items-center justify-between w-full text-foreground group">
      <span className="text-sm font-bold tracking-tight">
        {value ? (
          <>
            <span className="opacity-20 mr-0.5">{prefix}</span>
            {value}
          </>
        ) : "Unlinked"}
      </span>
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
    </button>
  );
}
