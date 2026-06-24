interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function Card({ children, style }: CardProps) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0C0C1A 0%, #110A1E 100%)",
        border: "1px solid rgba(255,0,110,0.45)",
        borderRadius: 20,
        padding: 24,
        boxShadow: "0 0 24px rgba(255,0,110,0.12), 0 4px 20px rgba(0,0,0,0.70)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
