
import Link from "next/link"
export default function AvukatPage() {
  const HERO_IMG    = "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1600&q=80&fit=crop&crop=center"
  const CONSULT_IMG = "https://images.unsplash.com/photo-1521791055366-0d553872952f?w=900&q=80&fit=crop"
  const LEARNING_IMG= "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&q=80&fit=crop"
  return (
    <main style={{margin:0,padding:0,background:"#F4F7F6",color:"#1F2937",fontFamily:"'Lato','Helvetica Neue',Arial,sans-serif",overflowX:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Merriweather:ital,wght@0,400;0,700;1,400&display=swap');
        * { box-sizing: border-box; }
        :root {
          --primary: #1e3a5f;
          --primary-dark: #122640;
          --primary-light: #dbeafe;
          --secondary: #B45309;
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
        .card { background:var(--surface); border-radius:12px; border:1px solid var(--border); box-shadow:0 2px 12px rgba(30,58,95,.06); }
        .nav-link { color:var(--text-muted); font-size:14px; text-decoration:none; font-family:'Lato',sans-serif; transition:color .15s; }
        .nav-link:hover { color:var(--primary); }
        @media(max-width:768px) { .hero-grid { grid-template-columns:1fr !important; } .feature-grid { grid-template-columns:1fr !important; } .pricing-grid { grid-template-columns:1fr !important; } .trust-bar { flex-wrap:wrap !important; gap:16px !important; } .hide-mobile { display:none !important; } }
      `}</style>

      {/* NAV */}
      <nav style={{background:"var(--surface)",borderBottom:"1px solid var(--border)",padding:"0 48px",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 8px rgba(30,58,95,.08)"}}>
        <div style={{maxWidth:"1200px",margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:"68px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <div style={{width:"34px",height:"34px",background:"var(--primary)",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{color:"#fff",fontSize:"16px",fontWeight:"700",fontFamily:"Merriweather,serif"}}>N</span>
            </div>
            <span style={{fontSize:"18px",fontWeight:"700",color:"var(--primary)",fontFamily:"Merriweather,serif",letterSpacing:"-0.01em"}}>Notya AI</span>
          </div>
          <div style={{display:"flex",gap:"32px",alignItems:"center"}} className="hide-mobile">
            <a href="#özellikler" className="nav-link">Özellikler</a>
            <a href="#uzmanlar" className="nav-link">Uzmanlar</a>
            <a href="#fiyatlar" className="nav-link">Fiyatlar</a>
          </div>
          <div style={{display:"flex",gap:"12px",alignItems:"center"}}>
            <Link href="/giris/avukat" className="btn-secondary" style={{padding:"9px 22px",fontSize:"14px"}}>Giriş</Link>
            <Link href="/giris/avukat" className="btn-primary" style={{padding:"9px 22px",fontSize:"14px"}}>Ücretsiz Deneyin</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{background:"var(--surface)",padding:"0 48px"}}>
        <div style={{maxWidth:"1200px",margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"64px",alignItems:"center",minHeight:"580px",padding:"64px 0"}} className="hero-grid">
          <div>
            <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"var(--primary-light)",border:"1px solid rgba(30,58,95,.2)",borderRadius:"20px",padding:"6px 14px",marginBottom:"24px"}}>
              <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"var(--primary)"}}></div>
              <span style={{fontSize:"12px",fontWeight:"700",color:"var(--primary)",letterSpacing:".06em",textTransform:"uppercase",fontFamily:"Lato,sans-serif"}}>Türkiye'nin Ilk AI Hukuk Asistani</span>
            </div>
            <h1 style={{fontSize:"clamp(36px,4.5vw,56px)",fontWeight:"700",lineHeight:"1.1",margin:"0 0 20px",color:"var(--text)",fontFamily:"Merriweather,serif",letterSpacing:"-0.02em"}}>
              Cebinizdeki<br/>
              <span style={{color:"var(--primary)"}}>Uzman Hukuk</span><br/>
              Asistanınız.
            </h1>
            <p style={{fontSize:"18px",lineHeight:"1.75",color:"var(--text-muted)",margin:"0 0 36px",fontFamily:"Lato,sans-serif",fontWeight:"300",maxWidth:"460px"}}>
              TCK, CMK, HMK, TMK — 9 uzman avukat, dilekçe oluşturur, sure takibi yapar, emsal karar arar. Her seanstan ogrenir.
            </p>
            <div style={{display:"flex",gap:"14px",alignItems:"center",flexWrap:"wrap",marginBottom:"40px"}}>
              <Link href="/giris/avukat" className="btn-primary">Ücretsiz Başlayın</Link>
              <Link href="/giris/avukat" className="btn-secondary">Demo Goruntule</Link>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"16px",paddingTop:"24px",borderTop:"1px solid var(--border)"}}>
              <div style={{display:"flex"}}>
                {["#1e3a5f","#B45309","#FF6B4B","#0891B2","#7C3AED"].map((c,i)=>(
                  <div key={i} style={{width:"34px",height:"34px",borderRadius:"50%",background:c,border:"2px solid #fff",marginLeft:i>0?"-10px":"0",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>⚖️</div>
                ))}
              </div>
              <div>
                <div style={{fontSize:"14px",fontWeight:"700",color:"var(--text)",fontFamily:"Lato,sans-serif"}}>Beta avukatlarımız aktif</div>
                <div style={{fontSize:"12px",color:"var(--text-muted)",fontFamily:"Lato,sans-serif"}}>"Süre takibinde hic gec kalmiyorum artik." - Av. M.O.</div>
              </div>
            </div>
          </div>
          <div style={{position:"relative"}}>
            <div style={{borderRadius:"16px",overflow:"hidden",boxShadow:"0 20px 60px rgba(30,58,95,.15)"}}>
              <img src={HERO_IMG} alt="Avukat" style={{width:"100%",height:"420px",objectFit:"cover",objectPosition:"center 25%",filter:"brightness(.95) saturate(.9)"}} />
              <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(30,58,95,.15),transparent 50%)",borderRadius:"16px"}} />
            </div>
            <div className="card" style={{position:"absolute",bottom:"-24px",left:"-24px",padding:"16px 20px",maxWidth:"280px",boxShadow:"0 8px 32px rgba(30,58,95,.12)"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px"}}>
                <div style={{width:"32px",height:"32px",borderRadius:"50%",background:"var(--primary-light)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px"}}>⚖️</div>
                <div>
                  <div style={{fontSize:"12px",fontWeight:"700",color:"var(--text)",fontFamily:"Lato,sans-serif"}}>Kemal Celik — Ceza Hukuku</div>
                  <div style={{fontSize:"10px",color:"var(--secondary)",fontFamily:"Lato,sans-serif",display:"flex",alignItems:"center",gap:"4px"}}>
                    <span style={{width:"6px",height:"6px",borderRadius:"50%",background:"var(--secondary)",display:"inline-block"}}></span>Dinliyor
                  </div>
                </div>
              </div>
              <div style={{fontSize:"12px",color:"var(--text)",fontFamily:"Lato,sans-serif",lineHeight:"1.6",background:"var(--primary-light)",padding:"8px 10px",borderRadius:"6px",borderLeft:"3px solid var(--primary)"}}>
                "DIKKAT — temyiz suresi 15 gun, 3 gun kaldi. CMK Md.291'e gore bugüne kadar dosyalanmali."
              </div>
            </div>
            <div className="card" style={{position:"absolute",top:"-16px",right:"-16px",padding:"10px 14px",boxShadow:"0 4px 16px rgba(180,83,9,.15)"}}>
              <div style={{fontSize:"10px",fontWeight:"700",color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:".06em",fontFamily:"Lato,sans-serif"}}>Kaynak</div>
              <div style={{fontSize:"12px",fontWeight:"700",color:"var(--secondary)",fontFamily:"Lato,sans-serif"}}>TCK Md.141 ✓</div>
              <div style={{fontSize:"11px",color:"var(--text-muted)",fontFamily:"Lato,sans-serif"}}>CMK Md.291 ✓</div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section style={{background:"var(--primary)",padding:"20px 48px"}}>
        <div style={{maxWidth:"1200px",margin:"0 auto",display:"flex",gap:"0",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}} className="trust-bar">
          {[["TCK","Türk Ceza Kanunu"],["CMK","Ceza Muhakemesi"],["HMK","Hukuk Muhakemeleri"],["TMK","Medeni Kanun"],["IIK","İcra ve Iflas"],["KVKK","Veri Güvenliği"]].map(([title,sub],i)=>(
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
              Avukatın Ihtiyaci Olan Her Sey<br/>
              <em style={{color:"var(--primary)",fontStyle:"italic"}}>Tek Yerde.</em>
            </h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"20px"}} className="feature-grid">
            {[
              {icon:"⏰",color:"var(--accent)",bg:"#FFF0EC",title:"Süre Takibi",desc:"Temyiz, itiraz, itirazen iptal — tum hukuki sureler otomatik takip. Son gunden 7 ve 3 gun once Telegram uyarisi.",badge:"Otomatik hatırlat"},
              {icon:"📝",color:"var(--primary)",bg:"var(--primary-light)",title:"Dilekçe Oluştur",desc:"Müvekkil bilgilerini soyleyin — mahkeme adina, dosya numarasina ve kanuna gore tam dilekçe saniyeler icinde.",badge:"Saniyeler içinde"},
              {icon:"🔍",color:"var(--secondary)",bg:"var(--secondary-light)",title:"Emsal Arama",desc:"Yargitay ve Danistay kararlarinda emsal arar, dava stratejinizi güçlendirecek ictihat ozetler.",badge:"Gerçek emsal"},
              {icon:"🧠",color:"#7C3AED",bg:"#F3E8FF",title:"Strateji Motoru",desc:"Dava dosyasini analiz eder, delil eksikliklerini tespit eder, alternatif hukuki stratejileri proaktif sunar.",badge:"Proaktif analiz"},
              {icon:"👥",color:"#0891B2",bg:"#E0F7FA",title:"Müvekkil CRM",desc:"Her müvekkilin dosyasi, sureci, delilleri ve yazismalari tek panelde. Hicbir detay kacirilmaz.",badge:"Tam dosya paneli"},
              {icon:"🔐",color:"#1e3a5f",bg:"var(--primary-light)",title:"Avukat Gizliligi",desc:"Müvekkil bilgileri AES-256 sifreleme. Avukat-muvekkil gizliligine tam uyumlu. Türkiye lokasyonu.",badge:"Gizlilik uyumlu"},
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
            <div className="section-label">Canlı Demo</div>
            <h2 style={{fontSize:"clamp(28px,3.5vw,42px)",fontWeight:"700",fontFamily:"Merriweather,serif",letterSpacing:"-0.02em",color:"var(--text)",margin:"0 0 20px",lineHeight:"1.15"}}>
              Iki Meslektaşlık<br/>
              <em style={{color:"var(--primary)",fontStyle:"italic"}}>Gibi Çalışın.</em>
            </h2>
            <div className="card" style={{padding:"20px",marginBottom:"24px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px",paddingBottom:"12px",borderBottom:"1px solid var(--border)"}}>
                <div style={{width:"36px",height:"36px",borderRadius:"50%",background:"var(--primary-light)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px"}}>⚖️</div>
                <div>
                  <div style={{fontSize:"13px",fontWeight:"700",color:"var(--text)",fontFamily:"Lato,sans-serif"}}>Kemal Celik — Istanbul Barosu</div>
                  <div style={{fontSize:"11px",color:"var(--secondary)",fontFamily:"Lato,sans-serif",display:"flex",alignItems:"center",gap:"4px"}}>
                    <span style={{width:"5px",height:"5px",borderRadius:"50%",background:"var(--secondary)",display:"inline-block"}}></span>Dinliyor
                  </div>
                </div>
              </div>
              {[
                {side:"right",text:"Ahmet Yılmaz dosyasi, hirsizlik suclama, ifade yarin."},
                {side:"left", text:"DIKKAT — TCK 145'e gore etkin pismanlik indirim hakki var. Sorgu oncesi bu stratejiyi degerlendirelim mi?"},
                {side:"right",text:"Evet, degerlendir."},
                {side:"left", text:"Etkin pismanlik beyani hazırladim. Ayrica 3 emsal karar buldum, cezayi 1/3 indirdi — dosyaya ekleyeyim mi?"},
                {side:"right",text:"Ekle."},
                {side:"left", text:"Eklendi. Savunma dilekçe taslagi da hazır — onayinizi bekliyor."},
              ].map((m,i)=>(
                <div key={i} style={{display:"flex",justifyContent:m.side==="right"?"flex-end":"flex-start",marginBottom:"8px"}}>
                  <div style={{maxWidth:"80%",padding:"8px 12px",borderRadius:m.side==="right"?"12px 12px 2px 12px":"12px 12px 12px 2px",background:m.side==="right"?"var(--primary)":"var(--bg)",color:m.side==="right"?"#fff":"var(--text)",fontSize:"12px",lineHeight:"1.5",fontFamily:"Lato,sans-serif"}}>{m.text}</div>
                </div>
              ))}
            </div>
            <Link href="/giris/avukat" className="btn-primary">Şimdi Baslayın</Link>
          </div>
          <div style={{position:"relative"}}>
            <div style={{borderRadius:"16px",overflow:"hidden",boxShadow:"0 20px 60px rgba(30,58,95,.12)"}}>
              <img src={CONSULT_IMG} alt="Avukat calisma" style={{width:"100%",height:"480px",objectFit:"cover",filter:"brightness(.95) saturate(.85)"}} />
            </div>
            <div className="card" style={{position:"absolute",bottom:"24px",right:"-20px",padding:"14px 18px",boxShadow:"0 8px 24px rgba(180,83,9,.15)",borderLeft:"4px solid var(--secondary)"}}>
              <div style={{fontSize:"11px",color:"var(--text-muted)",fontFamily:"Lato,sans-serif",marginBottom:"4px"}}>Otomatik Tespit</div>
              <div style={{fontSize:"13px",fontWeight:"700",color:"var(--text)",fontFamily:"Lato,sans-serif"}}>⚠️ Temyiz suresi 3 gun kaldi</div>
              <div style={{fontSize:"11px",color:"var(--secondary)",fontFamily:"Lato,sans-serif",marginTop:"3px"}}>CMK Md.291 referans alindi ✓</div>
            </div>
          </div>
        </div>
      </section>

      {/* SPECIALISTS */}
      <section id="uzmanlar" style={{background:"var(--primary)",padding:"80px 48px"}}>
        <div style={{maxWidth:"1200px",margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:"48px"}}>
            <h2 style={{fontSize:"clamp(28px,3.5vw,42px)",fontWeight:"700",fontFamily:"Merriweather,serif",color:"#fff",margin:"0 0 16px",letterSpacing:"-0.02em"}}>9 Uzman, 9 Hukuk Dalı.</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"8px"}}>
            {[
              {emoji:"⚖️",label:"Ceza Hukuku",book:"TCK / CMK"},
              {emoji:"👨‍👩‍👧",label:"Aile Hukuku",book:"TMK"},
              {emoji:"🏢",label:"Ticaret Hukuku",book:"TTK / TBK"},
              {emoji:"👷",label:"Is Hukuku",book:"Is K. 4857"},
              {emoji:"🏠",label:"Gayrimenkul",book:"Tapu / İmar K."},
              {emoji:"💸",label:"İcra & Iflas",book:"IIK"},
              {emoji:"🏛️",label:"İdare Hukuku",book:"IYUK"},
              {emoji:"🛒",label:"Tuketici Hukuku",book:"TKHK"},
              {emoji:"💻",label:"Bilişim & KVKK",book:"KVKK 6698"},
              {emoji:"📜",label:"Tum Dallar",book:"+ Daha Fazlasi"},
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
              {name:"Başlangıç",price:"499 TL",orig:"799 TL",features:["30 seans/ay","10 müvekkil","Süre takibi","Dilekçe oluşturma","Telegram uyarilari"],highlight:false,cta:"Başlayın"},
              {name:"Pro",price:"999 TL",orig:"1.599 TL",features:["Sınırsız seans","Sınırsız müvekkil","Her sey dahil","Emsal arama","Strateji motoru","Öncelikli destek"],highlight:true,cta:"En Popüler"},
              {name:"Hukuk Bürosu",price:"2.999 TL",orig:"4.999 TL",features:["Sınırsız seans","5 avukat","Takim paneli","Müvekkil portalı","Tüm özellikler"],highlight:false,cta:"Başlayın"},
            ].map((plan)=>(
              <div key={plan.name} className="card" style={{padding:"32px 28px",position:"relative",border:plan.highlight?"2px solid var(--primary)":"1px solid var(--border)",boxShadow:plan.highlight?"0 8px 32px rgba(30,58,95,.15)":"none"}}>
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
                <Link href="/giris/avukat" style={{display:"block",padding:"13px",textAlign:"center",borderRadius:"6px",textDecoration:"none",fontSize:"14px",fontWeight:"700",fontFamily:"Lato,sans-serif",background:plan.highlight?"var(--accent)":"transparent",color:plan.highlight?"#fff":"var(--primary)",border:plan.highlight?"none":"2px solid var(--primary)",boxShadow:plan.highlight?"0 4px 14px rgba(255,107,75,.3)":"none"}}>{plan.cta}</Link>
              </div>
            ))}
          </div>
          <div style={{textAlign:"center",marginTop:"24px",fontSize:"13px",color:"var(--text-muted)",fontFamily:"Lato,sans-serif"}}>14 gün ücretsiz · Kredi kartı gerektirmez · Dilediğinizde iptal</div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{background:"var(--primary-light)",padding:"80px 48px",borderTop:"2px solid var(--primary)",textAlign:"center"}}>
        <div className="section-label" style={{justifyContent:"center"}}>Başlamaya Hazır mısınız?</div>
        <h2 style={{fontSize:"clamp(30px,4vw,48px)",fontWeight:"700",fontFamily:"Merriweather,serif",color:"var(--text)",margin:"0 0 16px",letterSpacing:"-0.02em"}}>Bugün Başlayın.<br/><em style={{color:"var(--primary)",fontStyle:"italic"}}>İlk 14 Gün Ücretsiz.</em></h2>
        <p style={{fontSize:"17px",color:"var(--text-muted)",fontFamily:"Lato,sans-serif",margin:"0 0 36px",maxWidth:"420px",display:"inline-block",lineHeight:"1.75"}}>Kurucu üye fiyatını kaçırmayın. Ilk 100 avukat icin gecerli.</p>
        <div><Link href="/giris/avukat" className="btn-primary" style={{fontSize:"16px",padding:"16px 48px",boxShadow:"0 6px 20px rgba(255,107,75,.4)"}}>Ücretsiz Hesap Ac</Link></div>
        <div style={{marginTop:"16px",fontSize:"13px",color:"var(--text-muted)",fontFamily:"Lato,sans-serif"}}>KVKK uyumlu · Baro gizlilik standartlari · Dilediğinizde iptal</div>
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
