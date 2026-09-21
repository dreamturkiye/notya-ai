import { Cerceve } from '@/components/site-v2/Cerceve'

export default function SiteV2Kayit() {
  return (
    <Cerceve baslik="15 gün ücretsiz">
      <p style={{ color: '#5A6B62', maxWidth: 480 }}>Branş seçimi ve asistan eşlemesi bu şablonda durur. Production <code>/kayit</code> değişmez.</p>
      <div style={{ display: 'grid', gap: 8, maxWidth: 420, marginTop: 20 }}>
        {['Pediatri', 'Kadın Hastalıkları ve Doğum', 'Dahiliye', 'Göz'].map((b) => (
          <div key={b} style={{ background: '#FBF7F0', border: '1px solid #D8D0C4', padding: '12px 14px' }}>{b}</div>
        ))}
      </div>
    </Cerceve>
  )
}
