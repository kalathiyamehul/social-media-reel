"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Film, Play, Users, Settings2, Sparkles, Settings, LogOut, Library, ScanSearch, UserCircle, ShieldCheck } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/auth-context";

const navItems = [
  { title: "Creators", href: "/creators", icon: Users },
  { title: "Ads Library", href: "/ads-library", icon: Library },
  { title: "Run Pipeline", href: "/run", icon: Play },
  { title: "Single Reel Analyzer", href: "/analyze", icon: ScanSearch },
  { title: "Videos", href: "/videos", icon: Film },
  { title: "Content Mix", href: "/content-mix", icon: Sparkles },
  { title: "Prompt Templates", href: "/templates", icon: Settings2 },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <Sidebar className="border-r border-border/50">
      <div className="px-5 h-14 flex items-center justify-between border-b border-border/10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/20">
            <Film className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-tight text-foreground">CreatorEye</h1>
            <p className="text-[10px] text-muted-foreground font-medium leading-none mt-0.5">AI Intelligence</p>
          </div>
        </div>
        <div className="flex items-center h-full">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-all duration-200" />
        </div>
      </div>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="h-10 rounded-xl px-3 transition-all duration-200"
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span className="text-[13px]">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 py-4 border-t border-border/50">
        <SidebarMenu>
          {isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname?.startsWith("/admin")}
                className="h-10 rounded-xl px-3 transition-all duration-200"
              >
                <Link href="/admin">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-[13px]">Admin Panel</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/settings"}
              className="h-10 rounded-xl px-3 transition-all duration-200"
            >
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                <span className="text-[13px]">Settings & API Keys</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {user && (
          <Link href="/profile" className="block">
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-muted/40 border border-border/50 px-3 py-2.5 hover:bg-muted/60 transition-colors cursor-pointer">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-600 dark:text-purple-300 text-xs font-bold flex-shrink-0">
                {user.fullName?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-foreground truncate">{user.fullName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLogout(); }}
                className="text-muted-foreground hover:text-red-400 transition-colors flex-shrink-0"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </Link>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
