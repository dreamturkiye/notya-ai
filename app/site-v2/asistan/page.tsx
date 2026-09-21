import { Cerceve } from '@/components/site-v2/Cerceve'
import { AYSE_GUN, HASTALAR } from '@/lib/site-v2/demoVeri'

export default function SiteV2Asistan() {
  return (
    <Cerceve baslik="Asistan">
      <div style={{ background: '#1B4332', color: '#F4EFE6', padding: 20, maxWidth: 560 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7 }}>Ayşe</div>
        <p style={{ margin: '10px 0 0', lineHeight: 1.5 }}>{AYSE_GUN}</p>
      </div>
      <div style={{ marginTop: 16, maxWidth: 560, background: '#FBF7F0', border: '1px solid #D8D0C4', padding: 16, color: '#5A6B62' }}>
        Örnek: “Elif Demir’in dosyasını aç” → {HASTALAR[0].ad}, {HASTALAR[0].yasMetin}. Onaysız yazma yok.
      </div>
    </Cerceve>
  )
}
