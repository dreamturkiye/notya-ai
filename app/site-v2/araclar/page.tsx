import { Cerceve } from '@/components/site-v2/Cerceve'

const KARTLAR = [
  { ad: 'e-Reçete', not: 'Ortak araç' },
  { ad: 'ICD-10', not: 'Ortak araç' },
  { ad: 'Epikriz', not: 'Gökhan v8: gerçek ad, unvan, PDF' },
  { ad: 'Hedef Boy', not: 'Pediatri-only — KD’de yok' },
]

export default function SiteV2Araclar() {
  return (
    <Cerceve baslik="Araçlar">
      <p style={{ color: '#5A6B62' }}>Kartlar açılır. Landing’e gömülü stüdyo yok.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginTop: 18 }}>
        {KARTLAR.map((k) => (
          <div key={k.ad} style={{ background: '#FBF7F0', border: '1px solid #D8D0C4', padding: 16 }}>
            <div style={{ fontWeight: 700 }}>{k.ad}</div>
            <div style={{ fontSize: 13, color: '#5A6B62', marginTop: 6 }}>{k.not}</div>
          </div>
        ))}
      </div>
    </Cerceve>
  )
}
