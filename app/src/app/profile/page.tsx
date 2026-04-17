"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User,
  Mail,
  Calendar,
  Instagram,
  Linkedin,
  Pencil,
  Check,
  X,
  Camera,
  Loader2,
  Sparkles,
  Shield,
  FileText,
  TrendingUp,
  Video,
  Users,
  Layout,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

interface ProfileStats {
  linkedinProfiles: number;
  instagramCreators: number;
  reelsAnalyzed: number;
  standardReports: number;
}

interface ProfileData {
  id: number;
  email: string;
  fullName: string;
  createdAt: string;
  bio: string | null;
  profilePicUrl: string | null;
  instagramHandle: string | null;
  linkedInHandle: string | null;
  stats: ProfileStats;
}

const AVATAR_STYLES = [
  { id: 'adventurer', name: 'Explorer', style: 'adventurer' },
  { id: 'bottts', name: 'Robotic', style: 'bottts' },
  { id: 'lorelei', name: 'Artistic', style: 'lorelei' },
  { id: 'notionists', name: 'Professional', style: 'notionists' },
  { id: 'pixel-art', name: 'Retro', style: 'pixel-art' },
  { id: 'big-ears', name: 'Cartoonist', style: 'big-ears' },
  { id: 'avataaars', name: 'Modern', style: 'avataaars' },
  { id: 'thumbs', name: 'Unique', style: 'thumbs' },
];

function nameToGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash % 360);
  const h2 = (h1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 80%, 60%), hsl(${h2}, 90%, 50%))`;
}

export default function ProfilePage() {
  const { token, user, login } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAvatarLibrary, setShowAvatarLibrary] = useState(false);

  const [editing, setEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

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
          login(token, { ...user, fullName: value }, user.loginSource || "creatoreye");
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      await saveField("profilePicUrl", dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const selectLibraryAvatar = async (style: string) => {
    const seed = profile?.fullName || profile?.email || 'user';
    const avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
    await saveField("profilePicUrl", avatarUrl);
    setShowAvatarLibrary(false);
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
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-muted-foreground">Could not load profile</p>
      </div>
    );
  }

  const initials = profile.fullName?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 px-4 pt-4">
      {/* ── Dashboard Header ── */}
      <div className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-[2rem] bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-indigo-500/10 border border-purple-500/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl -ml-20 -mb-20" />

        <div className="relative group">
          <div className="relative h-32 w-32 rounded-3xl overflow-hidden border-4 border-white/20 shadow-xl shadow-purple-500/10 group-hover:scale-105 transition-transform duration-500">
             {profile.profilePicUrl ? (
                <img src={profile.profilePicUrl} alt={profile.fullName} className="h-full w-full object-cover" />
              ) : (
                <div 
                  className="h-full w-full flex items-center justify-center text-white text-4xl font-black"
                  style={{ background: nameToGradient(profile.fullName || "U") }}
                >
                  {initials}
                </div>
              )}
              
              <div 
                className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                onClick={() => setShowAvatarLibrary(true)}
              >
                <Camera className="h-6 w-6 text-white" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Change Avatar</span>
              </div>
          </div>
          <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-xl bg-purple-600 border-2 border-background flex items-center justify-center shadow-lg">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        </div>

        <div className="flex-1 space-y-3 text-center md:text-left z-10">
          <div className="flex items-center gap-3 justify-center md:justify-start">
             {editing === 'fullName' ? (
                <div className="flex items-center gap-2">
                   <Input 
                     autoFocus 
                     value={editValues.fullName} 
                     onChange={(e) => setEditValues({...editValues, fullName: e.target.value})}
                     className="h-9 w-48 rounded-xl border-purple-500/30 bg-white/5 font-bold"
                   />
                   <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-500" onClick={() => confirmEdit('fullName')}>
                     <Check className="h-4 w-4" />
                   </Button>
                </div>
             ) : (
                <>
                  <h1 className="text-3xl font-extrabold tracking-tight text-foreground truncate max-w-sm">
                    {profile.fullName}
                  </h1>
                  <button onClick={() => startEdit('fullName', profile.fullName)} className="p-1 opacity-40 hover:opacity-100 transition-opacity">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </>
             )}
          </div>
          
          <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start text-sm font-medium">
            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/5 text-muted-foreground">
              <Mail className="h-3.5 w-3.5 text-purple-500" />
              {profile.email}
            </span>
            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/5 text-muted-foreground">
              <Globe className="h-3.5 w-3.5 text-pink-500" />
              Member since {memberSince}
            </span>
          </div>

          <div className="flex items-center gap-3 justify-center md:justify-start pt-2">
            <span className="px-3 py-1 rounded-full bg-purple-600 text-[11px] font-bold text-white uppercase tracking-tighter shadow-lg shadow-purple-600/20">
              LUNORA PRO
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-500 uppercase tracking-tighter transition-all hover:bg-emerald-500/20 cursor-default">
              Early Adopter
            </span>
          </div>
        </div>
      </div>

      {/* ── Statistics Overview ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={<Users className="h-5 w-5" />} 
          label="Profiles Scraped" 
          value={profile.stats?.linkedinProfiles || 0} 
          color="purple" 
        />
        <StatCard 
          icon={<Instagram className="h-5 w-5" />} 
          label="Reels Scraped" 
          value={profile.stats?.instagramCreators || 0} 
          color="pink" 
        />
        <StatCard 
          icon={<Video className="h-5 w-5" />} 
          label="Deep Analyses" 
          value={profile.stats?.reelsAnalyzed || 0} 
          color="indigo" 
        />
        <StatCard 
          icon={<Layout className="h-5 w-5" />} 
          label="Strategy Reports" 
          value={profile.stats?.standardReports || 0} 
          color="amber" 
        />
      </div>

      {/* ── Main content grid ── */}
      <div className="grid gap-6 md:grid-cols-7">
        {/* Left Column: Bio + Social */}
        <div className="md:col-span-4 space-y-6">
          <div className="p-8 rounded-[2rem] bg-foreground/[0.02] border border-border/40 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-500">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg">About You</h3>
              </div>
              <button 
                onClick={() => editing === 'bio' ? cancelEdit() : startEdit('bio', profile.bio || '')}
                className="text-sm font-bold text-purple-500 hover:text-purple-600"
              >
                {editing === 'bio' ? "Cancel" : "Edit Bio"}
              </button>
            </div>

            {editing === 'bio' ? (
              <div className="space-y-4">
                <textarea 
                  autoFocus
                  className="w-full bg-foreground/5 border-purple-500/20 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-purple-500/20 outline-none transition-all placeholder:text-muted-foreground/30 min-h-[120px]"
                  placeholder="Tell Lunora about your creator journey..."
                  value={editValues.bio}
                  onChange={(e) => setEditValues({...editValues, bio: e.target.value})}
                />
                <div className="flex justify-end">
                   <Button onClick={() => confirmEdit('bio')} disabled={saving} className="rounded-full px-8 bg-purple-600 hover:bg-purple-700">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Profile Bio"}
                   </Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground leading-relaxed text-sm">
                {profile.bio || "You haven't written a bio yet. Help your analyses feel more personal by telling us who you are!"}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SocialCard 
              icon={<Instagram className="h-4 w-4" />}
              label="Instagram"
              value={profile.instagramHandle}
              field="instagramHandle"
              editing={editing}
              onEdit={() => startEdit('instagramHandle', profile.instagramHandle || '')}
              onSave={(v) => saveField('instagramHandle', v)}
              onCancel={cancelEdit}
            />
             <SocialCard 
              icon={<Linkedin className="h-4 w-4" />}
              label="LinkedIn"
              value={profile.linkedInHandle}
              field="linkedInHandle"
              editing={editing}
              onEdit={() => startEdit('linkedInHandle', profile.linkedInHandle || '')}
              onSave={(v) => saveField('linkedInHandle', v)}
              onCancel={cancelEdit}
            />
          </div>
        </div>

        {/* Right Column: Mini stats or promo */}
        <div className="md:col-span-3 space-y-6">
           <div className="p-8 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-xl shadow-indigo-600/20">
              <TrendingUp className="h-8 w-8 mb-4 opacity-50" />
              <h3 className="text-2xl font-black mb-2 leading-tight">Lunora Analytics</h3>
              <p className="text-indigo-100 text-sm mb-6 opacity-80 leading-relaxed thin-scrollbar max-h-24 overflow-y-auto">
                Your creator footprint is growing. Every analyzed reel and strategy report makes Lunora smarter for your specifically. 
              </p>
              <div className="p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
                 <div className="flex justify-between items-end">
                   <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">System Usage</span>
                   <span className="text-lg font-black">{((profile.stats?.reelsAnalyzed || 0) + (profile.stats?.standardReports || 0))} </span>
                 </div>
                 <div className="h-1.5 w-full bg-white/10 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-white rounded-full" style={{ width: '45%' }} />
                 </div>
              </div>
           </div>

           <div className="p-8 rounded-[2rem] border border-border/40 bg-foreground/[0.01]">
              <h4 className="font-bold text-sm mb-4">Security & Identity</h4>
              <div className="space-y-4">
                 <div className="flex items-center justify-between p-3 rounded-xl bg-foreground/5">
                   <div className="flex items-center gap-3">
                     <Shield className="h-4 w-4 text-emerald-500" />
                     <span className="text-xs font-bold">Two-Factor Auth</span>
                   </div>
                   <span className="text-[10px] font-black text-muted-foreground uppercase">Disabled</span>
                 </div>
                 <div className="flex items-center justify-between p-3 rounded-xl bg-foreground/5">
                   <div className="flex items-center gap-3">
                     <Users className="h-4 w-4 text-purple-500" />
                     <span className="text-xs font-bold">Platform Access</span>
                   </div>
                   <span className="text-[10px] font-black text-muted-foreground uppercase">Standard</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* ── Avatar Library Modal ── */}
      {showAvatarLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="w-full max-w-2xl p-8 rounded-[2.5rem] bg-card border border-border shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black">Lunora Identities</h3>
                <p className="text-sm text-muted-foreground">Select a persona that matches your creator vibe.</p>
              </div>
              <Button size="icon" variant="ghost" className="rounded-2xl" onClick={() => setShowAvatarLibrary(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
               {/* Upload First Option */}
               <div 
                 className="group relative h-32 rounded-3xl border-2 border-dashed border-border/60 hover:border-purple-500/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-purple-500/5"
                 onClick={() => fileInputRef.current?.click()}
               >
                 <Camera className="h-6 w-6 text-muted-foreground group-hover:text-purple-500 transition-colors" />
                 <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Upload File</span>
               </div>

               {/* Library Icons */}
               {AVATAR_STYLES.map((style) => (
                 <div 
                   key={style.id}
                   className="group relative h-32 rounded-3xl border-2 border-transparent bg-foreground/5 hover:bg-purple-500/10 hover:border-purple-500/30 overflow-hidden cursor-pointer transition-all"
                   onClick={() => selectLibraryAvatar(style.style)}
                 >
                   <img 
                      src={`https://api.dicebear.com/7.x/${style.style}/svg?seed=${encodeURIComponent(profile.fullName || 'user')}`} 
                      alt={style.name}
                      className="h-full w-full object-cover p-2"
                   />
                   <div className="absolute inset-0 flex items-center justify-center bg-purple-600/80 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-bold text-white uppercase tracking-tighter">{style.name}</span>
                   </div>
                 </div>
               ))}
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: any; label: string; value: number; color: 'purple' | 'pink' | 'indigo' | 'amber' }) {
  const colors = {
    purple: 'from-purple-500/20 text-purple-600 border-purple-500/20 bg-purple-500/5',
    pink: 'from-pink-500/20 text-pink-600 border-pink-500/20 bg-pink-500/5',
    indigo: 'from-indigo-500/20 text-indigo-600 border-indigo-500/20 bg-indigo-500/5',
    amber: 'from-amber-500/20 text-amber-600 border-amber-500/20 bg-amber-500/5'
  };

  return (
    <div className={`p-6 rounded-[2rem] border ${colors[color]} space-y-3 transition-all hover:scale-[1.02] cursor-default`}>
       <div className={`h-10 w-10 rounded-2xl flex items-center justify-center bg-gradient-to-br ${colors[color].split(' ')[0]} ${colors[color].split(' ')[1]} border shadow-sm`}>
          {icon}
       </div>
       <div>
         <p className="text-2xl font-black">{value.toLocaleString()}</p>
         <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">{label}</p>
       </div>
    </div>
  );
}

