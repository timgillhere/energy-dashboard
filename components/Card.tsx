interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function Card({ children, style }: CardProps) {
  return (
    <div
      style={{
        background: "#141414",
        border: "1px solid #1e1e1e",
        borderRadius: 20,
        padding: 24,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
