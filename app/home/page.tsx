'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface Profession {
  id: string; href: string; label: string; accent: string; img: string;
  highlights: string[]; headline: string; body: string; detail: string[];
}

const PROFESSIONS: Profession[] = [
  {
    id: 'doktor', href: '/doktor', label: 'Doktor', accent: '#2563EB',
    img: '/doctors/dr_ayse.jpg',
    highlights: ['Sesli danisma, sinirsiz sure', 'Otomatik SOAP notu', 'ICD-10 kodlama', 'Ilac etkilesim kontrolu'],
    headline: "Nelson'i, Braunwald'i ezbere bilen bir asistan.",
    body: '50 hastadan sonra yorgun oldugunuzda bile o hic yorulmaz. Sesli danisma, otomatik SOAP notu, ICD-10 kodlama, ilac etkilesim kontrolu.',
    detail: ['9 uzmanlik dali', 'ENabiz rehberi', 'SGK Medula entegrasyonu', 'Aylik hasta raporlari'],
  },
  {
    id: 'mali', href: '/mali', label: 'Mali Musavir', accent: '#0F7A5C',
    img: 'https://images.unsplash.com/photo-1768055104895-e6185762f2a9?fm=jpg&q=80&w=1200&auto=format&fit=crop',
    highlights: ['Bordro hesap motoru', 'MASAK uyum kontrolu', 'GIB e-Beyan entegrasyonu', 'Musteri portali'],
    headline: 'Beyan takviminizi sizden once hatirlar.',
    body: '2026 vergi parametreleriyle guncel. Bordro hesap motoru, MASAK uyum kontrolu, GIB e-Beyan entegrasyonu, musteri portali.',
    detail: ['Akilli beyan takvimi', 'Telegram uyarilari', 'HMAC imzali musteri linki', 'E-Devlet rehberi'],
  },
  {
    id: 'avukat', href: '/avukat', label: 'Avukat', accent: '#7C3AED',
    img: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?fm=jpg&q=80&w=1200&auto=format&fit=crop',
    highlights: ['9 hukuk dalinda uzman persona', 'Otomatik dilekce olusturma', 'Sure takip motoru (HMK/CMK/IIK)', 'Yargitay ictihat aramasi'],
    headline: 'Bir sure kacirmak, bir daha olmaz.',
    body: '9 hukuk dalinda uzman persona, otomatik dilekce olusturma, HMK/CMK/IIK sure hesaplama, Yargitay ictihat aramasi.',
    detail: ['Muvekkil portali', 'KVKK dilekce sablonlari', 'Sozlesme risk analizi', 'Kritik sure uyarilari'],
  },
]