function SocialCard({ icon, label, value, field, editing, onEdit, onSave, onCancel }: any) {
  const [val, setVal] = useState(value || "");
  const isEditing = editing === field;

  return (
    <div className="p-6 rounded-3xl bg-foreground/[0.02] border border-border/40 group">
       <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
             <div className="p-2 rounded-xl bg-foreground/5 text-muted-foreground group-hover:text-foreground transition-colors">
                {icon}
             </div>
             <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
          </div>
          {isEditing ? (
             <div className="flex items-center gap-1">
                <button onClick={() => onSave(val)} className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg">
                   <Check className="h-3.5 w-3.5" />
                </button>
                <button onClick={onCancel} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg">
                   <X className="h-3.5 w-3.5" />
                </button>
             </div>
          ) : (
             <button onClick={onEdit} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-muted-foreground hover:text-foreground">
                <Pencil className="h-3.5 w-3.5" />
             </button>
          )}
       </div>

       {isEditing ? (
          <Input 
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="h-8 rounded-lg bg-foreground/5 border-purple-500/30 text-xs"
            placeholder={`Your ${label} handle`}
          />
       ) : (
          <p className="text-sm font-bold truncate">
            {value ? (
              <span className="flex items-center gap-1">
                <span className="opacity-30">@</span>
                {value}
              </span>
            ) : "Not linked"}
          </p>
       )}
    </div>
  );
}
