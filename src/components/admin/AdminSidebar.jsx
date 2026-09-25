import React from "react";
import { NavLink } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import { buttonStyle, panelStyle } from "./ui";
import Icon from "../../icons/Icon.jsx";

const navItems = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/posts", label: "Posts" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/tags", label: "Tags" },
  { to: "/admin/media", label: "Media" },
  { to: "/admin/seo-settings", label: "SEO Settings" },
  { to: "/admin/analytics", label: "Analytics" }
];

export default function AdminSidebar({ collapsed, onToggle, user, onLogout, stacked = false }) {
  const theme = useTheme();

  return (
    <aside
      style={{
        ...panelStyle(theme, {
          padding: 22,
          display: "grid",
          alignContent: "space-between",
          gap: 24,
          minHeight: stacked ? "auto" : "calc(100vh - 40px)",
          position: stacked ? "static" : "sticky",
          top: stacked ? "auto" : 20,
          width: stacked ? "100%" : collapsed ? 84 : 250,
          overflow: "hidden"
        })
      }}
    >
      <div style={{ display: "grid", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          {!collapsed || stacked ? (
            <div>
              <div style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.2rem", color: theme.text }}>
                Automation Paths
              </div>
              <div style={{ color: theme.text3, fontFamily: "Manrope, sans-serif", fontSize: "0.9rem" }}>
                Blog CMS
              </div>
            </div>
          ) : (
            <div style={{ fontFamily: "Fraunces, serif", color: theme.text, fontSize: "1.5rem" }}>AP</div>
          )}
          <button type="button" onClick={onToggle} style={buttonStyle(theme, "ghost", { padding: "10px 12px" })}>
            <Icon name={collapsed ? "arrow-right" : "arrow-left"} size={16} />
          </button>
        </div>
        <nav style={{ display: "grid", gap: 8 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              style={({ isActive }) => ({
                textDecoration: "none",
                color: isActive ? "#fff" : theme.text2,
                background: isActive ? theme.grad : "transparent",
                borderRadius: 16,
                padding: collapsed && !stacked ? "12px 10px" : "12px 14px",
                fontFamily: "Manrope, sans-serif",
                fontWeight: 600,
                textAlign: collapsed && !stacked ? "center" : "left"
              })}
            >
              {collapsed && !stacked ? item.label.slice(0, 1) : item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {!collapsed || stacked ? (
          <div>
            <div style={{ fontFamily: "Outfit, sans-serif", color: theme.text }}>{user?.name || "Admin"}</div>
            <div style={{ fontFamily: "Manrope, sans-serif", color: theme.text3, fontSize: "0.9rem" }}>
              {user?.email || "riaz@automationpaths.com"}
            </div>
          </div>
        ) : null}
        <button type="button" onClick={onLogout} style={buttonStyle(theme, "default")}>
          {collapsed ? <Icon name="arrow-sign-out-1" size={18} title="Logout" /> : "Logout"}
        </button>
      </div>
    </aside>
  );
}

