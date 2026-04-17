"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useTheme } from "@/context/theme-context";
import { Moon, Sun } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/creators": "Creators",
  "/templates": "Prompt Templates",
  "/ads-library": "Ads Library",
  "/content-mix": "Content Mix",
  "/settings": "Settings & API Keys",
  "/videos": "Videos",
  "/run": "Run Pipeline",
  "/analyze": "Single Reel Deep Analyzer",
  "/profile": "Profile",
};

export function TopBar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { state } = useSidebar();

  const matchedKey = Object.keys(pageTitles).find((key) => pathname.startsWith(key));
  const title = matchedKey ? pageTitles[matchedKey] : "Virality System";

  return (
    <div className="sticky top-0 z-10 flex h-14 items-center gap-3 bg-transparent px-4 md:px-8 backdrop-blur-sm">
      {state === "collapsed" && (
        <>
          <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-all duration-200" />
          <div className="h-4 w-px bg-border/40" />
        </>
      )}

      <span className="text-sm sm:text-base font-medium text-foreground/80">{title}</span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Theme Toggle */}
      <button
        id="theme-toggle-btn"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        className="
          flex h-8 w-8 items-center justify-center rounded-lg
          border border-border/60
          bg-muted/50 hover:bg-muted
          text-muted-foreground hover:text-foreground
          transition-all duration-200
          hover:scale-105 active:scale-95
        "
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4 transition-transform duration-300 rotate-0" />
        ) : (
          <Moon className="h-4 w-4 transition-transform duration-300 rotate-0" />
        )}
      </button>
    </div>
  );
}
