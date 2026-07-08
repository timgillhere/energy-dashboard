import { Zap } from "lucide-react";

export default function LoadingGif({ height = 120 }: { height?: number }) {
  const boltSize = Math.min(Math.round(height * 0.4), 44);
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height, gap: 8 }}>
      <Zap size={boltSize} color="#00F0FF" className="lgif-bolt-l" />
      <span style={{ color: "rgba(240,238,255,0.40)", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Loading...
      </span>
    </div>
  );
}
