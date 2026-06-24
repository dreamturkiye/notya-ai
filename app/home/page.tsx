
import Link from "next/link"

// ═══════════════════════════════════════════════════
// NOTYA AI — "Clinic Calm" Design System
// Primary:   #006699  Deep Oceanic Blue  (trust, branding, CTAs)
// Secondary: #00A86B  Jade Green         (success, active states)
// Accent:    #FF6B4B  Coral              (high-priority CTAs, alerts)
// BG:        #F4F7F6  Soft Aqua White    (breathable, eye-strain free)
// Text:      #1F2937  Charcoal           (high readability)
// Surface:   #FFFFFF  White              (cards, panels)
// ═══════════════════════════════════════════════════

export default function HomePage() {

  const HERO_IMG     = "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1600&q=80&fit=crop&crop=center"
  const CONSULT_IMG  = "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=900&q=80&fit=crop"
  const LEARNING_IMG = "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=900&q=80&fit=crop"

  return (
    <main style={{margin:0,padding:0,background:"#F4F7F6",color:"#1F2937",
                  fontFamily:"'Lato','Helvetica Neue',Arial,sans-serif",overflowX:"hidden"}}>

      {/* ── GOOGLE FONTS ─────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Merriweather:ital,wght@0,400;0,700;1,400&display=swap');
        * { box-sizing: border-box; }
        :root {
          --primary: #006699;
          --primary-dark: #004d73;
          --primary-light: #e6f2f8;
          --secondary: #00A86B;
          --secondary-light: #e6f9f2;
          --accent: #FF6B4B;
          --bg: #F4F7F6;
          --surface: #FFFFFF;
          --text: #1F2937;
          --text-muted: #6B7280;
          --border: #E5EAE8;
        }
        .btn-primary {
          display:inline-block; padding:14px 36px;
          background:var(--accent); color:#fff;
          text-decoration:none; border-radius:6px;
          font-size:15px; font-weight:700; letter-spacing:.03em;
          font-family:'Lato',sans-serif;
          transition:background .2s, transform .15s;
          box-shadow: 0 4px 14px rgba(255,107,75,.35);
        }
        .btn-primary:hover { background:#e5573a; transform:translateY(-1px); }
        .btn-secondary {
          display:inline-block; padding:13px 32px;
          background:transparent; color:var(--primary);
          text-decoration:none; border-radius:6px;
          font-size:15px; font-weight:700;
          border:2px solid var(--primary);
          font-family:'Lato',sans-serif;
          transition:all .2s;
        }
        .btn-secondary:hover { background:var(--primary); color:#fff; }
        .section-label {
          font-size:11px; font-weight:700; letter-spacing:.18em;
          text-transform:uppercase; color:var(--secondary);
          font-family:'Lato',sans-serif; margin-bottom:14px;
          display:flex; align-items:center; gap:8px;
        }
        .section-label::before {
          content:''; display:block; width:24px; height:2px;
          background:var(--secondary);
        }
        .card {
          background:var(--surface); border-radius:12px;
          border:1px solid var(--border);
          box-shadow:0 2px 12px rgba(0,102,153,.06);
        }
        .nav-link {
          color:var(--text-muted); font-size:14px;
          text-decoration:none; font-family:'Lato',sans-serif;
          transition:color .15s;
        }
        .nav-link:hover { color:var(--primary); }
        @media(max-width:768px) {
          .hero-grid { grid-template-columns:1fr !important; }
          .feature-grid { grid-template-columns:1fr !important; }
          .specialist-grid { grid-template-columns:1fr 1fr !important; }
          .pricing-grid { grid-template-columns:1fr !important; }
          .trust-bar { flex-wrap:wrap !important; gap:16px !important; }
          .hide-mobile { display:none !important; }
        }
      `}</style>

      {/* ── NAV ──────────────────────────────────────────────── */}
      <nav style={{background:"var(--surface)",borderBottom:"1px solid var(--border)",
                   padding:"0 48px",position:"sticky",top:0,zIndex:100,
                   boxShadow:"0 1px 8px rgba(0,102,153,.08)"}}>
        <div style={{maxWidth:"1200px",margin:"0 auto",display:"flex",alignItems:"center",
                     justifyContent:"space-between",height:"68px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <div style={{width:"34px",height:"34px",background:"var(--primary)",borderRadius:"8px",
                         display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{color:"#fff",fontSize:"16px",fontWeight:"700",fontFamily:"Merriweather,serif"}}>N</span>
            </div>
            <span style={{fontSize:"18px",fontWeight:"700",color:"var(--primary)",
                          fontFamily:"Merriweather,serif",letterSpacing:"-0.01em"}}>Notya AI</span>
          </div>
          <div style={{display:"flex",gap:"32px",alignItems:"center"}} className="hide-mobile">
            <a href="#özellikler" className="nav-link">Özellikler</a>
            <a href="#uzmanlar" className="nav-link">Uzmanlar</a>
            <a href="#fiyatlar" className="nav-link">Fiyatlar</a>
          </div>
          <div style={{display:"flex",gap:"12px",alignItems:"center"}}>
            <Link href="/giris">Giriş</Link>
            <Link href="/giris">Ücretsiz Deneyin</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{background:"var(--surface)",padding:"0 48px"}}>
        <div style={{maxWidth:"1200px",margin:"0 auto",
                     display:"grid",gridTemplateColumns:"1fr 1fr",
                     gap:"64px",alignItems:"center",minHeight:"580px",
                     padding:"64px 0"}} className="hero-grid">

          {/* Left — copy */}
          <div>
            <div style={{display:"inline-flex",alignItems:"center",gap:"8px",
                         background:"var(--secondary-light)",border:"1px solid rgba(0,168,107,.2)",
                         borderRadius:"20px",padding:"6px 14px",marginBottom:"24px"}}>
              <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"var(--secondary)"}}></div>
              <span style={{fontSize:"12px",fontWeight:"700",color:"var(--secondary)",
                            letterSpacing:".06em",textTransform:"uppercase",fontFamily:"Lato,sans-serif"}}>
                Türkiye'nin İlk AI Tıp Uzmanı
              </span>
            </div>

            <h1 style={{fontSize:"clamp(36px,4.5vw,56px)",fontWeight:"700",lineHeight:"1.1",
                        margin:"0 0 20px",color:"var(--text)",
                        fontFamily:"Merriweather,serif",letterSpacing:"-0.02em"}}>
              Cebinizdeki<br/>
              <span style={{color:"var(--primary)"}}>Dünyaca Ünlü</span><br/>
              Uzman Doktor.
            </h1>

            <p style={{fontSize:"18px",lineHeight:"1.75",color:"var(--text-muted)",
                       margin:"0 0 36px",fontFamily:"Lato,sans-serif",fontWeight:"300",
                       maxWidth:"460px"}}>
              Nelson, Braunwald ve Harrison'ı başucu kitabı olarak bilen 30 uzman.
              Sesli. Gerçek zamanlı. Her seanstan öğrenen.
            </p>

            <div style={{display:"flex",gap:"14px",alignItems:"center",flexWrap:"wrap",marginBottom:"40px"}}>
              <Link href="/giris">Ücretsiz Başlayın</Link>
              <Link href="/asistan" className="btn-secondary">Canlı Demo →</Link>
            </div>

            {/* Social proof */}
            <div style={{display:"flex",alignItems:"center",gap:"16px",
                         paddingTop:"24px",borderTop:"1px solid var(--border)"}}>
              <div style={{display:"flex"}}>
                {["#006699","#00A86B","#FF6B4B","#7C3AED","#F59E0B"].map((c,i)=>(
                  <div key={i} style={{width:"34px",height:"34px",borderRadius:"50%",
                                       background:c,border:"2px solid #fff",
                                       marginLeft:i>0?"-10px":"0",fontSize:"14px",
                                       display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>
                    👨‍⚕️
                  </div>
                ))}
              </div>
              <div>
                <div style={{fontSize:"14px",fontWeight:"700",color:"var(--text)",fontFamily:"Lato,sans-serif"}}>
                  Beta doktorlarımız aktif
                </div>
                <div style={{fontSize:"12px",color:"var(--text-muted)",fontFamily:"Lato,sans-serif"}}>
                  "Gerçekten farklı bir şey." — Dr. G.M., Pediatrist
                </div>
              </div>
            </div>
          </div>

          {/* Right — hero image + floating UI */}
          <div style={{position:"relative"}}>
            <div style={{borderRadius:"16px",overflow:"hidden",
                         boxShadow:"0 20px 60px rgba(0,102,153,.15)"}}>
              <img src={HERO_IMG} alt="Doktor muayenede"
                style={{width:"100%",height:"420px",objectFit:"cover",objectPosition:"center 25%",
                        filter:"brightness(.95) saturate(.9)"}} />
              <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,102,153,.15),transparent 50%)",borderRadius:"16px"}} />
            </div>

            {/* Floating card — live conversation */}
            <div className="card" style={{position:"absolute",bottom:"-24px",left:"-24px",
                                          padding:"16px 20px",maxWidth:"280px",
                                          boxShadow:"0 8px 32px rgba(0,102,153,.12)"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px"}}>
                <div style={{width:"32px",height:"32px",borderRadius:"50%",background:"var(--secondary-light)",
                             display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px"}}>👩‍⚕️</div>
                <div>
                  <div style={{fontSize:"12px",fontWeight:"700",color:"var(--text)",fontFamily:"Lato,sans-serif"}}>Prof. Ayşe Kaya</div>
                  <div style={{fontSize:"10px",color:"var(--secondary)",fontFamily:"Lato,sans-serif",
                               display:"flex",alignItems:"center",gap:"4px"}}>
                    <span style={{width:"6px",height:"6px",borderRadius:"50%",background:"var(--secondary)",display:"inline-block"}}></span>
                    Dinliyor
                  </div>
                </div>
              </div>
              <div style={{fontSize:"12px",color:"var(--text)",fontFamily:"Lato,sans-serif",
                           lineHeight:"1.6",background:"var(--primary-light)",
                           padding:"8px 10px",borderRadius:"6px",borderLeft:"3px solid var(--primary)"}}>
                "Bu doz yetişkin dozudur. Bu kiloda Nelson'a göre 250mg olmalı — düzelteyim mi?"
              </div>
            </div>

            {/* Floating badge — textbook reference */}
            <div className="card" style={{position:"absolute",top:"-16px",right:"-16px",
                                          padding:"10px 14px",
                                          boxShadow:"0 4px 16px rgba(0,168,107,.15)"}}>
              <div style={{fontSize:"10px",fontWeight:"700",color:"var(--text-muted)",
                           textTransform:"uppercase",letterSpacing:".06em",fontFamily:"Lato,sans-serif"}}>Referans</div>
              <div style={{fontSize:"12px",fontWeight:"700",color:"var(--secondary)",fontFamily:"Lato,sans-serif"}}>Nelson 22e ✓</div>
              <div style={{fontSize:"11px",color:"var(--text-muted)",fontFamily:"Lato,sans-serif"}}>Harriet Lane 23e ✓</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ────────────────────────────────────────── */}
      <section style={{background:"var(--primary)",padding:"20px 48px"}}>
        <div style={{maxWidth:"1200px",margin:"0 auto",display:"flex",
                     gap:"0",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}}
             className="trust-bar">
          {[
            ["Nelson 22e","Pediatri"],["Braunwald 12e","Kardiyoloji"],
            ["Harrison's 22e","Dahiliye"],["Adams & Victor","Nöroloji"],
            ["Kaplan & Sadock","Psikiyatri"],["KVKK Uyumlu","AB Frankfurt"],
          ].map(([title,sub],i)=>(
            <div key={title} style={{display:"flex",alignItems:"center",gap:"10px",
                                     padding:"8px 24px",borderRight:i<5?"1px solid rgba(255,255,255,.2)":"none"}}>
              <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"rgba(255,255,255,.5)",flexShrink:0}}></div>
              <div>
                <div style={{fontSize:"13px",fontWeight:"700",color:"#fff",fontFamily:"Lato,sans-serif",whiteSpace:"nowrap"}}>{title}</div>
                <div style={{fontSize:"10px",color:"rgba(255,255,255,.6)",fontFamily:"Lato,sans-serif",
                             letterSpacing:".06em",textTransform:"uppercase"}}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="özellikler" style={{padding:"100px 48px",background:"var(--bg)"}}>
        <div style={{maxWidth:"1200px",margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:"60px"}}>
            <div className="section-label" style={{justifyContent:"center"}}>Temel Özellikler</div>
            <h2 style={{fontSize:"clamp(30px,4vw,44px)",fontWeight:"700",fontFamily:"Merriweather,serif",
                        letterSpacing:"-0.02em",color:"var(--text)",margin:"0 0 16px"}}>
              Doktorun İhtiyacı Olan Her Şey<br/>
              <em style={{color:"var(--primary)",fontStyle:"italic"}}>Tek Yerde.</em>
            </h2>
            <p style={{fontSize:"17px",color:"var(--text-muted)",maxWidth:"520px",margin:"0 auto",
                       lineHeight:"1.75",fontFamily:"Lato,sans-serif"}}>
              Türkiye'deki ilk Türkçe AI tıp uzmanı — sesli, öğrenen, proaktif.
            </p>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"20px"}} className="feature-grid">
            {[
              {
                icon:"🎙️", color:"var(--primary)", bg:"var(--primary-light)",
                title:"Sesli & Doğal",
                desc:"Push-to-talk yok. Mikrofona bir kez dokunun — Prof. Ayşe sizi karşılar. Gerçek zamanlı, araya girince durur.",
                badge:"< 2 saniye yanıt"
              },
              {
                icon:"🧠", color:"var(--secondary)", bg:"var(--secondary-light)",
                title:"Textbook Zekası",
                desc:"30 uzmanlık alanı, her biri kendi altın standart referans kitaplarıyla. Nelson, Braunwald, Harrison — hepsi içeri aktarılmış.",
                badge:"30 uzmanlık"
              },
              {
                icon:"⚡", color:"#F59E0B", bg:"#FEF3C7",
                title:"Öğrenen Sistem",
                desc:"10 seans sonra Dr. Gökhan'ın tercih ettiği markayı, not stilini, yaygın tanılarını bilir. Yıllardır birlikte çalışıyormuşsunuz gibi.",
                badge:"Her seans öğrenir"
              },
              {
                icon:"🛡️", color:"var(--accent)", bg:"#FFF0EC",
                title:"Güvenlik Ağı",
                desc:"Yanlış doz, tehlikeli kombinasyon, SGK kısıtlaması — sormadan söyler. 50 hastanın yorgunluğunda sizin yerinize tetikte.",
                badge:"Proaktif uyarı"
              },
              {
                icon:"📋", color:"#7C3AED", bg:"#F3E8FF",
                title:"SOAP Notları",
                desc:"Sesle anlattınız — ICD-10 kodlu, SGK uyumlu, onaylamaya hazır SOAP notu otomatik oluşur. Bürokratik yük sıfır.",
                badge:"Otomatik ICD-10"
              },
              {
                icon:"🔐", color:"#0891B2", bg:"#E0F7FA",
                title:"KVKK Uyumlu",
                desc:"Tüm hasta verileri AES-256 şifreleme ile Frankfurt AB veri merkezinde. Türk hukuku, Avrupa standartları.",
                badge:"AB Frankfurt"
              },
            ].map(f=>(
              <div key={f.title} className="card" style={{padding:"28px"}}>
                <div style={{width:"48px",height:"48px",borderRadius:"12px",background:f.bg,
                             display:"flex",alignItems:"center",justifyContent:"center",
                             fontSize:"22px",marginBottom:"16px"}}>
                  {f.icon}
                </div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px"}}>
                  <div style={{fontSize:"17px",fontWeight:"700",color:"var(--text)",fontFamily:"Merriweather,serif"}}>{f.title}</div>
                  <div style={{fontSize:"10px",fontWeight:"700",color:f.color,background:f.bg,
                               padding:"3px 8px",borderRadius:"20px",fontFamily:"Lato,sans-serif",
                               letterSpacing:".04em",whiteSpace:"nowrap"}}>
                    {f.badge}
                  </div>
                </div>
                <p style={{fontSize:"14px",color:"var(--text-muted)",lineHeight:"1.7",
                           margin:0,fontFamily:"Lato,sans-serif"}}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VOICE DEMO — SPLIT WITH PHOTO ────────────────────── */}
      <section style={{background:"var(--surface)",padding:"100px 48px"}}>
        <div style={{maxWidth:"1200px",margin:"0 auto",
                     display:"grid",gridTemplateColumns:"1fr 1fr",gap:"72px",alignItems:"center"}}
             className="feature-grid">
          <div>
            <div className="section-label">Sesli Konuşma</div>
            <h2 style={{fontSize:"clamp(28px,3.5vw,42px)",fontWeight:"700",
                        fontFamily:"Merriweather,serif",letterSpacing:"-0.02em",
                        color:"var(--text)",margin:"0 0 20px",lineHeight:"1.15"}}>
              İki Meslektaş<br/>
              <em style={{color:"var(--primary)",fontStyle:"italic"}}>Gibi Konuşun.</em>
            </h2>
            <p style={{fontSize:"16px",color:"var(--text-muted)",lineHeight:"1.8",
                       margin:"0 0 32px",fontFamily:"Lato,sans-serif"}}>
              Buton yok. Bekleme yok. Mikrofona bir kez dokunun, Prof. Ayşe sizi karşılar.
              Cümlenizin ortasında araya girebilirsiniz — o anında durur.
            </p>

            {/* Live conversation preview */}
            <div className="card" style={{padding:"20px",marginBottom:"24px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px",
                           paddingBottom:"12px",borderBottom:"1px solid var(--border)"}}>
                <div style={{width:"36px",height:"36px",borderRadius:"50%",background:"var(--secondary-light)",
                             display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px"}}>👩‍⚕️</div>
                <div>
                  <div style={{fontSize:"13px",fontWeight:"700",color:"var(--text)",fontFamily:"Lato,sans-serif"}}>Prof. Ayşe Kaya</div>
                  <div style={{fontSize:"11px",color:"var(--secondary)",fontFamily:"Lato,sans-serif",
                               display:"flex",alignItems:"center",gap:"4px"}}>
                    <span style={{width:"5px",height:"5px",borderRadius:"50%",background:"var(--secondary)",display:"inline-block"}}></span>
                    Dinliyor
                  </div>
                </div>
              </div>
              {[
                {side:"right",text:"7 yaşında, 18 kilo. 3 gündür ateş, sağ kulak ağrısı."},
                {side:"left", text:"Otoskopide ne görüyorsunuz doktor?"},
                {side:"right",text:"TM hiperemik, mat."},
                {side:"left", text:"Akut otitis media. Amoksisilin 40mg/kg/gün, bu kiloda 720mg, iki doza. Yazayım mı?"},
                {side:"right",text:"Yaz."},
                {side:"left", text:"Eklendi. 3-5 gün sonra kontrol önerilir. Başka bir şey var mı doktor?"},
              ].map((m,i)=>(
                <div key={i} style={{display:"flex",justifyContent:m.side==="right"?"flex-end":"flex-start",marginBottom:"8px"}}>
                  <div style={{maxWidth:"80%",padding:"8px 12px",
                               borderRadius:m.side==="right"?"12px 12px 2px 12px":"12px 12px 12px 2px",
                               background:m.side==="right"?"var(--primary)":"var(--bg)",
                               color:m.side==="right"?"#fff":"var(--text)",
                               fontSize:"12px",lineHeight:"1.5",fontFamily:"Lato,sans-serif"}}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <Link href="/asistan" className="btn-primary">Şimdi Deneyin →</Link>
          </div>

          {/* Photo */}
          <div style={{position:"relative"}}>
            <div style={{borderRadius:"16px",overflow:"hidden",
                         boxShadow:"0 20px 60px rgba(0,102,153,.12)"}}>
              <img src={CONSULT_IMG} alt="Doktor konsültasyon"
                style={{width:"100%",height:"480px",objectFit:"cover",
                        filter:"brightness(.95) saturate(.85)"}} />
            </div>
            <div className="card" style={{position:"absolute",bottom:"24px",right:"-20px",
                                          padding:"14px 18px",
                                          boxShadow:"0 8px 24px rgba(0,168,107,.15)",
                                          borderLeft:"4px solid var(--secondary)"}}>
              <div style={{fontSize:"11px",color:"var(--text-muted)",fontFamily:"Lato,sans-serif",marginBottom:"4px"}}>Gerçek Zamanlı Koruma</div>
              <div style={{fontSize:"13px",fontWeight:"700",color:"var(--text)",fontFamily:"Lato,sans-serif"}}>⚠️ Yanlış doz tespit edildi</div>
              <div style={{fontSize:"11px",color:"var(--secondary)",fontFamily:"Lato,sans-serif",marginTop:"3px"}}>Nelson 22e referans alındı ✓</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LEARNING SYSTEM ──────────────────────────────────── */}
      <section style={{background:"var(--bg)",padding:"100px 48px"}}>
        <div style={{maxWidth:"1200px",margin:"0 auto",
                     display:"grid",gridTemplateColumns:"1fr 1fr",gap:"72px",alignItems:"center"}}
             className="feature-grid">
          {/* Photo */}
          <div style={{position:"relative"}}>
            <div style={{borderRadius:"16px",overflow:"hidden",
                         boxShadow:"0 20px 60px rgba(0,102,153,.12)"}}>
              <img src={LEARNING_IMG} alt="Öğrenen sistem"
                style={{width:"100%",height:"460px",objectFit:"cover",objectPosition:"center",
                        filter:"brightness(.9) saturate(.8)"}} />
            </div>
          </div>

          {/* Copy */}
          <div>
            <div className="section-label">Öğrenen Sistem</div>
            <h2 style={{fontSize:"clamp(28px,3.5vw,42px)",fontWeight:"700",
                        fontFamily:"Merriweather,serif",letterSpacing:"-0.02em",
                        color:"var(--text)",margin:"0 0 20px",lineHeight:"1.15"}}>
              10 Seans Sonra<br/>
              <em style={{color:"var(--primary)",fontStyle:"italic"}}>Yıllardır Birliktesiniz.</em>
            </h2>
            <p style={{fontSize:"16px",color:"var(--text-muted)",lineHeight:"1.8",
                       margin:"0 0 32px",fontFamily:"Lato,sans-serif"}}>
              Her düzeltme öğrenir. Her tercih hatırlanır. 1. seans ile 10. seans arasındaki
              fark gece ile gündüz gibidir.
            </p>

            {/* Before/After */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"32px"}}>
              <div className="card" style={{padding:"16px"}}>
                <div style={{fontSize:"10px",fontWeight:"700",color:"var(--text-muted)",
                             textTransform:"uppercase",letterSpacing:".1em",
                             fontFamily:"Lato,sans-serif",marginBottom:"10px"}}>1. Seans</div>
                <div style={{fontSize:"12px",color:"var(--text-muted)",fontFamily:"Lato,sans-serif",
                             fontStyle:"italic",marginBottom:"6px"}}>"Amoksisilin yaz."</div>
                <div style={{fontSize:"12px",color:"var(--text)",background:"var(--bg)",
                             padding:"8px",borderRadius:"6px",fontFamily:"Lato,sans-serif",lineHeight:"1.5"}}>
                  Hangi dozu yazayım doktor?
                </div>
              </div>
              <div style={{background:"var(--primary)",borderRadius:"12px",padding:"16px",position:"relative"}}>
                <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",
                             background:"var(--secondary)",color:"#fff",fontSize:"9px",fontWeight:"700",
                             padding:"3px 10px",borderRadius:"0 0 8px 8px",letterSpacing:".06em",
                             fontFamily:"Lato,sans-serif"}}>10. SEANS</div>
                <div style={{fontSize:"12px",color:"rgba(255,255,255,.7)",fontFamily:"Lato,sans-serif",
                             fontStyle:"italic",marginTop:"16px",marginBottom:"6px"}}>"Amoksisilin yaz."</div>
                <div style={{fontSize:"12px",color:"#fff",background:"rgba(255,255,255,.12)",
                             padding:"8px",borderRadius:"6px",fontFamily:"Lato,sans-serif",lineHeight:"1.5"}}>
                  40mg/kg/gün, bu kiloda 720mg. Bildiğiniz gibi Amoksiklav yazıyorsunuz — onu mu yazayım?
                </div>
                <div style={{fontSize:"11px",color:"rgba(255,255,255,.5)",fontFamily:"Lato,sans-serif",
                             marginTop:"6px",fontStyle:"italic"}}>✦ Sormadınız — hatırladı.</div>
              </div>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              {[
                "Tercih ettiğiniz ilaç markalarını hatırlar",
                "Not stilinize göre kısa veya detaylı yazar",
                "Sık koyduğunuz tanıları önde önerir",
                "Her düzeltmeden sonra bir daha aynı hatayı yapmaz",
              ].map(item=>(
                <div key={item} style={{display:"flex",alignItems:"center",gap:"10px",
                                       fontSize:"14px",color:"var(--text-muted)",fontFamily:"Lato,sans-serif"}}>
                  <div style={{width:"20px",height:"20px",borderRadius:"50%",background:"var(--secondary-light)",
                               display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                               color:"var(--secondary)",fontSize:"10px",fontWeight:"700"}}>✓</div>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SPECIALISTS ──────────────────────────────────────── */}
      <section id="uzmanlar" style={{background:"var(--primary)",padding:"80px 48px"}}>
        <div style={{maxWidth:"1200px",margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:"48px"}}>
            <div style={{fontSize:"11px",fontWeight:"700",letterSpacing:".18em",textTransform:"uppercase",
                         color:"rgba(255,255,255,.6)",fontFamily:"Lato,sans-serif",marginBottom:"14px",
                         display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
              <span style={{display:"block",width:"24px",height:"2px",background:"rgba(255,255,255,.4)"}}></span>
              30 Uzmanlık Alanı
              <span style={{display:"block",width:"24px",height:"2px",background:"rgba(255,255,255,.4)"}}></span>
            </div>
            <h2 style={{fontSize:"clamp(28px,3.5vw,42px)",fontWeight:"700",
                        fontFamily:"Merriweather,serif",color:"#fff",
                        margin:"0 0 16px",letterSpacing:"-0.02em"}}>
              Her Uzmanlık İçin<br/>Kendi Referans Kitapları.
            </h2>
            <p style={{fontSize:"16px",color:"rgba(255,255,255,.65)",fontFamily:"Lato,sans-serif",
                       maxWidth:"480px",margin:"0 auto",lineHeight:"1.75"}}>
              Pediatriden Kardiyoloji'ye, Psikiyatriden Onkoloji'ye —
              her uzman kendi altın standart textbook'larıyla konuşur.
            </p>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"8px"}} className="specialist-grid">
            {[
              {emoji:"🧒",label:"Pediatri",book:"Nelson 22e"},
              {emoji:"❤️",label:"Kardiyoloji",book:"Braunwald 12e"},
              {emoji:"🧠",label:"Nöroloji",book:"Adams & Victor"},
              {emoji:"🩺",label:"Dahiliye",book:"Harrison's 22e"},
              {emoji:"💭",label:"Psikiyatri",book:"Kaplan & Sadock"},
              {emoji:"🌿",label:"Dermatoloji",book:"Fitzpatrick's 9e"},
              {emoji:"🦴",label:"Ortopedi",book:"Campbell's 14e"},
              {emoji:"👶",label:"Kadın Doğum",book:"Williams Obs. 26e"},
              {emoji:"🚨",label:"Acil Tıp",book:"Tintinalli's 9e"},
              {emoji:"🔬",label:"Endokrinoloji",book:"Williams Endo. 14e"},
            ].map(s=>(
              <div key={s.label} style={{background:"rgba(255,255,255,.1)",
                                         border:"1px solid rgba(255,255,255,.15)",
                                         borderRadius:"10px",padding:"16px 12px",textAlign:"center",
                                         transition:"background .2s"}}>
                <div style={{fontSize:"24px",marginBottom:"6px"}}>{s.emoji}</div>
                <div style={{fontSize:"12px",fontWeight:"700",color:"#fff",
                             fontFamily:"Lato,sans-serif",marginBottom:"4px"}}>{s.label}</div>
                <div style={{fontSize:"10px",color:"rgba(255,255,255,.5)",fontFamily:"Lato,sans-serif"}}>{s.book}</div>
              </div>
            ))}
          </div>

          <div style={{textAlign:"center",marginTop:"24px"}}>
            <span style={{fontSize:"13px",color:"rgba(255,255,255,.5)",fontFamily:"Lato,sans-serif"}}>
              + 20 daha: Gastroenteroloji, Romatoloji, Onkoloji, Üroloji, KBB, Göz, ve daha fazlası...
            </span>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section id="fiyatlar" style={{background:"var(--surface)",padding:"100px 48px"}}>
        <div style={{maxWidth:"900px",margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:"52px"}}>
            <div className="section-label" style={{justifyContent:"center"}}>Fiyatlandırma</div>
            <h2 style={{fontSize:"clamp(28px,3.5vw,42px)",fontWeight:"700",
                        fontFamily:"Merriweather,serif",color:"var(--text)",letterSpacing:"-0.02em"}}>
              Sade. Şeffaf. Adil.
            </h2>
            <p style={{fontSize:"16px",color:"var(--text-muted)",fontFamily:"Lato,sans-serif",marginTop:"12px"}}>
              Kurucu üye fiyatları — ilk 100 doktor için geçerli.
            </p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px"}} className="pricing-grid">
            {[
              {name:"Starter",price:"₺299",orig:"₺499",period:"/ay",
               features:["50 seans/ay","1 kullanıcı","SOAP notları","WhatsApp gönderimi","AI Uzman Asistan"],
               highlight:false,cta:"Başlayın"},
              {name:"Pro",price:"₺799",orig:"₺1.299",period:"/ay",
               features:["Sınırsız seans","1 kullanıcı","Her şey dahil","Öğrenen sistem","30 uzman","Çevrimdışı mod"],
               highlight:true,cta:"En Popüler"},
              {name:"Klinik",price:"₺2.499",orig:"₺3.999",period:"/ay",
               features:["Sınırsız seans","5 kullanıcı","Klinik raporlar","Öncelikli destek","Tüm özellikler"],
               highlight:false,cta:"Başlayın"},
            ].map((plan,i)=>(
              <div key={plan.name} className="card" style={{
                padding:"32px 28px",position:"relative",
                border:plan.highlight?`2px solid var(--primary)`:"1px solid var(--border)",
                boxShadow:plan.highlight?"0 8px 32px rgba(0,102,153,.15)":"none"
              }}>
                {plan.highlight && (
                  <div style={{position:"absolute",top:"-13px",left:"50%",transform:"translateX(-50%)",
                               background:"var(--primary)",color:"#fff",fontSize:"11px",fontWeight:"700",
                               padding:"4px 16px",borderRadius:"20px",fontFamily:"Lato,sans-serif",
                               letterSpacing:".06em",whiteSpace:"nowrap"}}>
                    🏆 EN POPÜLER
                  </div>
                )}
                <div style={{fontSize:"13px",fontWeight:"700",color:"var(--text-muted)",
                             fontFamily:"Lato,sans-serif",letterSpacing:".06em",
                             textTransform:"uppercase",marginBottom:"16px"}}>{plan.name}</div>
                <div style={{marginBottom:"8px",display:"flex",alignItems:"baseline",gap:"8px"}}>
                  <span style={{fontSize:"38px",fontWeight:"700",color:"var(--text)",
                                fontFamily:"Merriweather,serif"}}>{plan.price}</span>
                  <span style={{fontSize:"13px",color:"var(--text-muted)",fontFamily:"Lato,sans-serif"}}>{plan.period}</span>
                </div>
                <div style={{fontSize:"12px",color:"var(--text-muted)",fontFamily:"Lato,sans-serif",
                             marginBottom:"24px"}}>
                  <span style={{textDecoration:"line-through"}}>{plan.orig}</span>
                  <span style={{color:"var(--secondary)",fontWeight:"700",marginLeft:"6px"}}>Kurucu fiyatı</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"28px"}}>
                  {plan.features.map(f=>(
                    <div key={f} style={{display:"flex",alignItems:"center",gap:"8px",
                                        fontSize:"14px",color:"var(--text)",fontFamily:"Lato,sans-serif"}}>
                      <span style={{color:"var(--secondary)",fontWeight:"700",fontSize:"14px"}}>✓</span>{f}
                    </div>
                  ))}
                </div>
                <Link href="/giris" style={{
                  display:"block",padding:"13px",textAlign:"center",borderRadius:"6px",
                  textDecoration:"none",fontSize:"14px",fontWeight:"700",fontFamily:"Lato,sans-serif",
                  background:plan.highlight?"var(--accent)":"transparent",
                  color:plan.highlight?"#fff":"var(--primary)",
                  border:plan.highlight?"none":`2px solid var(--primary)`,
                  boxShadow:plan.highlight?"0 4px 14px rgba(255,107,75,.3)":"none"
                }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <div style={{textAlign:"center",marginTop:"24px",fontSize:"13px",
                       color:"var(--text-muted)",fontFamily:"Lato,sans-serif"}}>
            14 gün ücretsiz · Kredi kartı gerektirmez · Dilediğinizde iptal
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section style={{background:"var(--primary-light)",padding:"80px 48px",
                       borderTop:"2px solid var(--primary)",textAlign:"center"}}>
        <div className="section-label" style={{justifyContent:"center"}}>Başlamaya Hazır mısınız?</div>
        <h2 style={{fontSize:"clamp(30px,4vw,48px)",fontWeight:"700",
                    fontFamily:"Merriweather,serif",color:"var(--text)",
                    margin:"0 0 16px",letterSpacing:"-0.02em"}}>
          Bugün Başlayın.<br/>
          <em style={{color:"var(--primary)",fontStyle:"italic"}}>İlk 14 Gün Ücretsiz.</em>
        </h2>
        <p style={{fontSize:"17px",color:"var(--text-muted)",fontFamily:"Lato,sans-serif",
                   margin:"0 0 36px",maxWidth:"420px",display:"inline-block",lineHeight:"1.75"}}>
          Kurucu üye fiyatını kaçırmayın. İlk 100 doktor için geçerli.
        </p>
        <div>
          <Link href="/giris"
            style={{fontSize:"16px",padding:"16px 48px",boxShadow:"0 6px 20px rgba(255,107,75,.4)"}}>
            Ücretsiz Hesap Aç →
          </Link>
        </div>
        <div style={{marginTop:"16px",fontSize:"13px",color:"var(--text-muted)",fontFamily:"Lato,sans-serif"}}>
          KVKK uyumlu · AB veri merkezi · Türkçe destek · Dilediğinizde iptal
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{background:"var(--text)",padding:"32px 48px"}}>
        <div style={{maxWidth:"1200px",margin:"0 auto",
                     display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <div style={{width:"28px",height:"28px",background:"var(--primary-light)",borderRadius:"6px",
                         display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{color:"var(--primary)",fontSize:"13px",fontWeight:"700",
                            fontFamily:"Merriweather,serif"}}>N</span>
            </div>
            <span style={{fontSize:"15px",fontWeight:"700",color:"#fff",
                          fontFamily:"Merriweather,serif"}}>Notya AI</span>
          </div>
          <div style={{fontSize:"12px",color:"rgba(255,255,255,.4)",fontFamily:"Lato,sans-serif"}}>
            © 2026 Dream Türkiye · KVKK Uyumlu · AB Frankfurt
          </div>
        </div>
      </footer>

    </main>
  )
}
