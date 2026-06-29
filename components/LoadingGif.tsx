import { Zap } from "lucide-react";

export default function LoadingGif({ height = 120 }: { height?: number }) {
  const boltSize = Math.round(height * 0.28);
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height, gap: 14 }}>
      <Zap size={boltSize} color="#00F0FF" className="lgif-bolt-l" />
      <Zap size={boltSize} color="#FF2D78" className="lgif-bolt-r" />
    </div>
  );
}
