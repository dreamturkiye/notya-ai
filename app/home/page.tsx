'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, visible] as const
}

function Row({ n, color, title, body, href, cta, img, imgLeft }: { n: string; color: string; title: React.ReactNode; body: string; href: string; cta: string; img: string; imgLeft: boolean }) {
  const [ref, visible] = useReveal()
  const textCol = (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity .7s ease, transform .7s ease' }}>
      <div style={{ fontSize: '11px', letterSpacing: '0.14em', color, fontFamily: 'system-ui', fontWeight: 600, marginBottom: '18px' }}>{n}</div>
      <h2 style={{ fontSize: 'clamp(30px,3.4vw,44px)', fontWeight: 400, lineHeight: 1.12, letterSpacing: '-0.015em', margin: '0 0 22px' }}>{title}</h2>
      <p style={{ fontSize: '15px', lineHeight: 1.8, color: 'rgba(22,19,17,0.6)', fontFamily: 'system-ui', fontWeight: 300, margin: '0 0 28px', maxWidth: '440px' }}>{body}</p>
      <Link href={href} style={{ fontSize: '13px', fontWeight: 500, color: '#161311', textDecoration: 'none', fontFamily: 'system-ui', borderBottom: '1px solid #161311', paddingBottom: '2px' }}>{cta} &rarr;</Link>
    </div>
  )
  const imgCol = (
    <div style={{ borderRadius: '4px', overflow: 'hidden', aspectRatio: '4/5', opacity: visible ? 1 : 0, transform: visible ? 'scale(1)' : 'scale(1.06)', transition: 'opacity .9s ease, transform .9s ease' }}>
      <img src={img} alt='' style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.92)' }} />
    </div>
  )
  return (
    <div ref={ref} style={{ display: 'grid', gridTemplateColumns: imgLeft ? '0.85fr 1.15fr' : '1.15fr 0.85fr', gap: '56px', alignItems: 'center', marginBottom: '116px', paddingBottom: '116px', borderBottom: '1px solid rgba(22,19,17,0.08)' }}>
      {imgLeft ? <>{imgCol}{textCol}</> : <>{textCol}{imgCol}</>}
    </div>
  )
}

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <main style={{ margin: 0, padding: 0, background: '#FBFAF8', color: '#161311', fontFamily: "'Newsreader','Georgia',serif", minHeight: '100vh', overflowX: 'hidden' }}>

      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: scrolled ? '16px 56px' : '22px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: scrolled ? 'rgba(251,250,248,0.92)' : 'rgba(251,250,248,0.0)', backdropFilter: scrolled ? 'blur(12px)' : 'none', borderBottom: scrolled ? '1px solid rgba(22,19,17,0.07)' : '1px solid transparent', transition: 'all .35s ease' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '0.02em', fontFamily: 'system-ui' }}>Notya</div>
        <div style={{ display: 'flex', gap: '36px', alignItems: 'center' }}>
          <a href='#meslekler' style={{ color: 'rgba(22,19,17,0.55)', fontSize: '13px', textDecoration: 'none', fontFamily: 'system-ui' }}>Meslekler</a>
          <a href='#neden' style={{ color: 'rgba(22,19,17,0.55)', fontSize: '13px', textDecoration: 'none', fontFamily: 'system-ui' }}>Neden Notya</a>
          <Link href='/giris' style={{ color: '#161311', fontSize: '13px', fontWeight: 500, textDecoration: 'none', fontFamily: 'system-ui', borderBottom: '1px solid #161311', paddingBottom: '2px' }}>Giris</Link>
        </div>
      </nav>

      <section style={{ minHeight: '92vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '120px 56px 60px', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ fontSize: '12px', letterSpacing: '0.14em', color: '#8A6D3B', fontFamily: 'system-ui', marginBottom: '28px', fontWeight: 500 }}>DOKTOR &middot; MALI MUSAVIR &middot; AVUKAT</div>
        <h1 style={{ fontSize: 'clamp(52px,8.4vw,132px)', fontWeight: 400, lineHeight: 0.96, letterSpacing: '-0.03em', margin: '0 0 40px' }}>
          Genel amacli<br/>
          <span style={{ fontStyle: 'italic', color: '#8A6D3B' }}>bir asistan</span><br/>
          degil.
        </h1>
        <p style={{ fontSize: '17px', lineHeight: 1.75, color: 'rgba(22,19,17,0.6)', maxWidth: '480px', fontFamily: 'system-ui', fontWeight: 300, margin: 0 }}>
          Notya, uc farkli meslegin gercek isyukunu — SOAP notundan sure takibine, bordro hesabindan ictihat aramasina — tek tek ogrenerek insa edildi.
        </p>
      </section>

      <section id='meslekler' style={{ maxWidth: '1180px', margin: '0 auto', padding: '80px 56px 20px' }}>
        <Row n='01 &mdash; DOKTOR' color='#2563EB' imgLeft
          title={<>Nelson'i, Braunwald'i ezbere<br/>bilen bir asistan.</>}
          body="Sesli danisma, otomatik SOAP notu, ICD-10 kodlama, ilac etkilesim kontrolu. 50 hastadan sonra yorgun oldugunuzda bile o hic yorulmaz."
          href='/doktor' cta='Doktor asistanini gorun'
          img='/doctors/dr_ayse.jpg' />
        <Row n='02 &mdash; MALI MUSAVIR' color='#0F7A5C'
          title={<>Beyan takviminizi sizden<br/>once hatirlar.</>}
          body="Bordro hesap motoru, MASAK uyum kontrolu, GIB e-Beyan entegrasyonu, musteri portali. 2026 vergi parametreleriyle guncel."
          href='/mali' cta='Mali musavir asistanini gorun'
          img='https://images.unsplash.com/photo-1768055104895-e6185762f2a9?fm=jpg&q=80&w=1200&auto=format&fit=crop' />
        <Row n='03 &mdash; AVUKAT' color='#7C3AED' imgLeft
          title={<>Bir sure kacirmak,<br/>bir daha olmaz.</>}
          body="9 hukuk dalinda uzman persona, otomatik dilekce olusturma, HMK/CMK/IIK sure hesaplama, Yargitay ictihat aramasi."
          href='/avukat' cta='Avukat asistanini gorun'
          img='https://images.unsplash.com/photo-1521587760476-6c12a4b040da?fm=jpg&q=80&w=1200&auto=format&fit=crop' />
      </section>

      <section id='neden' style={{ background: '#161311', color: '#FBFAF8', padding: '120px 56px' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.14em', color: '#C9A876', fontFamily: 'system-ui', fontWeight: 600, marginBottom: '24px' }}>NEDEN GENEL AMACLI BIR ASISTAN DEGIL</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '48px' }}>
            {[
              ['Mesleginizin dilini konusur', 'Bir avukata KVKK madde numarasi sormak ile bir doktora ilac dozu sormak ayni sey degil. Her persona kendi mevzuatinda egitildi.'],
              ['Her seansta biraz daha sizi tanir', '10. seansta, tercihlerinizi sormadan bilir. Ilk seansta sordugu soruyu bir daha sormaz.'],
              ['Turkiye\'de, Turkiye icin', 'KVKK uyumlu, Turkce mevzuat, yerel entegrasyonlar (SGK, GIB, Pabau). Ithal bir urun degil.'],
            ].map(([t, d]) => (
              <div key={t as string}>
                <div style={{ fontSize: '17px', fontWeight: 500, fontFamily: 'system-ui', marginBottom: '12px', lineHeight: 1.3 }}>{t}</div>
                <div style={{ fontSize: '14px', color: 'rgba(251,250,248,0.55)', fontFamily: 'system-ui', lineHeight: 1.75, fontWeight: 300 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '160px 56px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(36px,5.2vw,68px)', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.025em', margin: '0 0 40px', maxWidth: '680px', marginLeft: 'auto', marginRight: 'auto' }}>
          Mesleginizi secin,<br/><span style={{ fontStyle: 'italic', color: '#8A6D3B' }}>15 gun ucretsiz deneyin.</span>
        </h2>
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href='/doktor' style={{ padding: '13px 28px', border: '1px solid rgba(22,19,17,0.18)', borderRadius: '2px', color: '#161311', textDecoration: 'none', fontSize: '13px', fontFamily: 'system-ui', fontWeight: 500 }}>Doktor</Link>
          <Link href='/mali' style={{ padding: '13px 28px', border: '1px solid rgba(22,19,17,0.18)', borderRadius: '2px', color: '#161311', textDecoration: 'none', fontSize: '13px', fontFamily: 'system-ui', fontWeight: 500 }}>Mali Musavir</Link>
          <Link href='/avukat' style={{ padding: '13px 28px', border: '1px solid rgba(22,19,17,0.18)', borderRadius: '2px', color: '#161311', textDecoration: 'none', fontSize: '13px', fontFamily: 'system-ui', fontWeight: 500 }}>Avukat</Link>
        </div>
      </section>

      <footer style={{ padding: '40px 56px', borderTop: '1px solid rgba(22,19,17,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'system-ui', color: 'rgba(22,19,17,0.7)' }}>Notya</div>
        <div style={{ fontSize: '11px', color: 'rgba(22,19,17,0.4)', fontFamily: 'system-ui' }}>&copy; 2026 Dream Turkiye &middot; KVKK Uyumlu &middot; Frankfurt, EU</div>
      </footer>

    </main>
  )
}
