
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { 
  Check, 
  Zap, 
  Crown, 
  Sparkles, 
  Rocket, 
  CreditCard,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Plan {
  id: number;
  name: string;
  price: number;
  description: string | null;
  igReelCredits: number;
  igDeepCredits: number;
  igCreatorCredits: number;
  fbAdCredits: number;
  liAnalysisCredits: number;
  isDefault: boolean;
  durationDays: number | null;
}

export default function PricingPage() {
  const { token, user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

  useEffect(() => {
    fetch(`${BASE_URL}/admin/plans`) // Publicly accessible or through user token
      .then(r => r.json())
      .then(json => {
        if (Array.isArray(json.data)) {
          setPlans(json.data);
        }
      })
      .finally(() => setLoading(false));
  }, [BASE_URL]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 space-y-16">
      <div className="text-center space-y-4">
        <Badge variant="secondary" className="rounded-full px-4 py-1 bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs font-bold uppercase tracking-widest">
          Pricing Plans
        </Badge>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
          Scale your content strategy
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Choose the perfect plan to supercharge your competitor research and AI analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <PlanCard 
            key={plan.id} 
            plan={plan} 
            isCurrent={user?.planId === plan.id || (!user?.planId && plan.isDefault)}
          />
        ))}

        {/* Custom Solution Card if no plans or as a placeholder */}
        {plans.length === 0 && (
          <div className="col-span-full py-20 text-center glass rounded-[2.5rem] border-dashed border-2 border-border/50">
            <Rocket className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold">No public plans available</h3>
            <p className="text-muted-foreground text-sm">Contact our team for a custom enterprise solution.</p>
          </div>
        )}
      </div>

      <div className="glass rounded-[2.5rem] p-8 md:p-12 border border-purple-500/10 bg-gradient-to-r from-purple-500/[0.02] to-indigo-500/[0.02]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left">
            <h3 className="text-2xl font-bold">Enterprise & Custom Needs?</h3>
            <p className="text-muted-foreground text-sm max-w-md">
              Need more credits for a large agency? We offer custom volume-based pricing for teams requiring high-frequency analysis.
            </p>
          </div>
          <Button className="h-14 px-8 rounded-2xl bg-foreground text-background hover:bg-foreground/90 font-bold gap-2">
            Contact Sales
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan, isCurrent }: { plan: Plan; isCurrent: boolean }) {
  const isPaid = plan.price > 0;
  
  return (
    <div className={`relative flex flex-col p-8 rounded-[2.5rem] border transition-all duration-300 ${
      isCurrent 
        ? "border-purple-500/50 bg-purple-500/[0.03] shadow-2xl shadow-purple-500/10 ring-1 ring-purple-500/20" 
        : "border-border/50 bg-background/50 hover:border-purple-500/20 hover:bg-foreground/[0.01]"
    }`}>
      {isCurrent && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge className="bg-purple-500 text-white border-0 py-1 px-4 rounded-full text-[10px] font-black uppercase tracking-widest">
            Your Current Plan
          </Badge>
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-2xl ${isPaid ? "bg-purple-500/10 text-purple-400" : "bg-muted text-muted-foreground"}`}>
            {isPaid ? <Crown className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
          </div>
        </div>
        <h3 className="text-2xl font-black">{plan.name}</h3>
        <p className="text-sm text-muted-foreground mt-2 min-h-[40px]">{plan.description || "The baseline for individual creators."}</p>
      </div>

      <div className="mb-8 flex items-baseline gap-1">
        <span className="text-5xl font-black">${plan.price}</span>
        <span className="text-muted-foreground font-medium">/{plan.durationDays || 30} days</span>
      </div>

      <div className="flex-1 space-y-4 mb-8">
        <FeatureItem label={`${plan.igReelCredits} IG Reels & Analysis`} />
        <FeatureItem label={`${plan.igDeepCredits} Deep Analysis (GPT-4)`} />
        <FeatureItem label={`${plan.igCreatorCredits} Creator Profile Scrapes`} />
        <FeatureItem label={`${plan.fbAdCredits} Facebook Ads Analyzed`} />
        <FeatureItem label={`${plan.liAnalysisCredits} LinkedIn Strategy Reports`} />
      </div>

      <Button 
        disabled={isCurrent}
        className={`w-full h-14 rounded-2xl font-black text-sm transition-all duration-300 ${
          isCurrent 
            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default" 
            : isPaid
              ? "bg-purple-500 text-white hover:bg-purple-600 shadow-lg shadow-purple-500/25"
              : "bg-foreground text-background hover:bg-foreground/90 shadow-lg"
        }`}
      >
        {isCurrent ? (
          <span className="flex items-center gap-2">
            <Check className="h-5 w-5" /> Active
          </span>
        ) : (
          plan.price > 0 ? "Upgrade Now" : "Get Started"
        )}
      </Button>
    </div>
  );
}

function FeatureItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
        <Check className="h-3 w-3 text-emerald-500" />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
