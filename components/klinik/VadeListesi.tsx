'use client'

export function VadeListesi({
  baslik,
  renk,
  zemin,
  gunler,
}: {
  baslik: string
  renk: string
  zemin: string
  gunler: Array<{ ad: string; durum: string }>
}) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: renk }}>{baslik}</div>
      {gunler.map((s, i) => (
        <div key={`${s.ad}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, background: zemin, borderRadius: 8, padding: '8px 10px', fontSize: 13 }}>
          <span>{s.ad}</span>
          <b>{s.durum}</b>
        </div>
      ))}
    </div>
  )
}