function FlipCard({ p }: { p: Profession }) {
  const [flipped, setFlipped] = useState(false)
  return (
    <div
      onClick={() => setFlipped(f => !f)}
      style={{ perspective: '1400px', height: '78vh', cursor: 'pointer' }}
    >
      <div style={{
        position: 'relative', width: '100%', height: '100%',
        transformStyle: 'preserve-3d',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        transition: 'transform .7s cubic-bezier(.4,.1,.2,1)',
      }}>
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', overflow: 'hidden' }}>
          <img src={p.img} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.15) contrast(1.05)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,10,0.75) 0%, transparent 40%)' }} />
          <div style={{ position: 'absolute', bottom: '24px', left: '24px', fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#FAFAF9', fontFamily: 'Inter, system-ui', fontWeight: 600 }}>
            {p.label}
          </div>
          <div style={{ position: 'absolute', top: '24px', right: '24px', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(250,250,249,0.65)', fontFamily: 'Inter, system-ui' }}>
            Cevir &#8635;
          </div>
        </div>
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)', background: '#0A0A0A',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '40px 32px', boxSizing: 'border-box',
        }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: p.accent, fontFamily: 'Inter, system-ui', fontWeight: 600, marginBottom: '24px' }}>
            {p.label}
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px' }}>
            {p.highlights.map(h => (
              <li key={h} style={{ fontSize: '15px', color: '#FAFAF9', fontFamily: 'Inter, system-ui', fontWeight: 300, lineHeight: 1.9, borderTop: '1px solid rgba(250,250,249,0.12)', padding: '12px 0' }}>{h}</li>
            ))}
          </ul>
          <Link href={p.href} onClick={(e: React.MouseEvent) => e.stopPropagation()} style={{ fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: p.accent, textDecoration: 'none', fontFamily: 'Inter, system-ui', fontWeight: 600, borderBottom: '1px solid ' + p.accent, paddingBottom: '3px', alignSelf: 'flex-start' }}>
            Devamini gor &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <main style={{ margin: 0, padding: 0, background: '#FAFAF9', color: '#0A0A0A', fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100vh', overflowX: 'hidden' }}>

      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: scrolled ? 'rgba(250,250,249,0.92)' : 'transparent', backdropFilter: scrolled ? 'blur(10px)' : 'none', borderBottom: scrolled ? '1px solid rgba(10,10,10,0.08)' : '1px solid transparent', transition: 'all .3s ease' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.02em' }}>NOTYA</div>
        <Link href='/giris' style={{ fontSize: '12px', fontWeight: 600, color: '#0A0A0A', textDecoration: 'none', letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: '1px solid #0A0A0A', paddingBottom: '2px' }}>Giris</Link>
      </nav>

      <section style={{ padding: '110px 24px 0' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(10,10,10,0.45)', fontWeight: 600, marginBottom: '18px' }}>Kart&#305; secin, cevirin</div>
          <h1 style={{ fontSize: 'clamp(32px,4.2vw,52px)', fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.02em', margin: 0 }}>
            Genel amacli bir asistan degil.
          </h1>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '2px', maxWidth: '1400px', margin: '0 auto' }}>
          {PROFESSIONS.map(p => <FlipCard key={p.id} p={p} />)}
        </div>
      </section>

      <section style={{ padding: '140px 24px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '56px' }}>
          {PROFESSIONS.map(p => (
            <div key={p.id}>
              <div style={{ fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: p.accent, fontWeight: 600, marginBottom: '20px' }}>{p.label}</div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.01em', margin: '0 0 18px' }}>{p.headline}</h2>
              <p style={{ fontSize: '14px', lineHeight: 1.8, color: 'rgba(10,10,10,0.6)', fontWeight: 400, margin: '0 0 28px' }}>{p.body}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px' }}>
                {p.detail.map(d => (
                  <li key={d} style={{ fontSize: '13px', color: 'rgba(10,10,10,0.7)', fontWeight: 400, lineHeight: 2.1, borderTop: '1px solid rgba(10,10,10,0.08)', padding: '10px 0' }}>{d}</li>
                ))}
              </ul>
              <Link href={p.href} style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0A0A0A', textDecoration: 'none', borderBottom: '1px solid #0A0A0A', paddingBottom: '3px' }}>
                Daha fazla bilgi &rarr;
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: '#0A0A0A', color: '#FAFAF9', padding: '120px 40px' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.16em', color: 'rgba(250,250,249,0.5)', fontWeight: 600, marginBottom: '48px' }}>NEDEN GENEL AMACLI BIR ASISTAN DEGIL</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '48px' }}>
            {[
              ['Mesleginizin dilini konusur', 'Bir avukata KVKK madde numarasi sormak ile bir doktora ilac dozu sormak ayni sey degil.'],
              ['Her seansta biraz daha sizi tanir', '10. seansta, tercihlerinizi sormadan bilir.'],
              ['Turkiyede, Turkiye icin', 'KVKK uyumlu, Turkce mevzuat, yerel entegrasyonlar (SGK, GIB, Pabau).'],
            ].map(([t, d]) => (
              <div key={t}>
                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '10px', lineHeight: 1.3 }}>{t}</div>
                <div style={{ fontSize: '13px', color: 'rgba(250,250,249,0.55)', lineHeight: 1.7, fontWeight: 400 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '140px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(28px,3.6vw,44px)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.015em', margin: '0 0 36px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
          Mesleginizi secin, 15 gun ucretsiz deneyin.
        </h2>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {PROFESSIONS.map(p => (
            <Link key={p.id} href={p.href} style={{ padding: '13px 26px', border: '1px solid rgba(10,10,10,0.2)', color: '#0A0A0A', textDecoration: 'none', fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{p.label}</Link>
          ))}
        </div>
      </section>

      <footer style={{ padding: '36px 40px', borderTop: '1px solid rgba(10,10,10,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '13px', fontWeight: 700 }}>NOTYA</div>
        <div style={{ fontSize: '11px', color: 'rgba(10,10,10,0.4)' }}>&copy; 2026 Dream Turkiye &middot; KVKK Uyumlu</div>
      </footer>

    </main>
  )
}
