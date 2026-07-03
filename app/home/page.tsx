'use client'
import Link from 'next/link'

export default function HomePage() {
  return (
    <main style={{margin:0,padding:0,background:'#FBFAF8',color:'#161311',fontFamily:"'Newsreader','Georgia',serif",minHeight:'100vh',overflowX:'hidden'}}>

      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,padding:'22px 56px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'rgba(251,250,248,0.88)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(22,19,17,0.07)'}}>
        <div style={{fontSize:'15px',fontWeight:600,letterSpacing:'0.02em',fontFamily:'system-ui'}}>Notya</div>
        <div style={{display:'flex',gap:'36px',alignItems:'center'}}>
          <a href='#meslekler' style={{color:'rgba(22,19,17,0.55)',fontSize:'13px',textDecoration:'none',fontFamily:'system-ui'}}>Meslekler</a>
          <a href='#neden' style={{color:'rgba(22,19,17,0.55)',fontSize:'13px',textDecoration:'none',fontFamily:'system-ui'}}>Neden Notya</a>
          <Link href='/giris' style={{color:'#161311',fontSize:'13px',fontWeight:500,textDecoration:'none',fontFamily:'system-ui',borderBottom:'1px solid #161311',paddingBottom:'2px'}}>Giris</Link>
        </div>
      </nav>

      <section style={{padding:'168px 56px 96px',maxWidth:'1180px',margin:'0 auto'}}>
        <div style={{display:'grid',gridTemplateColumns:'1.3fr 1fr',gap:'64px',alignItems:'end'}}>
          <div>
            <div style={{fontSize:'12px',letterSpacing:'0.12em',color:'#8A6D3B',fontFamily:'system-ui',marginBottom:'22px',fontWeight:500}}>DOKTOR &middot; MALI MUSAVIR &middot; AVUKAT</div>
            <h1 style={{fontSize:'clamp(38px,5.2vw,64px)',fontWeight:400,lineHeight:1.06,letterSpacing:'-0.02em',margin:'0 0 28px'}}>
              Turkiye'de her uzmanlik<br/>alaninin kendi asistani yok.<br/>
              <span style={{fontStyle:'italic',color:'#8A6D3B'}}>Bizimki var.</span>
            </h1>
          </div>
          <div style={{paddingBottom:'8px'}}>
            <p style={{fontSize:'16px',lineHeight:1.75,color:'rgba(22,19,17,0.62)',fontFamily:'system-ui',fontWeight:300,margin:0}}>
              Genel amacli bir sohbet botu degil. Notya, uc farkli meslegin gercek isyukunu — SOAP notundan sure takibine, bordro hesabindan ictihat aramasina — tek tek ogrenerek insa edildi.
            </p>
          </div>
        </div>
      </section>

      <section id='meslekler' style={{maxWidth:'1180px',margin:'0 auto',padding:'0 56px 140px'}}>

        <div style={{display:'grid',gridTemplateColumns:'0.85fr 1.15fr',gap:'56px',alignItems:'center',marginBottom:'128px',paddingBottom:'128px',borderBottom:'1px solid rgba(22,19,17,0.08)'}}>
          <div style={{borderRadius:'4px',overflow:'hidden',aspectRatio:'4/5'}}>
            <img src='/doctors/dr_ayse.jpg' alt='Doktor' style={{width:'100%',height:'100%',objectFit:'cover',filter:'saturate(0.92)'}} />
          </div>
          <div>
            <div style={{fontSize:'11px',letterSpacing:'0.14em',color:'#2563EB',fontFamily:'system-ui',fontWeight:600,marginBottom:'18px'}}>01 &mdash; DOKTOR</div>
            <h2 style={{fontSize:'clamp(28px,3.2vw,40px)',fontWeight:400,lineHeight:1.15,letterSpacing:'-0.015em',margin:'0 0 20px'}}>
              Nelson'i, Braunwald'i ezbere<br/>bilen bir asistan.
            </h2>
            <p style={{fontSize:'15px',lineHeight:1.8,color:'rgba(22,19,17,0.6)',fontFamily:'system-ui',fontWeight:300,margin:'0 0 28px',maxWidth:'440px'}}>
              Sesli danisma, otomatik SOAP notu, ICD-10 kodlama, ilac etkilesim kontrolu. 50 hastadan sonra yorgun oldugunuzda bile o hic yorulmaz.
            </p>
            <Link href='/doktor' style={{fontSize:'13px',fontWeight:500,color:'#161311',textDecoration:'none',fontFamily:'system-ui',borderBottom:'1px solid #161311',paddingBottom:'2px'}}>
              Doktor asistanini gorun &rarr;
            </Link>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1.15fr 0.85fr',gap:'56px',alignItems:'center',marginBottom:'128px',paddingBottom:'128px',borderBottom:'1px solid rgba(22,19,17,0.08)'}}>
          <div style={{order:1}}>
            <div style={{fontSize:'11px',letterSpacing:'0.14em',color:'#0F7A5C',fontFamily:'system-ui',fontWeight:600,marginBottom:'18px'}}>02 &mdash; MALI MUSAVIR</div>
            <h2 style={{fontSize:'clamp(28px,3.2vw,40px)',fontWeight:400,lineHeight:1.15,letterSpacing:'-0.015em',margin:'0 0 20px'}}>
              Beyan takviminizi sizden<br/>once hatirlar.
            </h2>
            <p style={{fontSize:'15px',lineHeight:1.8,color:'rgba(22,19,17,0.6)',fontFamily:'system-ui',fontWeight:300,margin:'0 0 28px',maxWidth:'440px'}}>
              Bordro hesap motoru, MASAK uyum kontrolu, GIB e-Beyan entegrasyonu, musteri portali. 2026 vergi parametreleriyle guncel.
            </p>
            <Link href='/mali' style={{fontSize:'13px',fontWeight:500,color:'#161311',textDecoration:'none',fontFamily:'system-ui',borderBottom:'1px solid #161311',paddingBottom:'2px'}}>
              Mali musavir asistanini gorun &rarr;
            </Link>
          </div>
          <div style={{order:2,borderRadius:'4px',overflow:'hidden',aspectRatio:'4/5'}}>
            <img src='https://images.unsplash.com/photo-1768055104895-e6185762f2a9?fm=jpg&q=80&w=1200&auto=format&fit=crop' alt='Mali Musavir' style={{width:'100%',height:'100%',objectFit:'cover',filter:'saturate(0.92)'}} />
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'0.85fr 1.15fr',gap:'56px',alignItems:'center'}}>
          <div style={{borderRadius:'4px',overflow:'hidden',aspectRatio:'4/5'}}>
            <img src='https://images.unsplash.com/photo-1521587760476-6c12a4b040da?fm=jpg&q=80&w=1200&auto=format&fit=crop' alt='Avukat' style={{width:'100%',height:'100%',objectFit:'cover',filter:'saturate(0.92)'}} />
          </div>
          <div>
            <div style={{fontSize:'11px',letterSpacing:'0.14em',color:'#7C3AED',fontFamily:'system-ui',fontWeight:600,marginBottom:'18px'}}>03 &mdash; AVUKAT</div>
            <h2 style={{fontSize:'clamp(28px,3.2vw,40px)',fontWeight:400,lineHeight:1.15,letterSpacing:'-0.015em',margin:'0 0 20px'}}>
              Bir sure kacirmak,<br/>bir daha olmaz.
            </h2>
            <p style={{fontSize:'15px',lineHeight:1.8,color:'rgba(22,19,17,0.6)',fontFamily:'system-ui',fontWeight:300,margin:'0 0 28px',maxWidth:'440px'}}>
              9 hukuk dalinda uzman persona, otomatik dilekce olusturma, HMK/CMK/IIK sure hesaplama, Yargitay ictihat aramasi.
            </p>
            <Link href='/avukat' style={{fontSize:'13px',fontWeight:500,color:'#161311',textDecoration:'none',fontFamily:'system-ui',borderBottom:'1px solid #161311',paddingBottom:'2px'}}>
              Avukat asistanini gorun &rarr;
            </Link>
          </div>
        </div>

      </section>

      <section id='neden' style={{background:'#161311',color:'#FBFAF8',padding:'120px 56px'}}>
        <div style={{maxWidth:'1180px',margin:'0 auto'}}>
          <div style={{fontSize:'11px',letterSpacing:'0.14em',color:'#C9A876',fontFamily:'system-ui',fontWeight:600,marginBottom:'24px'}}>NEDEN GENEL AMACLI BIR ASISTAN DEGIL</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'48px'}}>
            {[
              ['Mesleginizin dilini konusur','Bir avukata KVKK madde numarasi sormak ile bir doktora ilac dozu sormak ayni sey degil. Her persona kendi mevzuatinda egitildi.'],
              ['Her seansta biraz daha sizi tanir','10. seansta, tercihlerinizi sormadan bilir. Ilk seansta sordugu soruyu bir daha sormaz.'],
              ['Turkiye\'de, Turkiye icin','KVKK uyumlu, Turkce mevzuat, yerel entegrasyonlar (SGK, GIB, Pabau). Ithal bir urun degil.'],
            ].map(([t,d]) => (
              <div key={t as string}>
                <div style={{fontSize:'17px',fontWeight:500,fontFamily:'system-ui',marginBottom:'12px',lineHeight:1.3}}>{t}</div>
                <div style={{fontSize:'14px',color:'rgba(251,250,248,0.55)',fontFamily:'system-ui',lineHeight:1.75,fontWeight:300}}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{padding:'140px 56px',textAlign:'center'}}>
        <h2 style={{fontSize:'clamp(32px,4.2vw,52px)',fontWeight:400,lineHeight:1.15,letterSpacing:'-0.02em',margin:'0 0 36px',maxWidth:'640px',marginLeft:'auto',marginRight:'auto'}}>
          Mesleginizi secin,<br/><span style={{fontStyle:'italic',color:'#8A6D3B'}}>15 gun ucretsiz deneyin.</span>
        </h2>
        <div style={{display:'flex',gap:'14px',justifyContent:'center',flexWrap:'wrap'}}>
          <Link href='/doktor' style={{padding:'13px 28px',border:'1px solid rgba(22,19,17,0.18)',borderRadius:'2px',color:'#161311',textDecoration:'none',fontSize:'13px',fontFamily:'system-ui',fontWeight:500}}>Doktor</Link>
          <Link href='/mali' style={{padding:'13px 28px',border:'1px solid rgba(22,19,17,0.18)',borderRadius:'2px',color:'#161311',textDecoration:'none',fontSize:'13px',fontFamily:'system-ui',fontWeight:500}}>Mali Musavir</Link>
          <Link href='/avukat' style={{padding:'13px 28px',border:'1px solid rgba(22,19,17,0.18)',borderRadius:'2px',color:'#161311',textDecoration:'none',fontSize:'13px',fontFamily:'system-ui',fontWeight:500}}>Avukat</Link>
        </div>
      </section>

      <footer style={{padding:'40px 56px',borderTop:'1px solid rgba(22,19,17,0.08)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontSize:'14px',fontWeight:600,fontFamily:'system-ui',color:'rgba(22,19,17,0.7)'}}>Notya</div>
        <div style={{fontSize:'11px',color:'rgba(22,19,17,0.4)',fontFamily:'system-ui'}}>&copy; 2026 Dream Turkiye &middot; KVKK Uyumlu &middot; Frankfurt, EU</div>
      </footer>

    </main>
  )
}
