"use client";

import { useState } from "react";
import { Zap, LayoutDashboard, History, Settings } from "lucide-react";

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
          borderRadius: 12,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: active
            ? "rgba(163,230,53,0.15)"
            : hovered
            ? "#1e1e1e"
            : "transparent",
          color: active ? "#a3e635" : hovered ? "#d1d5db" : "#6b7280",
          transition: "all 0.15s",
        }}
      >
        {item.icon}
      </button>

      {/* Tooltip — flies out to the right of the nav */}
      {hovered && (
        <div
          style={{
            position: "absolute",
            left: "calc(100% + 12px)",
            top: "50%",
            transform: "translateY(-50%)",
            background: "#1e1e1e",
            border: "1px solid #2a2a2a",
            borderRadius: 10,
            padding: "8px 12px",
            whiteSpace: "nowrap",
            zIndex: 200,
            pointerEvents: "none",
          }}
        >
          <p style={{ color: "#ededed", fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
            {item.label}
          </p>
          <p style={{ color: "#6b7280", fontSize: 11, maxWidth: 200, whiteSpace: "normal" }}>
            {item.description}
          </p>
          {/* Arrow */}
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
              borderRight: "6px solid #2a2a2a",
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
        background: "#0f0f0f",
        borderRight: "1px solid #1e1e1e",
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
          borderRadius: 12,
          background: "#a3e635",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          flexShrink: 0,
        }}
      >
        <Zap size={20} color="#0a0a0a" fill="#0a0a0a" />
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
