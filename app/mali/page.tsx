
import Link from "next/link"
export default function MaliPage() {
  const HERO_IMG    = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1600&q=80&fit=crop&crop=center"
  const CONSULT_IMG = "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=900&q=80&fit=crop&crop=top"
  const LEARNING_IMG= "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=900&q=80&fit=crop&crop=top"
  return (
    <main style={{margin:0,padding:0,background:"#F4F7F6",color:"#1F2937",fontFamily:"'Lato','Helvetica Neue',Arial,sans-serif",overflowX:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Merriweather:ital,wght@0,400;0,700;1,400&display=swap');
        * { box-sizing: border-box; }
        :root {
          --primary: #1B4332;
          --primary-dark: #0f2d20;
          --primary-light: #d8f3dc;
          --secondary: #F59E0B;
          --secondary-light: #FEF3C7;
          --accent: #FF6B4B;
          --bg: #F4F7F6;
          --surface: #FFFFFF;
          --text: #1F2937;
          --text-muted: #6B7280;
          --border: #E5EAE8;
        }
        .btn-primary { display:inline-block; padding:14px 36px; background:var(--accent); color:#fff; text-decoration:none; border-radius:6px; font-size:15px; font-weight:700; letter-spacing:.03em; font-family:'Lato',sans-serif; transition:background .2s,transform .15s; box-shadow:0 4px 14px rgba(255,107,75,.35); }
        .btn-primary:hover { background:#e5573a; transform:translateY(-1px); }
        .btn-secondary { display:inline-block; padding:13px 32px; background:transparent; color:var(--primary); text-decoration:none; border-radius:6px; font-size:15px; font-weight:700; border:2px solid var(--primary); font-family:'Lato',sans-serif; transition:all .2s; }
        .btn-secondary:hover { background:var(--primary); color:#fff; }
        .section-label { font-size:11px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:var(--secondary); font-family:'Lato',sans-serif; margin-bottom:14px; display:flex; align-items:center; gap:8px; }
        .section-label::before { content:''; display:block; width:24px; height:2px; background:var(--secondary); }
        .card { background:var(--surface); border-radius:12px; border:1px solid var(--border); box-shadow:0 2px 12px rgba(27,67,50,.06); }
        .nav-link { color:var(--text-muted); font-size:14px; text-decoration:none; font-family:'Lato',sans-serif; transition:color .15s; }
        .nav-link:hover { color:var(--primary); }
        @media(max-width:768px) { .hero-grid { grid-template-columns:1fr !important; } .feature-grid { grid-template-columns:1fr !important; } .pricing-grid { grid-template-columns:1fr !important; } .trust-bar { flex-wrap:wrap !important; gap:16px !important; } .hide-mobile { display:none !important; } }
      `}</style>

      {/* NAV */}
      <nav style={{background:"var(--surface)",borderBottom:"1px solid var(--border)",padding:"0 48px",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 8px rgba(27,67,50,.08)"}}>
        <div style={{maxWidth:"1200px",margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:"68px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <div style={{width:"34px",height:"34px",background:"var(--primary)",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{color:"#fff",fontSize:"16px",fontWeight:"700",fontFamily:"Merriweather,serif"}}>N</span>
            </div>
            <span style={{fontSize:"18px",fontWeight:"700",color:"var(--primary)",fontFamily:"Merriweather,serif",letterSpacing:"-0.01em"}}>Notya AI</span>
          </div>
          <div style={{display:"flex",gap:"32px",alignItems:"center"}} className="hide-mobile">
            <a href="#özellikler" className="nav-link">Özellikler</a>
            <a href="#hizmetler" className="nav-link">Hizmetler</a>
            <a href="#fiyatlar" className="nav-link">Fiyatlar</a>
          </div>
          <div style={{display:"flex",gap:"12px",alignItems:"center"}}>
            <Link href="/giris/mali" className="btn-secondary" style={{padding:"9px 22px",fontSize:"14px"}}>Giriş</Link>
            <Link href="/giris/mali" className="btn-primary" style={{padding:"9px 22px",fontSize:"14px"}}>Ücretsiz Deneyin</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{background:"var(--surface)",padding:"0 48px"}}>
        <div style={{maxWidth:"1200px",margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"64px",alignItems:"center",minHeight:"580px",padding:"64px 0"}} className="hero-grid">
          <div>
            <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"var(--secondary-light)",border:"1px solid rgba(245,158,11,.2)",borderRadius:"20px",padding:"6px 14px",marginBottom:"24px"}}>
              <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"var(--secondary)"}}></div>
              <span style={{fontSize:"12px",fontWeight:"700",color:"var(--secondary)",letterSpacing:".06em",textTransform:"uppercase",fontFamily:"Lato,sans-serif"}}>Türkiye'nin Ilk AI Mali Müşaviri</span>
            </div>
            <h1 style={{fontSize:"clamp(36px,4.5vw,56px)",fontWeight:"700",lineHeight:"1.1",margin:"0 0 20px",color:"var(--text)",fontFamily:"Merriweather,serif",letterSpacing:"-0.02em"}}>
              Cebinizdeki<br/>
              <span style={{color:"var(--primary)"}}>Uzman Mali</span><br/>
              Müşaviriniz.
            </h1>
            <p style={{fontSize:"18px",lineHeight:"1.75",color:"var(--text-muted)",margin:"0 0 36px",fontFamily:"Lato,sans-serif",fontWeight:"300",maxWidth:"460px"}}>
              VUK, KDV, GVK ve SGK mevzuatini ustunde tutan, beyan takvimlerini otomatik takip eden, her seanstan öğrenen AI mali müşavir.
            </p>
            <div style={{display:"flex",gap:"14px",alignItems:"center",flexWrap:"wrap",marginBottom:"40px"}}>
              <Link href="/giris/mali" className="btn-primary">Ücretsiz Başlayın</Link>
              <Link href="/giris/mali" className="btn-secondary">Demo Goruntule</Link>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"16px",paddingTop:"24px",borderTop:"1px solid var(--border)"}}>
              <div style={{display:"flex"}}>
                {["#1B4332","#F59E0B","#FF6B4B","#0891B2","#7C3AED"].map((c,i)=>(
                  <div key={i} style={{width:"34px",height:"34px",borderRadius:"50%",background:c,border:"2px solid #fff",marginLeft:i>0?"-10px":"0",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>💼</div>
                ))}
              </div>
              <div>
                <div style={{fontSize:"14px",fontWeight:"700",color:"var(--text)",fontFamily:"Lato,sans-serif"}}>Beta müşavirlerimiz aktif</div>
                <div style={{fontSize:"12px",color:"var(--text-muted)",fontFamily:"Lato,sans-serif"}}>"Beyan takvimini hic kaciranlar icin." - SMMM A.D.</div>
              </div>
            </div>
          </div>
          <div style={{position:"relative"}}>
            <div style={{borderRadius:"16px",overflow:"hidden",boxShadow:"0 20px 60px rgba(27,67,50,.15)"}}>
              <img src={HERO_IMG} alt="Mali müşavir" style={{width:"100%",height:"420px",objectFit:"cover",objectPosition:"center 25%",filter:"brightness(.95) saturate(.9)"}} />
              <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(27,67,50,.15),transparent 50%)",borderRadius:"16px"}} />
            </div>
            <div className="card" style={{position:"absolute",bottom:"-24px",left:"-24px",padding:"16px 20px",maxWidth:"280px",boxShadow:"0 8px 32px rgba(27,67,50,.12)"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px"}}>
                <div style={{width:"32px",height:"32px",borderRadius:"50%",background:"var(--secondary-light)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px"}}>👩‍💼</div>
                <div>
                  <div style={{fontSize:"12px",fontWeight:"700",color:"var(--text)",fontFamily:"Lato,sans-serif"}}>Uzm. Derya Yılmaz</div>
                  <div style={{fontSize:"10px",color:"var(--secondary)",fontFamily:"Lato,sans-serif",display:"flex",alignItems:"center",gap:"4px"}}>
                    <span style={{width:"6px",height:"6px",borderRadius:"50%",background:"var(--secondary)",display:"inline-block"}}></span>Dinliyor
                  </div>
                </div>
              </div>
              <div style={{fontSize:"12px",color:"var(--text)",fontFamily:"Lato,sans-serif",lineHeight:"1.6",background:"var(--primary-light)",padding:"8px 10px",borderRadius:"6px",borderLeft:"3px solid var(--primary)"}}>
                "KDV beyani icin son gun 3 gün kaldı — şimdi hazırlayalim mi?"
              </div>
            </div>
            <div className="card" style={{position:"absolute",top:"-16px",right:"-16px",padding:"10px 14px",boxShadow:"0 4px 16px rgba(245,158,11,.15)"}}>
              <div style={{fontSize:"10px",fontWeight:"700",color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:".06em",fontFamily:"Lato,sans-serif"}}>Mevzuat</div>
              <div style={{fontSize:"12px",fontWeight:"700",color:"var(--secondary)",fontFamily:"Lato,sans-serif"}}>VUK Md. 30 ✓</div>
              <div style={{fontSize:"11px",color:"var(--text-muted)",fontFamily:"Lato,sans-serif"}}>KDV Kanunu ✓</div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section style={{background:"var(--primary)",padding:"20px 48px"}}>
        <div style={{maxWidth:"1200px",margin:"0 auto",display:"flex",gap:"0",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}} className="trust-bar">
          {[["3,4 sa","Gunluk tasarruf"],["KDV Kanunu","Katma Değer"],["42%","Is gunu verimliligi"],["7 format","Belge destegi"],["SGK Mevzuati","Sosyal Güvenlik"],["KVKK Uyumlu","Veri Güvenliği"]].map(([title,sub],i)=>(
            <div key={title} style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px 24px",borderRight:i<5?"1px solid rgba(255,255,255,.2)":"none"}}>
              <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"rgba(255,255,255,.5)",flexShrink:0}}></div>
              <div>
                <div style={{fontSize:"13px",fontWeight:"700",color:"#fff",fontFamily:"Lato,sans-serif",whiteSpace:"nowrap"}}>{title}</div>
                <div style={{fontSize:"10px",color:"rgba(255,255,255,.6)",fontFamily:"Lato,sans-serif",letterSpacing:".06em",textTransform:"uppercase"}}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="özellikler" style={{padding:"100px 48px",background:"var(--bg)"}}>
        <div style={{maxWidth:"1200px",margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:"60px"}}>
            <div className="section-label" style={{justifyContent:"center"}}>Temel Özellikler</div>
            <h2 style={{fontSize:"clamp(30px,4vw,44px)",fontWeight:"700",fontFamily:"Merriweather,serif",letterSpacing:"-0.02em",color:"var(--text)",margin:"0 0 16px"}}>
              Mali Müşavirin Ihtiyaci Olan Her Sey<br/>
              <em style={{color:"var(--primary)",fontStyle:"italic"}}>Tek Yerde.</em>
            </h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"20px"}} className="feature-grid">
            {[
              {icon:"📅",color:"var(--primary)",bg:"var(--primary-light)",title:"Beyan Takvimi",desc:"KDV, muhtasar, kurumlar vergisi — tum beyan son gunleri otomatik takip. 3 gun kala Telegram uyarisi. Hic kacirilmaz.",badge:"Sifir beyan hatasi"},
              {icon:"💰",color:"var(--secondary)",bg:"var(--secondary-light)",title:"Bordro Hesaplama",desc:"SGK, vergi, net/brut hesaplama, asgari ucret guncellemeleri. Birden fazla calisan icin toplu bordro.",badge:"Anlik hesaplama"},
              {icon:"🏦",color:"#0891B2",bg:"#E0F7FA",title:"MASAK Uyum Motoru",desc:"Supheli islem tespiti, musteri risk skoru, MASAK bildirim taslagi. Uyum riskini minimize eder.",badge:"Risk tespiti"},
              {icon:"📤",color:"var(--accent)",bg:"#FFF0EC",title:"e-Beyan & e-Devlet",desc:"Beyan taslagi olustur, GIB format kontrolu yap, e-Devlet entegrasyon rehberi al. Gondermeye hazir.",badge:"GIB uyumlu"},
              {icon:"🔗",color:"#7C3AED",bg:"#F3E8FF",title:"Musteri Portali",desc:"Her musteri icin ozel link. Beyan durumu, belgeler, AI sorular. Telefon trafiginiz ciddi oranda azalir.",badge:"Self-servis musteri"},
              {icon:"🔐",color:"#1B4332",bg:"#d8f3dc",title:"KVKK Uyumlu",desc:"Tum musteri verileri AES-256 sifreleme ile Turkiye lokasyonunda. Mesleki gizlilik standartlarina tam uyum.",badge:"Veri guvenligi"},
            ].map(f=>(
              <div key={f.title} className="card" style={{padding:"28px"}}>
                <div style={{width:"48px",height:"48px",borderRadius:"12px",background:f.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px",marginBottom:"16px"}}>{f.icon}</div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px"}}>
                  <div style={{fontSize:"17px",fontWeight:"700",color:"var(--text)",fontFamily:"Merriweather,serif"}}>{f.title}</div>
                  <div style={{fontSize:"10px",fontWeight:"700",color:f.color,background:f.bg,padding:"3px 8px",borderRadius:"20px",fontFamily:"Lato,sans-serif",letterSpacing:".04em",whiteSpace:"nowrap"}}>{f.badge}</div>
                </div>
                <p style={{fontSize:"14px",color:"var(--text-muted)",lineHeight:"1.7",margin:0,fontFamily:"Lato,sans-serif"}}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONVERSATION DEMO */}
      <section style={{background:"var(--surface)",padding:"100px 48px"}}>
        <div style={{maxWidth:"1200px",margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"72px",alignItems:"center"}} className="feature-grid">
          <div>
            <div className="section-label">Sesli Konusma</div>
            <h2 style={{fontSize:"clamp(28px,3.5vw,42px)",fontWeight:"700",fontFamily:"Merriweather,serif",letterSpacing:"-0.02em",color:"var(--text)",margin:"0 0 20px",lineHeight:"1.15"}}>
              Iki Meslektaşlık<br/>
              <em style={{color:"var(--primary)",fontStyle:"italic"}}>Gibi Çalışın.</em>
            </h2>
            <div className="card" style={{padding:"20px",marginBottom:"24px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px",paddingBottom:"12px",borderBottom:"1px solid var(--border)"}}>
                <div style={{width:"36px",height:"36px",borderRadius:"50%",background:"var(--secondary-light)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px"}}>👩‍💼</div>
                <div>
                  <div style={{fontSize:"13px",fontWeight:"700",color:"var(--text)",fontFamily:"Lato,sans-serif"}}>Uzm. Derya Yılmaz</div>
                  <div style={{fontSize:"11px",color:"var(--secondary)",fontFamily:"Lato,sans-serif",display:"flex",alignItems:"center",gap:"4px"}}>
                    <span style={{width:"5px",height:"5px",borderRadius:"50%",background:"var(--secondary)",display:"inline-block"}}></span>Dinliyor
                  </div>
                </div>
              </div>
              {[
                {side:"right",text:"ABC Ltd icin Aralik KDV beyani hazır mi?"},
                {side:"left", text:"Henüz hazırlanmadi. Son gun 26 Ocak — 4 gün kaldı. Şimdi başlayalım mi?"},
                {side:"right",text:"Başlayalım."},
                {side:"left", text:"ABC Ltd Aralik donem KDV hesaplanmistir: Hesaplanan KDV 84.320 TL, indirilecek KDV 61.140 TL, odenmesi gereken 23.180 TL. Onayi verirseniz formu doldurayim."},
                {side:"right",text:"Onayla."},
                {side:"left", text:"Kaydedildi. Odeme hatırlatmasi 25 Ocak icin ayarlandı."},
              ].map((m,i)=>(
                <div key={i} style={{display:"flex",justifyContent:m.side==="right"?"flex-end":"flex-start",marginBottom:"8px"}}>
                  <div style={{maxWidth:"80%",padding:"8px 12px",borderRadius:m.side==="right"?"12px 12px 2px 12px":"12px 12px 12px 2px",background:m.side==="right"?"var(--primary)":"var(--bg)",color:m.side==="right"?"#fff":"var(--text)",fontSize:"12px",lineHeight:"1.5",fontFamily:"Lato,sans-serif"}}>{m.text}</div>
                </div>
              ))}
            </div>
            <Link href="/giris/mali" className="btn-primary">Şimdi Başlayın</Link>
          </div>
          <div style={{position:"relative"}}>
            <div style={{borderRadius:"16px",overflow:"hidden",boxShadow:"0 20px 60px rgba(27,67,50,.12)"}}>
              <img src={CONSULT_IMG} alt="Mali müşavir calisiyor" style={{width:"100%",height:"480px",objectFit:"cover",filter:"brightness(.95) saturate(.85)"}} />
            </div>
            <div className="card" style={{position:"absolute",bottom:"24px",right:"-20px",padding:"14px 18px",boxShadow:"0 8px 24px rgba(245,158,11,.15)",borderLeft:"4px solid var(--secondary)"}}>
              <div style={{fontSize:"11px",color:"var(--text-muted)",fontFamily:"Lato,sans-serif",marginBottom:"4px"}}>Otomatik Tespit</div>
              <div style={{fontSize:"13px",fontWeight:"700",color:"var(--text)",fontFamily:"Lato,sans-serif"}}>⚠️ Beyan son gunu yaklasıyor</div>
              <div style={{fontSize:"11px",color:"var(--secondary)",fontFamily:"Lato,sans-serif",marginTop:"3px"}}>VUK Md. 30 referans alindi ✓</div>
            </div>
          </div>
        </div>
      </section>

      {/* LEARNING */}
      <section style={{background:"var(--bg)",padding:"100px 48px"}}>
        <div style={{maxWidth:"1200px",margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"72px",alignItems:"center"}} className="feature-grid">
          <div style={{position:"relative"}}>
            <div style={{borderRadius:"16px",overflow:"hidden",boxShadow:"0 20px 60px rgba(27,67,50,.12)"}}>
              <img src={LEARNING_IMG} alt="Öğrenen sistem" style={{width:"100%",height:"460px",objectFit:"cover",filter:"brightness(.9) saturate(.8)"}} />
            </div>
          </div>
          <div>
            <div className="section-label">Öğrenen Sistem</div>
            <h2 style={{fontSize:"clamp(28px,3.5vw,42px)",fontWeight:"700",fontFamily:"Merriweather,serif",letterSpacing:"-0.02em",color:"var(--text)",margin:"0 0 20px",lineHeight:"1.15"}}>
              5 Seanstan Sonra<br/>
              <em style={{color:"var(--primary)",fontStyle:"italic"}}>Yıllarca Birliktesiniz.</em>
            </h2>
            <p style={{fontSize:"16px",color:"var(--text-muted)",lineHeight:"1.8",margin:"0 0 32px",fontFamily:"Lato,sans-serif"}}>
              Her müşteri tercihini hatirlar. Her aciklama stilinizi ogrenir. 1. seans ile 5. seans arasindaki fark gece ile gunduz gibidir.
            </p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"32px"}}>
              <div className="card" style={{padding:"16px"}}>
                <div style={{fontSize:"10px",fontWeight:"700",color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:".1em",fontFamily:"Lato,sans-serif",marginBottom:"10px"}}>1. Seans</div>
                <div style={{fontSize:"12px",color:"var(--text-muted)",fontFamily:"Lato,sans-serif",fontStyle:"italic",marginBottom:"6px"}}>"ABC Ltd KDV yaz."</div>
                <div style={{fontSize:"12px",color:"var(--text)",background:"var(--bg)",padding:"8px",borderRadius:"6px",fontFamily:"Lato,sans-serif",lineHeight:"1.5"}}>Hangi donem icin yazayim?</div>
              </div>
              <div style={{background:"var(--primary)",borderRadius:"12px",padding:"16px",position:"relative"}}>
                <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",background:"var(--secondary)",color:"#fff",fontSize:"9px",fontWeight:"700",padding:"3px 10px",borderRadius:"0 0 8px 8px",letterSpacing:".06em",fontFamily:"Lato,sans-serif"}}>5. SEANS</div>
                <div style={{fontSize:"12px",color:"rgba(255,255,255,.7)",fontFamily:"Lato,sans-serif",fontStyle:"italic",marginTop:"16px",marginBottom:"6px"}}>"ABC Ltd KDV yaz."</div>
                <div style={{fontSize:"12px",color:"#fff",background:"rgba(255,255,255,.12)",padding:"8px",borderRadius:"6px",fontFamily:"Lato,sans-serif",lineHeight:"1.5"}}>Aralik donemi mi? ABC Ltd icin standart aciklamayla Amavera formatinda yaziyorum — dogru mu?</div>
                <div style={{fontSize:"11px",color:"rgba(255,255,255,.5)",fontFamily:"Lato,sans-serif",marginTop:"6px",fontStyle:"italic"}}>Sormadınız — hatirladi.</div>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              {["Müşteri bazinda tercih ettiginiz aciklama stilini hatirlar","Her seans beyan donemini otomatik tahmin eder","Sik yaptiginiz islemleri one ozerir","Vergi risklerini müşteri bazinda takip eder"].map(item=>(
                <div key={item} style={{display:"flex",alignItems:"center",gap:"10px",fontSize:"14px",color:"var(--text-muted)",fontFamily:"Lato,sans-serif"}}>
                  <div style={{width:"20px",height:"20px",borderRadius:"50%",background:"var(--secondary-light)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"var(--secondary)",fontSize:"10px",fontWeight:"700"}}>✓</div>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="hizmetler" style={{background:"var(--primary)",padding:"80px 48px"}}>
        <div style={{maxWidth:"1200px",margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:"48px"}}>
            <h2 style={{fontSize:"clamp(28px,3.5vw,42px)",fontWeight:"700",fontFamily:"Merriweather,serif",color:"#fff",margin:"0 0 16px",letterSpacing:"-0.02em"}}>Kapsadığı Mevzuat Alanları.</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"8px"}}>
            {[
              {emoji:"📊",label:"KDV",book:"KDV Kanunu"},
              {emoji:"💰",label:"Gelir Vergisi",book:"GVK"},
              {emoji:"🏢",label:"Kurumlar Vergisi",book:"KVK"},
              {emoji:"👷",label:"SGK / Bordro",book:"SGK Mevzuati"},
              {emoji:"📝",label:"Muhtasar",book:"VUK"},
              {emoji:"🤝",label:"Sozlesmeler",book:"TTK / TBK"},
              {emoji:"📈",label:"Muhasebe",book:"TFRS / TMS"},
              {emoji:"🔍",label:"Vergi Denetimi",book:"VUK Md. 134"},
              {emoji:"🏦",label:"Finans Analizi",book:"BDDK Mevzuati"},
              {emoji:"🌍",label:"Uluslararasi",book:"Coklu Anlasma"},
            ].map(s=>(
              <div key={s.label} style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.15)",borderRadius:"10px",padding:"16px 12px",textAlign:"center"}}>
                <div style={{fontSize:"24px",marginBottom:"6px"}}>{s.emoji}</div>
                <div style={{fontSize:"12px",fontWeight:"700",color:"#fff",fontFamily:"Lato,sans-serif",marginBottom:"4px"}}>{s.label}</div>
                <div style={{fontSize:"10px",color:"rgba(255,255,255,.5)",fontFamily:"Lato,sans-serif"}}>{s.book}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="fiyatlar" style={{background:"var(--surface)",padding:"100px 48px"}}>
        <div style={{maxWidth:"900px",margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:"52px"}}>
            <div className="section-label" style={{justifyContent:"center"}}>Fiyatlandırma</div>
            <h2 style={{fontSize:"clamp(28px,3.5vw,42px)",fontWeight:"700",fontFamily:"Merriweather,serif",color:"var(--text)",letterSpacing:"-0.02em"}}>Sade. Şeffaf. Adil.</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px"}} className="pricing-grid">
            {[
              {name:"Başlangıç",price:"499 TL",orig:"799 TL",features:["30 aktif musteri","Sinirsiz belge yukleme","Beyan takvimi","Bordro hesaplama","Telegram uyarilari"],highlight:false,cta:"Başlayın"},
              {name:"Pro",price:"999 TL",orig:"1.599 TL",features:["Sinirsiz seans","Sinirsiz musteri","Bordro + MASAK + e-Beyan","Musteri portali","Otomatik raporlar","Oncelikli destek"],highlight:true,cta:"En Popüler"},
              {name:"Büro",price:"2.999 TL",orig:"4.999 TL",features:["Sinirsiz seans","5 kullanici","Takim paneli","Musteri portali","Tum ozellikler"],highlight:false,cta:"Başlayın"},
            ].map((plan)=>(
              <div key={plan.name} className="card" style={{padding:"32px 28px",position:"relative",border:plan.highlight?"2px solid var(--primary)":"1px solid var(--border)",boxShadow:plan.highlight?"0 8px 32px rgba(27,67,50,.15)":"none"}}>
                {plan.highlight && <div style={{position:"absolute",top:"-13px",left:"50%",transform:"translateX(-50%)",background:"var(--primary)",color:"#fff",fontSize:"11px",fontWeight:"700",padding:"4px 16px",borderRadius:"20px",fontFamily:"Lato,sans-serif",letterSpacing:".06em",whiteSpace:"nowrap"}}>EN POPULER</div>}
                <div style={{fontSize:"13px",fontWeight:"700",color:"var(--text-muted)",fontFamily:"Lato,sans-serif",letterSpacing:".06em",textTransform:"uppercase",marginBottom:"16px"}}>{plan.name}</div>
                <div style={{marginBottom:"8px",display:"flex",alignItems:"baseline",gap:"8px"}}>
                  <span style={{fontSize:"38px",fontWeight:"700",color:"var(--text)",fontFamily:"Merriweather,serif"}}>{plan.price}</span>
                  <span style={{fontSize:"13px",color:"var(--text-muted)",fontFamily:"Lato,sans-serif"}}>/ay</span>
                </div>
                <div style={{fontSize:"12px",color:"var(--text-muted)",fontFamily:"Lato,sans-serif",marginBottom:"24px"}}><span style={{textDecoration:"line-through"}}>{plan.orig}</span><span style={{color:"var(--secondary)",fontWeight:"700",marginLeft:"6px"}}>Kurucu fiyatı</span></div>
                <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"28px"}}>
                  {plan.features.map(f=>(<div key={f} style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"14px",color:"var(--text)",fontFamily:"Lato,sans-serif"}}><span style={{color:"var(--secondary)",fontWeight:"700"}}>✓</span>{f}</div>))}
                </div>
                <Link href="/giris/mali" style={{display:"block",padding:"13px",textAlign:"center",borderRadius:"6px",textDecoration:"none",fontSize:"14px",fontWeight:"700",fontFamily:"Lato,sans-serif",background:plan.highlight?"var(--accent)":"transparent",color:plan.highlight?"#fff":"var(--primary)",border:plan.highlight?"none":"2px solid var(--primary)",boxShadow:plan.highlight?"0 4px 14px rgba(255,107,75,.3)":"none"}}>{plan.cta}</Link>
              </div>
            ))}
          </div>
          <div style={{textAlign:"center",marginTop:"24px",fontSize:"13px",color:"var(--text-muted)",fontFamily:"Lato,sans-serif"}}>14 gün ücretsiz · Kredi kartı gerektirmez · Dilediğinizde iptal</div>
        </div>
      </section>

            <section id="tasarruf" style={{background:"var(--bg)",padding:"80px 48px"}}>
        <div style={{maxWidth:"1100px",margin:"0 auto"}}>
          <h2 style={{textAlign:"center",fontSize:"clamp(28px,3.5vw,42px)",fontWeight:"700",fontFamily:"Merriweather,serif",color:"var(--text)",marginBottom:"40px"}}>8 Saatlik Is Gununuzde<br/><em style={{color:"var(--primary)",fontStyle:"italic"}}>3 Saat 24 Dakika Geri Kazanin.</em></h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"14px",marginBottom:"36px"}}>
<div className="card" style={{padding:"18px",borderLeft:"4px solid var(--primary)"}}><div style={{fontSize:"26px",fontWeight:"700",color:"var(--primary)"}}>3,4 sa</div><div style={{fontSize:"12px",color:"var(--text-muted)",marginTop:"4px"}}>Gunluk tasarruf</div></div>
<div className="card" style={{padding:"18px",borderLeft:"4px solid #0891B2"}}><div style={{fontSize:"26px",fontWeight:"700",color:"#0891B2"}}>42%</div><div style={{fontSize:"12px",color:"var(--text-muted)",marginTop:"4px"}}>8 saatin kurtarilani</div></div>
<div className="card" style={{padding:"18px",borderLeft:"4px solid var(--primary)"}}><div style={{fontSize:"26px",fontWeight:"700",color:"var(--primary)"}}>72 sa</div><div style={{fontSize:"12px",color:"var(--text-muted)",marginTop:"4px"}}>Aylik kazanilan</div></div>
<div className="card" style={{padding:"18px",borderLeft:"4px solid var(--secondary)"}}><div style={{fontSize:"26px",fontWeight:"700",color:"var(--secondary)"}}>~9</div><div style={{fontSize:"12px",color:"var(--text-muted)",marginTop:"4px"}}>Ekstra portfoy</div></div>
</div>
<table style={{width:"100%",borderCollapse:"collapse",fontFamily:"Lato,sans-serif"}}><thead><tr style={{background:"var(--bg)",borderBottom:"1px solid var(--border)"}}><th style={{padding:"10px 16px",textAlign:"left",fontSize:"11px",color:"var(--text-muted)",textTransform:"uppercase"}}>Gorev</th><th style={{padding:"10px 12px",textAlign:"right",fontSize:"11px",color:"var(--text-muted)",textTransform:"uppercase"}}>Once</th><th style={{padding:"10px 12px",textAlign:"right",fontSize:"11px",color:"var(--text-muted)",textTransform:"uppercase"}}>Notya AI ile</th><th style={{padding:"10px 12px",textAlign:"center",fontSize:"11px",color:"var(--text-muted)",textTransform:"uppercase"}}>Kazanc</th></tr></thead><tbody>
<tr style={{background:"var(--surface)",borderBottom:"1px solid var(--border)"}}><td style={{padding:"10px 16px",fontSize:"13px",color:"var(--text)"}}>Belge siniflandirma + veri girisi</td><td style={{padding:"10px 12px",textAlign:"right",fontSize:"13px",color:"var(--text-muted)"}}>45 dk</td><td style={{padding:"10px 12px",textAlign:"right",fontSize:"13px",color:"#1D9E75",fontWeight:"700"}}>5 dk</td><td style={{padding:"10px 12px",textAlign:"center"}}><span style={{background:"var(--primary-light)",color:"#1B4332",padding:"2px 8px",borderRadius:"5px",fontSize:"12px",fontWeight:"700"}}>-40 dk</span></td></tr>
<tr style={{background:"#FAFBFA",borderBottom:"1px solid var(--border)"}}><td style={{padding:"10px 16px",fontSize:"13px",color:"var(--text)"}}>KDV / matrah aritmetik kontrolu</td><td style={{padding:"10px 12px",textAlign:"right",fontSize:"13px",color:"var(--text-muted)"}}>20 dk</td><td style={{padding:"10px 12px",textAlign:"right",fontSize:"13px",color:"#1D9E75",fontWeight:"700"}}>0 dk</td><td style={{padding:"10px 12px",textAlign:"center"}}><span style={{background:"var(--primary-light)",color:"#1B4332",padding:"2px 8px",borderRadius:"5px",fontSize:"12px",fontWeight:"700"}}>-20 dk</span></td></tr>
<tr style={{background:"var(--surface)",borderBottom:"1px solid var(--border)"}}><td style={{padding:"10px 16px",fontSize:"13px",color:"var(--text)"}}>Z raporu kars banka mutabakati</td><td style={{padding:"10px 12px",textAlign:"right",fontSize:"13px",color:"var(--text-muted)"}}>60 dk</td><td style={{padding:"10px 12px",textAlign:"right",fontSize:"13px",color:"#1D9E75",fontWeight:"700"}}>8 dk</td><td style={{padding:"10px 12px",textAlign:"center"}}><span style={{background:"var(--primary-light)",color:"#1B4332",padding:"2px 8px",borderRadius:"5px",fontSize:"12px",fontWeight:"700"}}>-52 dk</span></td></tr>
<tr style={{background:"#FAFBFA",borderBottom:"1px solid var(--border)"}}><td style={{padding:"10px 16px",fontSize:"13px",color:"var(--text)"}}>Kira stopaj hesaplama</td><td style={{padding:"10px 12px",textAlign:"right",fontSize:"13px",color:"var(--text-muted)"}}>12 dk</td><td style={{padding:"10px 12px",textAlign:"right",fontSize:"13px",color:"#1D9E75",fontWeight:"700"}}>1 dk</td><td style={{padding:"10px 12px",textAlign:"center"}}><span style={{background:"var(--primary-light)",color:"#1B4332",padding:"2px 8px",borderRadius:"5px",fontSize:"12px",fontWeight:"700"}}>-11 dk</span></td></tr>
<tr style={{background:"var(--surface)",borderBottom:"1px solid var(--border)"}}><td style={{padding:"10px 16px",fontSize:"13px",color:"var(--text)"}}>Bordro hesaplama (SGK, net maas)</td><td style={{padding:"10px 12px",textAlign:"right",fontSize:"13px",color:"var(--text-muted)"}}>25 dk</td><td style={{padding:"10px 12px",textAlign:"right",fontSize:"13px",color:"#1D9E75",fontWeight:"700"}}>3 dk</td><td style={{padding:"10px 12px",textAlign:"center"}}><span style={{background:"var(--primary-light)",color:"#1B4332",padding:"2px 8px",borderRadius:"5px",fontSize:"12px",fontWeight:"700"}}>-22 dk</span></td></tr>
<tr style={{background:"#FAFBFA",borderBottom:"1px solid var(--border)"}}><td style={{padding:"10px 16px",fontSize:"13px",color:"var(--text)"}}>Beyan takvimi + hatirlatma</td><td style={{padding:"10px 12px",textAlign:"right",fontSize:"13px",color:"var(--text-muted)"}}>30 dk</td><td style={{padding:"10px 12px",textAlign:"right",fontSize:"13px",color:"#1D9E75",fontWeight:"700"}}>4 dk</td><td style={{padding:"10px 12px",textAlign:"center"}}><span style={{background:"var(--primary-light)",color:"#1B4332",padding:"2px 8px",borderRadius:"5px",fontSize:"12px",fontWeight:"700"}}>-26 dk</span></td></tr>
<tr style={{background:"var(--surface)",borderBottom:"1px solid var(--border)"}}><td style={{padding:"10px 16px",fontSize:"13px",color:"var(--text)"}}>Gorusme notu + arsivleme</td><td style={{padding:"10px 12px",textAlign:"right",fontSize:"13px",color:"var(--text-muted)"}}>15 dk</td><td style={{padding:"10px 12px",textAlign:"right",fontSize:"13px",color:"#1D9E75",fontWeight:"700"}}>3 dk</td><td style={{padding:"10px 12px",textAlign:"center"}}><span style={{background:"var(--primary-light)",color:"#1B4332",padding:"2px 8px",borderRadius:"5px",fontSize:"12px",fontWeight:"700"}}>-12 dk</span></td></tr>
<tr style={{background:"#FAFBFA",borderBottom:"1px solid var(--border)"}}><td style={{padding:"10px 16px",fontSize:"13px",color:"var(--text)"}}>MASAK / nakit limit kontrolu</td><td style={{padding:"10px 12px",textAlign:"right",fontSize:"13px",color:"var(--text-muted)"}}>10 dk</td><td style={{padding:"10px 12px",textAlign:"right",fontSize:"13px",color:"#1D9E75",fontWeight:"700"}}>1 dk</td><td style={{padding:"10px 12px",textAlign:"center"}}><span style={{background:"var(--primary-light)",color:"#1B4332",padding:"2px 8px",borderRadius:"5px",fontSize:"12px",fontWeight:"700"}}>-9 dk</span></td></tr>
<tr style={{background:"var(--surface)",borderBottom:"1px solid var(--border)"}}><td style={{padding:"10px 16px",fontSize:"13px",color:"var(--text)"}}>KDV ozeti + odeme hesaplama</td><td style={{padding:"10px 12px",textAlign:"right",fontSize:"13px",color:"var(--text-muted)"}}>20 dk</td><td style={{padding:"10px 12px",textAlign:"right",fontSize:"13px",color:"#1D9E75",fontWeight:"700"}}>1 dk</td><td style={{padding:"10px 12px",textAlign:"center"}}><span style={{background:"var(--primary-light)",color:"#1B4332",padding:"2px 8px",borderRadius:"5px",fontSize:"12px",fontWeight:"700"}}>-19 dk</span></td></tr>
<tr style={{background:"var(--primary)"}}><td style={{padding:"12px 16px",fontWeight:"700",color:"#fff",fontSize:"14px"}}>Toplam (tipik gun)</td><td style={{padding:"12px",textAlign:"right",color:"rgba(255,255,255,.7)",fontSize:"14px"}}>237 dk</td><td style={{padding:"12px",textAlign:"right",fontWeight:"700",color:"#5DCAA5",fontSize:"14px"}}>26 dk</td><td style={{padding:"12px",textAlign:"center"}}><span style={{background:"#d8f3dc",color:"#1B4332",padding:"3px 8px",borderRadius:"5px",fontWeight:"700"}}>-211 dk</span></td></tr></tbody></table>
<p style={{textAlign:"center",marginTop:"16px",fontSize:"13px",color:"var(--text-muted)",fontFamily:"Lato,sans-serif"}}>Ayda 72 saat = portfoyunuze yaklasik 9 ek musteri kapasitesi. Aylik 43.200 TL ek gelir potansiyeli.</p>
</div></section>
{/* FINAL CTA */}
      <section style={{background:"var(--primary-light)",padding:"80px 48px",borderTop:"2px solid var(--primary)",textAlign:"center"}}>
        <div className="section-label" style={{justifyContent:"center"}}>Başlamaya Hazır mısınız?</div>
        <h2 style={{fontSize:"clamp(30px,4vw,48px)",fontWeight:"700",fontFamily:"Merriweather,serif",color:"var(--text)",margin:"0 0 16px",letterSpacing:"-0.02em"}}>Bugün Başlayın.<br/><em style={{color:"var(--primary)",fontStyle:"italic"}}>İlk 14 Gün Ücretsiz.</em></h2>
        <p style={{fontSize:"17px",color:"var(--text-muted)",fontFamily:"Lato,sans-serif",margin:"0 0 36px",maxWidth:"420px",display:"inline-block",lineHeight:"1.75"}}>Kurucu üye fiyatını kaçırmayın. Ilk 100 SMMM icin gecerli.</p>
        <div><Link href="/giris/mali" className="btn-primary" style={{fontSize:"16px",padding:"16px 48px",boxShadow:"0 6px 20px rgba(255,107,75,.4)"}}>Ücretsiz Hesap Ac</Link></div>
        <div style={{marginTop:"16px",fontSize:"13px",color:"var(--text-muted)",fontFamily:"Lato,sans-serif"}}>KVKK uyumlu · Türkce destek · Dilediğinizde iptal</div>
      </section>

      {/* FOOTER */}
      <footer style={{background:"var(--text)",padding:"32px 48px"}}>
        <div style={{maxWidth:"1200px",margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <div style={{width:"28px",height:"28px",background:"var(--primary-light)",borderRadius:"6px",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{color:"var(--primary)",fontSize:"13px",fontWeight:"700",fontFamily:"Merriweather,serif"}}>N</span>
            </div>
            <span style={{fontSize:"15px",fontWeight:"700",color:"#fff",fontFamily:"Merriweather,serif"}}>Notya AI</span>
          </div>
          <div style={{fontSize:"12px",color:"rgba(255,255,255,.4)",fontFamily:"Lato,sans-serif"}}>2026 Dream Türkiye · KVKK Uyumlu</div>
        </div>
      </footer>
    </main>
  )
}
