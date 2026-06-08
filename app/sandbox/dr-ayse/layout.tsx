export default function DrAyseSandboxLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100dvh",
      background: "#080F1A",
      color: "#fff",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      {children}
    </div>
  )
}
