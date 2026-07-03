'use client'
import Link from 'next/link'

const PROFESSIONS = [
  {
    id: 'doktor',
    href: '/doktor',
    label: 'Doktor',
    tagline: 'Cebinizdeki Uzman Doktor',
    desc: 'Nelson, Braunwald, Harrison bilgisiyle sesli danisma, SOAP notlari, ICD-10 kodlama.',
    color: '#2563EB',
    bg: '#EEF4FF',
    emoji: '\u{1FA7A}',
  },
  {
    id: 'mali',
    href: '/mali',
    label: 'Mali Musavir',
    tagline: 'Cebinizdeki Mali Musavir',
    desc: 'Bordro hesaplama, beyan takvimi, MASAK uyum, musteri portali.',
    color: '#059669',
    bg: '#ECFDF5',
    emoji: '\u{1F4CA}',
  },
  {
    id: 'avukat',
    href: '/avukat',
    label: 'Avukat',
    tagline: 'Cebinizdeki Hukuk Asistani',
    desc: 'Dilekce olusturma, sure takibi, ictihat arama, muvekkil portali.',
    color: '#7C3AED',
    bg: '#F3E8FF',
    emoji: '\u{2696}\u{FE0F}',
  },
]

export default function HomePage() {
  return (
    <main style={{margin:0,padding:0,background:'#FFFAFA',color:'#0A1628',fontFamily:"'Georgia','Times New Roman',serif",minHeight:'100vh',overflowX:'hidden'}}>

      <nav style={{padding:'24px 48px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid rgba(10,22,40,0.08)'}}>
        <div style={{fontSize:'19px',fontWeight:'400',letterSpacing:'0.18em',color:'#0A1628'}}>
          NOTYA<span style={{color:'#2563EB'}}>.</span>AI
        </div>
        <Link href='/giris' style={{padding:'9px 22px',border:'1px solid rgba(10,22,40,0.2)',borderRadius:'2px',color:'rgba(10,22,40,0.85)',fontSize:'12px',letterSpacing:'0.1em',textDecoration:'none',textTransform:'uppercase',fontFamily:'system-ui',background:'rgba(10,22,40,0.06)'}}>
          Giris
        </Link>
      </nav>

      <section style={{padding:'120px 48px 80px',textAlign:'center',maxWidth:'900px',margin:'0 auto'}}>
        <div style={{fontSize:'10px',letterSpacing:'0.35em',textTransform:'uppercase',color:'#2563EB',marginBottom:'24px',fontFamily:'system-ui'}}>
          Turkiye'nin Ilk AI Meslek Asistani Ailesi
        </div>
        <h1 style={{fontSize:'clamp(40px,6vw,72px)',fontWeight:'400',lineHeight:'1.05',margin:'0 0 28px',letterSpacing:'-0.025em'}}>
          Mesleginize Ozel<br/>
          <em style={{color:'#2563EB',fontStyle:'italic'}}>Uzman Asistan.</em>
        </h1>
        <p style={{fontSize:'17px',lineHeight:'1.75',color:'rgba(10,22,40,0.6)',maxWidth:'560px',margin:'0 auto',fontFamily:'system-ui',fontWeight:'300'}}>
          Doktor, mali musavir veya avukat olun — Notya AI sizin dalinizda egitilmis, sizin diliniz konusan bir uzman asistanla calisir.
        </p>
      </section>

      <section style={{padding:'0 48px 140px',maxWidth:'1200px',margin:'0 auto'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'24px'}}>
          {PROFESSIONS.map(p => (
            <Link key={p.id} href={p.href} style={{textDecoration:'none',color:'inherit'}}>
              <div style={{background:'#fff',border:'1px solid rgba(10,22,40,0.1)',borderRadius:'16px',padding:'40px 32px',height:'100%',boxSizing:'border-box',transition:'transform .2s, box-shadow .2s',cursor:'pointer'}}>
                <div style={{width:'56px',height:'56px',borderRadius:'14px',background:p.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'26px',marginBottom:'24px'}}>{p.emoji}</div>
                <div style={{fontSize:'11px',letterSpacing:'0.15em',textTransform:'uppercase',color:p.color,fontFamily:'system-ui',marginBottom:'12px'}}>{p.label}</div>
                <div style={{fontSize:'24px',fontWeight:'400',fontFamily:"'Georgia',serif",marginBottom:'16px',lineHeight:'1.2'}}>{p.tagline}</div>
                <p style={{fontSize:'14px',lineHeight:'1.7',color:'rgba(10,22,40,0.55)',fontFamily:'system-ui',fontWeight:'300',margin:'0 0 24px'}}>{p.desc}</p>
                <div style={{fontSize:'12px',letterSpacing:'0.1em',textTransform:'uppercase',color:p.color,fontFamily:'system-ui',fontWeight:'500',display:'flex',alignItems:'center',gap:'8px'}}>
                  Kesfedin <span>&rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section style={{background:'#F4F0F0',padding:'100px 48px',borderTop:'1px solid rgba(10,22,40,0.06)',textAlign:'center'}}>
        <div style={{fontSize:'10px',letterSpacing:'0.3em',textTransform:'uppercase',color:'#2563EB',marginBottom:'20px',fontFamily:'system-ui'}}>
          Neden Notya
        </div>
        <h2 style={{fontSize:'clamp(32px,4vw,48px)',fontWeight:'400',lineHeight:'1.1',letterSpacing:'-0.025em',marginBottom:'48px',maxWidth:'700px',margin:'0 auto 48px'}}>
          Her Meslek Kendi<br/>
          <em style={{color:'rgba(10,22,40,0.7)',fontStyle:'italic'}}>Uzmanini Hakeder.</em>
        </h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'32px',maxWidth:'900px',margin:'0 auto',textAlign:'left'}}>
          {[
            ['Sesli Konusma','Buton yok, bekleme yok. Dogal, kesintisiz sesli diyalog.'],
            ['Ogrenen Sistem','Her seanstan ogrenir, tercihlerinizi hatirlar.'],
            ['KVKK Uyumlu','Turkiye lokasyonu, sifreli veri, meslek sirri korumasi.'],
          ].map(([t,d]) => (
            <div key={t}>
              <div style={{fontSize:'15px',fontWeight:'600',fontFamily:'system-ui',marginBottom:'8px'}}>{t}</div>
              <div style={{fontSize:'13px',color:'rgba(10,22,40,0.55)',fontFamily:'system-ui',lineHeight:'1.7'}}>{d}</div>
            </div>
          ))}
        </div>
      </section>

      <footer style={{padding:'36px 48px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontSize:'17px',letterSpacing:'0.18em',color:'rgba(10,22,40,0.4)',fontFamily:"'Georgia',serif"}}>
          NOTYA<span style={{color:'#2563EB'}}>.</span>AI
        </div>
        <div style={{fontSize:'11px',color:'rgba(10,22,40,0.45)',fontFamily:'system-ui'}}>
          © 2026 Dream Turkiye · KVKK Uyumlu · Frankfurt, EU
        </div>
      </footer>

    </main>
  )
}
