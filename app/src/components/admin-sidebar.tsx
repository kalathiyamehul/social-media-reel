"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Database,
  Activity,
  Settings,
  ScrollText,
  LogOut,
  ArrowLeft,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useState } from "react";

const adminNavItems = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Data Explorer", href: "/admin/creators", icon: Database },
  { title: "Activity Feed", href: "/admin/activity", icon: Activity },
  { title: "System Config", href: "/admin/settings", icon: Settings },
  { title: "Audit Logs", href: "/admin/logs", icon: ScrollText },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const isActive = (item: typeof adminNavItems[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname?.startsWith(item.href);
  };

  return (
    <aside
      className={`admin-sidebar ${collapsed ? "admin-sidebar--collapsed" : ""}`}
      style={{
        width: collapsed ? "72px" : "260px",
        minWidth: collapsed ? "72px" : "260px",
      }}
    >
      {/* Header */}
      <div className="admin-sidebar__header">
        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__logo">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="admin-sidebar__brand-text">
              <span className="admin-sidebar__brand-name">CreatorEye</span>
              <span className="admin-sidebar__brand-tag">Admin Console</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="admin-sidebar__collapse-btn"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="admin-sidebar__nav">
        <div className="admin-sidebar__nav-group">
          {!collapsed && (
            <span className="admin-sidebar__nav-label">Main</span>
          )}
          {adminNavItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-sidebar__nav-item ${active ? "admin-sidebar__nav-item--active" : ""}`}
                title={collapsed ? item.title : undefined}
              >
                <item.icon className="admin-sidebar__nav-icon" />
                {!collapsed && (
                  <span className="admin-sidebar__nav-text">{item.title}</span>
                )}
                {active && <div className="admin-sidebar__nav-indicator" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="admin-sidebar__footer">
        {user && !collapsed && (
          <div className="admin-sidebar__user">
            <div className="admin-sidebar__user-avatar">
              {user.fullName?.charAt(0).toUpperCase()}
            </div>
            <div className="admin-sidebar__user-info">
              <p className="admin-sidebar__user-name">{user.fullName}</p>
              <p className="admin-sidebar__user-role">
                {user.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="admin-sidebar__logout-btn"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {user && collapsed && (
          <button
            onClick={handleLogout}
            className="admin-sidebar__nav-item admin-sidebar__logout-collapsed"
            title="Sign out"
          >
            <LogOut className="admin-sidebar__nav-icon" />
          </button>
        )}
      </div>
    </aside>
  );
}
