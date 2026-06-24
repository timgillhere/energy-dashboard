"use client";

import { useState } from "react";
import { LayoutDashboard, History, Settings } from "lucide-react";

type View = "dashboard" | "history" | "settings";

interface NavProps {
  view: View;
  onNavigate: (v: View) => void;
}

const NAV_ITEMS: { id: View; icon: React.ReactNode; label: string; description: string }[] = [
  {
    id: "dashboard",
    icon: <LayoutDashboard size={20} />,
    label: "Dashboard",
    description: "Current rates, today's spend, and live consumption",
  },
  {
    id: "history",
    icon: <History size={20} />,
    label: "History",
    description: "Weekly spend trends and historical usage charts",
  },
  {
    id: "settings",
    icon: <Settings size={20} />,
    label: "Settings",
    description: "Meter details, tariff codes, and alert threshold",
  },
];

function ElectricHouseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 2L20 10V19H14V13H8V19H2V10L11 2Z" fill="currentColor" fillOpacity="0.18" />
      <path d="M11 2L20 10V19H14V13H8V19H2V10L11 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M13.5 5.5L9 12.5H12L9.5 18.5L16 11H13L13.5 5.5Z" fill="currentColor" />
    </svg>
  );
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: (typeof NAV_ITEMS)[0];
  active: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: 42,
          height: 42,
          borderRadius: 14,
          border: active
            ? "1px solid rgba(255,0,110,0.70)"
            : "1px solid transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: active
            ? "rgba(255,0,110,0.15)"
            : hovered
            ? "rgba(255,0,110,0.08)"
            : "transparent",
          color: active
            ? "#FF2D78"
            : hovered
            ? "rgba(255,45,120,0.70)"
            : "rgba(240,238,255,0.35)",
          boxShadow: active ? "0 0 14px rgba(255,0,110,0.25)" : "none",
          transition: "all 0.15s",
        }}
      >
        {item.icon}
      </button>

      {hovered && (
        <div
          style={{
            position: "absolute",
            left: "calc(100% + 12px)",
            top: "50%",
            transform: "translateY(-50%)",
            background: "#0C0C1A",
            border: "1px solid rgba(255,0,110,0.50)",
            borderRadius: 14,
            padding: "8px 12px",
            whiteSpace: "nowrap",
            zIndex: 200,
            pointerEvents: "none",
            boxShadow: "0 0 20px rgba(255,0,110,0.20), 0 4px 16px rgba(0,0,0,0.80)",
          }}
        >
          <p style={{ color: "#F0EEFF", fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
            {item.label}
          </p>
          <p style={{ color: "rgba(240,238,255,0.50)", fontSize: 11, maxWidth: 200, whiteSpace: "normal" }}>
            {item.description}
          </p>
          <div
            style={{
              position: "absolute",
              right: "100%",
              top: "50%",
              transform: "translateY(-50%)",
              width: 0,
              height: 0,
              borderTop: "5px solid transparent",
              borderBottom: "5px solid transparent",
              borderRight: "6px solid rgba(255,0,110,0.50)",
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function Nav({ view, onNavigate }: NavProps) {
  return (
    <nav
      style={{
        background: "#050508",
        borderRight: "1px solid rgba(255,0,110,0.20)",
        width: 64,
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 20,
        paddingBottom: 20,
        gap: 6,
        flexShrink: 0,
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          background: "#0A0814",
          border: "1px solid #FF2D78",
          boxShadow: "0 0 18px rgba(255,45,120,0.70), inset 0 0 12px rgba(255,45,120,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          flexShrink: 0,
          color: "#FF2D78",
        }}
      >
        <ElectricHouseIcon />
      </div>

      {NAV_ITEMS.map((item) => (
        <NavButton
          key={item.id}
          item={item}
          active={view === item.id}
          onClick={() => onNavigate(item.id)}
        />
      ))}
    </nav>
  );
}
