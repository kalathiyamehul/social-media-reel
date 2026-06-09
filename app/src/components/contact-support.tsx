"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MessageCircle, Instagram, Mail, HelpCircle, User, KeyRound, Gem, Bug, Rocket, ArrowRight, ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";

export function ContactSupport({ trigger }: { trigger?: React.ReactNode }) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"contact" | "bug-report">("contact");
  const [bugMessage, setBugMessage] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendBugReport = async () => {
    if (!bugMessage.trim()) return;

    if (phoneNumber.trim()) {
      const digitsOnly = phoneNumber.replace(/\D/g, "");
      if (digitsOnly.length !== 10) {
        setPhoneError("Phone number must be exactly 10 digits.");
        return;
      }
    }
    setPhoneError("");

    setIsSending(true);
    try {
      const response = await fetch("/api/support/bug-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: bugMessage.trim(),
          phoneNumber: phoneNumber.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send bug report");
      }

      setBugMessage("");
      setPhoneNumber("");
      setPhoneError("");
      setView("contact");
      setOpen(false);
      toast.success("Bug report sent directly to admin! We'll look into it ASAP.");
    } catch (error) {
      console.error("Error sending bug report:", error);
      toast.error("Failed to send report. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            <span>Chat with Maker</span>
          </Button>
        )}
      </DialogTrigger>
      {/* Hide default borders and padding to allow our glass container to take over */}
      <DialogContent className="sm:max-w-4xl p-0 border-0 bg-transparent shadow-2xl overflow-hidden rounded-[2.5rem]">
        <DialogTitle className="sr-only">Contact Support & Bug Reports</DialogTitle>
        <div className="glass w-full h-full rounded-[2.5rem] border border-orange-500/20 bg-gradient-to-br from-background/95 via-background/80 to-muted/40 relative overflow-hidden flex flex-col md:flex-row">
          
          {/* Decorative Blur Orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-500/10 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none" />

          {/* Left Column: Context / Problems */}
          <div className="flex-1 p-8 md:p-12 border-b md:border-b-0 md:border-r border-border/40 relative z-10 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-500 font-black text-[10px] uppercase tracking-widest w-max mb-6 border border-orange-500/20">
              <MessageCircle className="w-3.5 h-3.5" />
              Support & Solutions
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 text-foreground leading-tight">
              Stuck? Let's <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">fix it.</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-10 leading-relaxed font-medium">
              Whether you're a new user trying to set up your free APIs or an agency needing a custom plan, we're just a DM away. We personally reply to everyone to ensure you get exactly what you need.
            </p>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-3">We frequently help with:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ProblemBadge icon={<KeyRound className="w-4 h-4 text-emerald-500" />} text="Free API Setup" />
                <ProblemBadge icon={<Gem className="w-4 h-4 text-blue-500" />} text="Billing & Credits" />
                <ProblemBadge icon={<Bug className="w-4 h-4 text-red-500" />} text="Bug Reports" />
                <ProblemBadge icon={<Rocket className="w-4 h-4 text-orange-500" />} text="Custom Plans" />
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Content */}
          <div className="flex-1 p-8 md:p-12 relative z-10 bg-foreground/[0.02] flex flex-col justify-center backdrop-blur-md transition-all duration-500">
            {view === "contact" ? (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-xl font-black tracking-tight mb-6 flex items-center gap-2">
                  Reach out directly
                </h3>
                <div className="space-y-4">
                  <ContactCard
                    href="https://www.instagram.com/techyytrio/"
                    icon={<Instagram className="w-5 h-5" />}
                    title="TechyyTrio Support"
                    subtitle="Fastest response time (@techyytrio)"
                    colorClass="bg-[#E1306C]/10 text-[#E1306C] border-[#E1306C]/20"
                  />
                  <ContactCard
                    href="mailto:techyytrio@gmail.com"
                    icon={<Mail className="w-5 h-5" />}
                    title="Email Support"
                    subtitle="For detailed inquiries or billing"
                    colorClass="bg-blue-500/10 text-blue-500 border-blue-500/20"
                  />
                  <ContactCard
                    href="https://www.instagram.com/its_parthshingala/"
                    icon={<User className="w-5 h-5" />}
                    title="Parth Shingala (Maker)"
                    subtitle="For feedback & partnerships"
                    colorClass="bg-orange-500/10 text-orange-500 border-orange-500/20"
                  />
                </div>

                <div className="mt-8 pt-6 border-t border-border/40">
                  <button
                    onClick={() => setView("bug-report")}
                    className="w-full py-4 rounded-2xl bg-foreground text-background font-black text-sm hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-foreground/5 hover:scale-[1.02]"
                  >
                    <Bug className="w-5 h-5 text-red-500" />
                    Report a Bug Directly to Admin
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500 flex flex-col h-full">
                <button
                  onClick={() => setView("contact")}
                  className="w-max mb-6 flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Contacts
                </button>
                <h3 className="text-xl font-black tracking-tight mb-2 flex items-center gap-2">
                  Send a direct message
                </h3>
                <p className="text-sm text-muted-foreground mb-6 font-medium">
                  Found a bug or issue? Describe it below and it will be sent instantly to the admin's priority inbox.
                </p>

                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[\d\s+\-()]*$/.test(val)) {
                      const digits = val.replace(/\D/g, "");
                      if (digits.length <= 10) {
                        setPhoneNumber(val);
                        if (phoneError) setPhoneError("");
                      }
                    }
                  }}
                  placeholder="Your Phone Number (Optional - so we can call to fix it fast)"
                  className={`bg-background/50 border-border/50 rounded-xl px-4 py-6 text-sm focus-visible:ring-red-500/30 transition-colors ${phoneError ? 'border-red-500 focus-visible:border-red-500 mb-1' : 'focus-visible:border-red-500/50 mb-3'}`}
                />
                {phoneError && <p className="text-xs text-red-500 mb-3 ml-2 font-medium">{phoneError}</p>}

                <Textarea
                  value={bugMessage}
                  onChange={(e) => setBugMessage(e.target.value)}
                  placeholder="What went wrong? e.g., 'When I try to generate an ad script, it gets stuck...'"
                  className="flex-1 min-h-[150px] resize-none bg-background/50 border-border/50 rounded-[1.25rem] p-4 text-sm mb-4 focus-visible:ring-red-500/30 focus-visible:border-red-500/50"
                />

                <Button
                  onClick={handleSendBugReport}
                  disabled={!bugMessage.trim() || isSending}
                  className="w-full h-14 rounded-2xl bg-red-500 text-white hover:bg-red-600 font-black text-sm shadow-xl shadow-red-500/20 transition-all active:scale-95"
                >
                  {isSending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Send to Admin
                    </div>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProblemBadge({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-background/60 border border-border/50 shadow-sm transition-colors hover:bg-muted/50">
      <div className="shrink-0 drop-shadow-sm">{icon}</div>
      <span className="text-xs font-bold text-foreground/80 tracking-wide">{text}</span>
    </div>
  );
}

function ContactCard({ href, icon, title, subtitle, colorClass }: { href: string, icon: React.ReactNode, title: string, subtitle: string, colorClass: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center p-4 rounded-[1.25rem] border border-border/60 bg-background/60 hover:bg-background transition-all duration-300 hover:shadow-lg hover:shadow-foreground/5 hover:-translate-y-0.5 group"
    >
      <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center mr-4 shrink-0 transition-transform duration-300 group-hover:scale-110 border ${colorClass}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-black text-foreground group-hover:text-foreground transition-colors tracking-wide">{title}</h4>
        <p className="text-xs font-medium text-muted-foreground truncate mt-1">{subtitle}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-foreground/70 transition-colors shrink-0 ml-2" />
    </a>
  );
}
