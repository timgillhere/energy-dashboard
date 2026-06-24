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
    >
      {children}
      {visible && (
        <span
          style={{
            position: "absolute",
            ...positionStyle,
            width,
            background: "#1e1e1e",
            border: "1px solid #2a2a2a",
            borderRadius: 8,
            padding: "7px 10px",
            fontSize: 12,
            lineHeight: 1.4,
            color: "#d1d5db",
            zIndex: 200,
            pointerEvents: "none",
            whiteSpace: "normal",
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}

// Convenience: an info icon with tooltip
export function InfoTip({ content, width }: { content: string; width?: number }) {
  return (
    <Tooltip content={content} width={width}>
      <Info size={13} color="#374151" style={{ cursor: "default", flexShrink: 0 }} />
    </Tooltip>
  );
}
