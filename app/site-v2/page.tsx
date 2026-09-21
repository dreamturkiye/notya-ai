import Link from 'next/link'
import { Cerceve } from '@/components/site-v2/Cerceve'
import { siteV2Yol } from '@/lib/site-v2/sandbox'
import { HASTALAR, HEKIM } from '@/lib/site-v2/demoVeri'

const SAYFALAR = [
  { href: '/doktor', ad: 'Landing (eski /doktor yerine)', not: 'Yeni marka iskeleti' },
  { href: '/giris', ad: 'Giriş', not: 'Beta hekim sahnesi' },
  { href: '/kayit', ad: 'Kayıt', not: '15 gün deneme' },
  { href: '/uygulama', ad: 'Uygulama ana sayfa', not: 'Günün başı + randevu' },
  { href: '/hastalar', ad: 'Hastalar', not: 'Pediatri + KD' },
  { href: '/hastalar/elif', ad: 'Hasta dosyası — çocuk', not: 'Veli, büyüme, M-CHAT, Görüntüler' },
  { href: '/hastalar/selin', ad: 'Hasta dosyası — KD', not: 'Yetişkin, veli yok' },
  { href: '/asistan', ad: 'Asistan', not: 'Ayşe yazılı' },
  { href: '/sagligim', ad: 'Sağlığım (veli)', not: 'Onaysız AI yok' },
  { href: '/araclar', ad: 'Araçlar', not: 'Kartlar, gömülü stüdyo yok' },
]

export default function SiteV2Stüdyo() {
  return (
    <Cerceve baslik="Yeni site şablonu">
      <p style={{ color: '#5A6B62', maxWidth: 640, lineHeight: 1.55 }}>
        Canlı <code>/doktor</code> ve dashboard duruyor. Bu ağaç yalnız localhost ve Vercel preview’da açılır.
        Veri: {HEKIM.ad} beta listesindeki yüzeyler, sentetik hastalar ({HASTALAR.length} kişi).
      </p>
      <div style={{ display: 'grid', gap: 10, marginTop: 24 }}>
        {SAYFALAR.map((s) => (
          <Link key={s.href} href={siteV2Yol(s.href)} style={{
            display: 'block', background: '#FBF7F0', border: '1px solid #D8D0C4',
            padding: '14px 16px', textDecoration: 'none', color: 'inherit',
          }}>
            <div style={{ fontWeight: 700 }}>{s.ad}</div>
            <div style={{ fontSize: 13, color: '#5A6B62', marginTop: 4 }}>{s.not}</div>
          </Link>
        ))}
      </div>
    </Cerceve>
  )
}
