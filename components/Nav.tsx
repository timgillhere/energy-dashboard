"use client";

import { Zap, BarChart2, Settings, Bell } from "lucide-react";

type View = "dashboard" | "history" | "settings";

interface NavProps {
  view: View;
  onNavigate: (v: View) => void;
}

const NAV_ITEMS: { id: View; icon: React.ReactNode; label: string }[] = [
  { id: "dashboard", icon: <Zap size={20} />, label: "Dashboard" },
  { id: "history", icon: <BarChart2 size={20} />, label: "History" },
  { id: "settings", icon: <Settings size={20} />, label: "Settings" },
];

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
        gap: 8,
        flexShrink: 0,
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 50,
      }}
    >
      {/* Logo */}
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
        }}
      >
        <Zap size={20} color="#0a0a0a" fill="#0a0a0a" />
      </div>

      {NAV_ITEMS.map((item) => {
        const active = view === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            title={item.label}
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: active ? "rgba(163,230,53,0.15)" : "transparent",
              color: active ? "#a3e635" : "#6b7280",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!active) {
                (e.currentTarget as HTMLButtonElement).style.background = "#1e1e1e";
                (e.currentTarget as HTMLButtonElement).style.color = "#d1d5db";
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "#6b7280";
              }
            }}
          >
            {item.icon}
          </button>
        );
      })}
    </nav>
  );
}
