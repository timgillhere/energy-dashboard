"use client";

import { useState } from "react";
import { Info } from "lucide-react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  width?: number;
}

export function Tooltip({ content, children, side = "top", width = 180 }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  const positionStyle: React.CSSProperties =
    side === "top"
      ? { bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" }
      : side === "bottom"
      ? { top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" }
      : side === "right"
      ? { left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" }
      : { right: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" };

  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onClick={(e) => { e.stopPropagation(); setVisible((v) => !v); }}
    >
      {children}
      {visible && (
        <span
          style={{
            position: "absolute",
            ...positionStyle,
            width,
            background: "#0A0A18",
            border: "1px solid rgba(255,0,110,0.55)",
            borderRadius: 12,
            padding: "7px 10px",
            fontSize: 12,
            lineHeight: 1.4,
            color: "rgba(240,238,255,0.80)",
            zIndex: 200,
            pointerEvents: "none",
            whiteSpace: "normal",
            boxShadow: "0 0 20px rgba(255,0,110,0.20), 0 4px 16px rgba(0,0,0,0.80)",
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}

export function InfoTip({ content, width, side }: { content: string; width?: number; side?: "top" | "right" | "bottom" | "left" }) {
  return (
    <Tooltip content={content} width={width} side={side ?? "bottom"}>
      <button
        type="button"
        style={{
          background: "none",
          border: "none",
          padding: 4,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
          touchAction: "manipulation",
        }}
        aria-label="More information"
      >
        <Info size={13} color="rgba(240,238,255,0.30)" style={{ flexShrink: 0, pointerEvents: "none" }} />
      </button>
    </Tooltip>
  );
}
