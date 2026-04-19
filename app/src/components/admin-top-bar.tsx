"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "@/context/theme-context";
import { Moon, Sun, Bell, Search } from "lucide-react";
import Link from "next/link";

const adminPageTitles: Record<string, { title: string; description: string }> = {
  "/admin": { title: "Dashboard", description: "System overview and key metrics" },
  "/admin/analytics": { title: "Analytics", description: "Growth trends and platform insights" },
  "/admin/users": { title: "User Management", description: "View and manage all registered users" },
  "/admin/creators": { title: "Data Explorer", description: "Browse all scraped creator data" },
  "/admin/activity": { title: "Activity Feed", description: "Real-time platform activity stream" },
  "/admin/settings": { title: "System Config", description: "Manage system-wide configuration" },
  "/admin/logs": { title: "Audit Logs", description: "Admin action history and audit trail" },
};

export function AdminTopBar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const matchedKey = Object.keys(adminPageTitles).find((key) => {
    if (key === "/admin") return pathname === "/admin";
    return pathname?.startsWith(key);
  });

  const pageInfo = matchedKey
    ? adminPageTitles[matchedKey]
    : { title: "Admin", description: "" };

  // Build breadcrumbs
  const segments = pathname?.split("/").filter(Boolean) || [];
  const breadcrumbs = segments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <div className="admin-topbar">
      <div className="admin-topbar__left">
        {/* Breadcrumbs */}
        <nav className="admin-topbar__breadcrumbs">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.href} className="admin-topbar__breadcrumb">
              {i > 0 && <span className="admin-topbar__breadcrumb-sep">/</span>}
              {crumb.isLast ? (
                <span className="admin-topbar__breadcrumb-current">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="admin-topbar__breadcrumb-link">
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>

        {/* Page Title */}
        <div className="admin-topbar__title-group">
          <h1 className="admin-topbar__title">{pageInfo.title}</h1>
          {pageInfo.description && (
            <p className="admin-topbar__subtitle">{pageInfo.description}</p>
          )}
        </div>
      </div>

      <div className="admin-topbar__right">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="admin-topbar__icon-btn"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
