
import Link from "next/link"

// Free Unsplash images - specific photo IDs for consistent display
// All licensed under Unsplash License (free for commercial use)
const PHOTOS = {
  // Hero: doctor in dramatic dark lighting - confident pose
  hero: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=1600&q=90&fit=crop",
  // Doctor 1: female physician, warm confident portrait
  ayse: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800&q=90&fit=crop",
  // Doctor 2: male cardiologist, authoritative look
  mehmet: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&q=90&fit=crop",
  // Doctor 3: female neurologist, analytical expression
  elif: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&q=90&fit=crop",
  // Feature image: doctor with tablet/technology
  feature: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=90&fit=crop",
  // Safety: intensive care / focus
  safety: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=1200&q=90&fit=crop",
}

export default function HomePage() {
  return (
    <main style={{margin:0,padding:0,background:"#060910",color:"#fff",
                  fontFamily:"'Georgia','Times New Roman',serif",minHeight:"100vh",overflowX:"hidden"}}>

      {/* ── NAV ──────────────────────────────────────────────── */}
      <nav style={{position:"fixed",top:0,left:0,right:0,padding:"24px 48px",
                   display:"flex",alignItems:"center",justifyContent:"space-between",
                   zIndex:100,backdropFilter:"blur(20px)",
                   background:"linear-gradient(to bottom,rgba(6,9,16,0.9),transparent)"}}>
        <div style={{fontSize:"19px",fontWeight:"400",letterSpacing:"0.18em",color:"#fff"}}>
          NOTYA<span style={{color:"#2563EB"}}>.</span>AI
        </div>
        <div style={{display:"flex",gap:"32px",alignItems:"center"}}>
          {["Özellikler","Uzmanlar","Fiyatlar"].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`}
               style={{color:"rgba(255,255,255,.45)",fontSize:"12px",letterSpacing:"0.1em",
                       textDecoration:"none",textTransform:"uppercase",fontFamily:"system-ui"}}>
              {item}
            </a>
          ))}
          <Link href="/giris"
                style={{padding:"9px 22px",border:"1px solid rgba(255,255,255,.2)",borderRadius:"2px",
                        color:"rgba(255,255,255,.8)",fontSize:"12px",letterSpacing:"0.1em",
                        textDecoration:"none",textTransform:"uppercase",fontFamily:"system-ui",
                        backdropFilter:"blur(8px)",background:"rgba(255,255,255,.04)"}}>
            Giriş
          </Link>
        </div>
      </nav>

      {/* ── HERO — Full bleed photo ───────────────────────────── */}
      <section style={{position:"relative",height:"100vh",minHeight:"700px",overflow:"hidden"}}>

        {/* The photo */}
        <img src={PHOTOS.hero} alt="Uzman Doktor"
             style={{position:"absolute",inset:0,width:"100%",height:"100%",
                     objectFit:"cover",objectPosition:"center 20%",
                     filter:"brightness(0.35) saturate(0.8)"}} />

        {/* Overlay gradient — dark on left for text, photo shows on right */}
        <div style={{position:"absolute",inset:0,
                     background:"linear-gradient(105deg,rgba(6,9,16,0.97) 0%,rgba(6,9,16,0.75) 45%,rgba(6,9,16,0.25) 70%,rgba(6,9,16,0.45) 100%)"}} />

        {/* Subtle blue glow bottom-left */}
        <div style={{position:"absolute",bottom:"-10%",left:"-5%",width:"50vw",height:"50vw",
                     borderRadius:"50%",
                     background:"radial-gradient(ellipse,rgba(37,99,235,0.07) 0%,transparent 70%)",
                     pointerEvents:"none"}} />

        {/* Hero text */}
        <div style={{position:"relative",zIndex:10,height:"100%",display:"flex",
                     flexDirection:"column",justifyContent:"flex-end",
                     padding:"0 48px 96px",maxWidth:"780px"}}>

          <div style={{fontSize:"10px",letterSpacing:"0.35em",textTransform:"uppercase",
                       color:"#2563EB",marginBottom:"20px",fontFamily:"system-ui",
                       display:"flex",alignItems:"center",gap:"12px"}}>
            <span style={{width:"32px",height:"1px",background:"#2563EB",display:"inline-block"}}></span>
            Türkiye'nin İlk AI Tıp Uzmanı
          </div>

          <h1 style={{fontSize:"clamp(52px,7.5vw,96px)",fontWeight:"400",lineHeight:"0.98",
                      margin:"0 0 36px",letterSpacing:"-0.025em"}}>
            Cebinizdeki<br/>
            <em style={{color:"#2563EB",fontStyle:"italic"}}>Dünyaca Ünlü</em><br/>
            Uzman Doktor.
          </h1>

          <p style={{fontSize:"17px",lineHeight:"1.75",color:"rgba(255,255,255,.5)",
                     maxWidth:"480px",margin:"0 0 52px",fontFamily:"system-ui",
                     fontWeight:"300",letterSpacing:"0.005em"}}>
            Nelson, Braunwald, Harrison — dünyanın en güvenilir tıp
            kitaplarını bilen uzmanlar. Sesli konuşun, tanı alın,
            reçete yazın. Her seans, sizi daha iyi tanır.
          </p>

          <div style={{display:"flex",gap:"16px",alignItems:"center"}}>
            <Link href="/giris"
                  style={{display:"inline-block",padding:"17px 42px",
                          background:"#2563EB",color:"#fff",textDecoration:"none",
                          fontSize:"13px",letterSpacing:"0.1em",textTransform:"uppercase",
                          fontFamily:"system-ui",fontWeight:"500",borderRadius:"2px"}}>
              Ücretsiz Başlayın
            </Link>
            <Link href="/asistan"
                  style={{display:"inline-flex",alignItems:"center",gap:"10px",
                          color:"rgba(255,255,255,.4)",textDecoration:"none",
                          fontSize:"12px",letterSpacing:"0.08em",fontFamily:"system-ui"}}>
              <span style={{width:"28px",height:"1px",background:"rgba(255,255,255,.25)",
                            display:"inline-block"}}></span>
              Asistanı Dene
            </Link>
          </div>
        </div>

        {/* Bottom fade to black */}
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:"220px",
                     background:"linear-gradient(to top,#060910,transparent)",zIndex:5}} />
      </section>

      {/* ── TRUST STRIP ──────────────────────────────────────── */}
      <div style={{borderTop:"1px solid rgba(255,255,255,.05)",
                   borderBottom:"1px solid rgba(255,255,255,.05)",
                   padding:"24px 48px",display:"flex",gap:"0",overflowX:"auto",
                   background:"rgba(255,255,255,.015)"}}>
        {[
          ["Nelson 22e","Pediatri"],["Braunwald 12e","Kardiyoloji"],
          ["Harrison's 22e","Dahiliye"],["Adams & Victor 12e","Nöroloji"],
          ["DSM-5-TR","Psikiyatri"],["KVKK Uyumlu","AB Merkezi"],
        ].map(([title, sub], i) => (
          <div key={title}
               style={{flexShrink:0,padding:"0 40px",
                       borderRight:i<5?"1px solid rgba(255,255,255,.06)":"none"}}>
            <div style={{fontSize:"13px",color:"rgba(255,255,255,.6)",
                         fontFamily:"system-ui",whiteSpace:"nowrap",fontWeight:"500"}}>{title}</div>
            <div style={{fontSize:"10px",color:"rgba(255,255,255,.25)",fontFamily:"system-ui",
                         letterSpacing:"0.08em",textTransform:"uppercase",marginTop:"2px"}}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── FEATURE — Voice conversation with photo ───────────── */}
      <section id="özellikler" style={{padding:"130px 48px",display:"grid",
                                       gridTemplateColumns:"1fr 1fr",gap:"80px",
                                       alignItems:"center",maxWidth:"1300px",margin:"0 auto"}}>
        {/* Left text */}
        <div>
          <div style={{fontSize:"10px",letterSpacing:"0.3em",textTransform:"uppercase",
                       color:"#2563EB",marginBottom:"20px",fontFamily:"system-ui"}}>
            Sesli Konuşma
          </div>
          <h2 style={{fontSize:"clamp(38px,4.5vw,58px)",fontWeight:"400",lineHeight:"1.08",
                      margin:"0 0 28px",letterSpacing:"-0.025em"}}>
            İki Meslektaş<br/>
            <em style={{color:"rgba(255,255,255,.35)",fontStyle:"italic"}}>Gibi Konuşun.</em>
          </h2>
          <p style={{fontSize:"16px",lineHeight:"1.85",color:"rgba(255,255,255,.45)",
                     margin:"0 0 40px",fontFamily:"system-ui",fontWeight:"300"}}>
            Buton yok. Bekleme yok. Bir kez dokunun — Prof. Ayşe sizi
            karşılar. Cümlenizin ortasında araya girseniz, anında durur.
            Gerçek zamanlı. Tamamen doğal.
          </p>
          {[
            ["🎙️","Push-to-talk yok — her an dinliyor"],
            ["⚡","2 saniyede yanıt — sıfır gecikme"],
            ["🧠","10 seanstan sonra yıllardır birliktesiniz gibi"],
          ].map(([icon, text]) => (
            <div key={text as string}
                 style={{display:"flex",alignItems:"center",gap:"14px",
                         fontSize:"14px",color:"rgba(255,255,255,.55)",
                         fontFamily:"system-ui",marginBottom:"14px"}}>
              <span style={{fontSize:"20px"}}>{icon}</span>{text}
            </div>
          ))}
        </div>

        {/* Right — photo with overlay */}
        <div style={{position:"relative",borderRadius:"16px",overflow:"hidden",
                     aspectRatio:"4/5"}}>
          <img src={PHOTOS.feature} alt="Doktor teknoloji kullanıyor"
               style={{width:"100%",height:"100%",objectFit:"cover",
                       filter:"brightness(0.5) saturate(0.7)"}} />
          {/* Conversation overlay at bottom */}
          <div style={{position:"absolute",bottom:0,left:0,right:0,
                       background:"linear-gradient(to top,rgba(6,9,16,0.97) 0%,rgba(6,9,16,0.6) 50%,transparent 100%)",
                       padding:"32px 24px 24px"}}>
            <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              <div style={{alignSelf:"flex-end",background:"rgba(37,99,235,0.35)",
                           backdropFilter:"blur(8px)",border:"1px solid rgba(37,99,235,0.3)",
                           padding:"8px 14px",borderRadius:"12px 12px 2px 12px",
                           fontSize:"12px",color:"rgba(255,255,255,.85)",fontFamily:"system-ui",
                           maxWidth:"80%"}}>
                7 yaşında, 18 kilo. Ateş ve kulak ağrısı.
              </div>
              <div style={{alignSelf:"flex-start",display:"flex",gap:"8px",alignItems:"flex-end"}}>
                <div style={{width:"26px",height:"26px",borderRadius:"50%",
                             background:"#0F9B8E",display:"flex",alignItems:"center",
                             justifyContent:"center",fontSize:"12px",flexShrink:0}}>👩‍⚕️</div>
                <div style={{background:"rgba(255,255,255,.08)",backdropFilter:"blur(8px)",
                             border:"1px solid rgba(255,255,255,.1)",
                             padding:"8px 14px",borderRadius:"2px 12px 12px 12px",
                             fontSize:"12px",color:"rgba(255,255,255,.75)",fontFamily:"system-ui",
                             maxWidth:"80%",lineHeight:"1.5"}}>
                  Amoksisilin 40 mg/kg/gün yazayım mı doktor?
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LEARNING — Dark full-bleed section with photo ──────── */}
      <section style={{position:"relative",overflow:"hidden",
                       padding:"140px 48px"}}>
        {/* Background photo */}
        <img src={PHOTOS.safety} alt="Klinik ortam"
             style={{position:"absolute",inset:0,width:"100%",height:"100%",
                     objectFit:"cover",objectPosition:"center",
                     filter:"brightness(0.15) saturate(0.5)"}} />
        <div style={{position:"absolute",inset:0,
                     background:"linear-gradient(to right,rgba(6,9,16,0.98) 0%,rgba(6,9,16,0.85) 50%,rgba(6,9,16,0.7) 100%)"}} />

        <div style={{position:"relative",zIndex:1,maxWidth:"1100px",margin:"0 auto"}}>
          <div style={{maxWidth:"580px",marginBottom:"72px"}}>
            <div style={{fontSize:"10px",letterSpacing:"0.3em",textTransform:"uppercase",
                         color:"#2563EB",marginBottom:"20px",fontFamily:"system-ui"}}>
              Öğrenen Sistem
            </div>
            <h2 style={{fontSize:"clamp(38px,5vw,64px)",fontWeight:"400",lineHeight:"1.05",
                        letterSpacing:"-0.025em",margin:"0 0 24px"}}>
              10 Seans Sonra<br/>
              <em style={{color:"rgba(255,255,255,.3)",fontStyle:"italic"}}>
                Yıllardır Birliktesiniz.
              </em>
            </h2>
            <p style={{fontSize:"16px",lineHeight:"1.85",color:"rgba(255,255,255,.4)",
                       fontFamily:"system-ui",fontWeight:"300"}}>
              Her düzelttiğiniz ilaç, her değiştirdiğiniz doz, her tercih —
              öğrenir. Sorulmadan hatırlar. Meslektaş gibi davranır.
            </p>
          </div>

          {/* Before / After cards */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px",maxWidth:"820px"}}>
            <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",
                         borderRadius:"16px",padding:"32px",backdropFilter:"blur(12px)"}}>
              <div style={{fontSize:"10px",letterSpacing:"0.2em",textTransform:"uppercase",
                           color:"rgba(255,255,255,.25)",fontFamily:"system-ui",marginBottom:"20px"}}>
                1. Seans
              </div>
              <div style={{fontSize:"13px",color:"rgba(255,255,255,.35)",fontFamily:"system-ui",
                           fontStyle:"italic",marginBottom:"8px"}}>"Amoksisilin yaz."</div>
              <div style={{fontSize:"13px",color:"rgba(255,255,255,.55)",fontFamily:"system-ui",
                           background:"rgba(255,255,255,.04)",padding:"10px 14px",borderRadius:"8px",
                           lineHeight:"1.6"}}>
                Hangi dozu yazayım, doktor? Hangi markayı tercih edersiniz?
              </div>
            </div>
            <div style={{background:"rgba(37,99,235,.08)",border:"1px solid rgba(37,99,235,.3)",
                         borderRadius:"16px",padding:"32px",backdropFilter:"blur(12px)",
                         position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:"20px",right:"20px",height:"1px",
                           background:"linear-gradient(90deg,transparent,#2563EB,transparent)"}} />
              <div style={{fontSize:"10px",letterSpacing:"0.2em",textTransform:"uppercase",
                           color:"#2563EB",fontFamily:"system-ui",marginBottom:"20px"}}>
                10. Seans
              </div>
              <div style={{fontSize:"13px",color:"rgba(255,255,255,.35)",fontFamily:"system-ui",
                           fontStyle:"italic",marginBottom:"8px"}}>"Amoksisilin yaz."</div>
              <div style={{fontSize:"13px",color:"rgba(255,255,255,.8)",fontFamily:"system-ui",
                           background:"rgba(37,99,235,.1)",padding:"12px 14px",borderRadius:"8px",
                           lineHeight:"1.65"}}>
                40 mg/kg/gün, bu kiloda 720 mg. Bildiğiniz gibi Amoksiklav
                tercih ediyorsunuz — onu mu yazayım doktor?
              </div>
              <div style={{marginTop:"14px",fontSize:"11px",color:"rgba(37,99,235,.6)",
                           fontFamily:"system-ui",fontStyle:"italic"}}>
                ✦ Sormadınız — o hatırladı.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SPECIALISTS — Photo cards ────────────────────────── */}
      <section id="uzmanlar" style={{padding:"130px 48px",maxWidth:"1300px",margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:"80px"}}>
          <div style={{fontSize:"10px",letterSpacing:"0.3em",textTransform:"uppercase",
                       color:"#2563EB",marginBottom:"20px",fontFamily:"system-ui"}}>
            Uzman Kadromuz
          </div>
          <h2 style={{fontSize:"clamp(38px,4.5vw,58px)",fontWeight:"400",lineHeight:"1.08",
                      letterSpacing:"-0.025em",margin:0}}>
            Üç Uzman.<br/>
            <em style={{color:"rgba(255,255,255,.3)",fontStyle:"italic"}}>
              Tek Uygulama.
            </em>
          </h2>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"20px"}}>
          {[
            {name:"Prof. Ayşe Kaya",    title:"Pediatri Uzmanı",      photo:PHOTOS.ayse,
             color:"#0F9B8E",  char:"Sıcak · Sabırlı",    books:"Nelson 22e · Harriet Lane 23e"},
            {name:"Prof. Mehmet Demir", title:"Kardiyoloji Uzmanı",   photo:PHOTOS.mehmet,
             color:"#2563EB",  char:"Hızlı · Net",        books:"Braunwald 12e · ESC 2024"},
            {name:"Prof. Elif Şahin",   title:"Nöroloji & Dahiliye",  photo:PHOTOS.elif,
             color:"#7C3AED",  char:"Analitik · Dikkatli", books:"Harrison's 22e · Adams & Victor"},
          ].map(spec => (
            <div key={spec.name}
                 style={{borderRadius:"16px",overflow:"hidden",position:"relative",
                         aspectRatio:"3/4",cursor:"pointer"}}>
              {/* Photo */}
              <img src={spec.photo} alt={spec.name}
                   style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top center",
                           filter:"brightness(0.55) saturate(0.75)",transition:"filter .4s"}} />

              {/* Top color bar */}
              <div style={{position:"absolute",top:0,left:0,right:0,height:"3px",
                           background:`linear-gradient(90deg,transparent,${spec.color},transparent)`}} />

              {/* Bottom overlay */}
              <div style={{position:"absolute",bottom:0,left:0,right:0,
                           background:"linear-gradient(to top,rgba(6,9,16,0.97) 0%,rgba(6,9,16,0.6) 60%,transparent 100%)",
                           padding:"28px 24px 24px"}}>
                <div style={{fontSize:"16px",fontWeight:"400",color:"#fff",
                             fontFamily:"'Georgia',serif",marginBottom:"4px"}}>{spec.name}</div>
                <div style={{fontSize:"11px",color:spec.color,fontFamily:"system-ui",
                             letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:"10px"}}>
                  {spec.title}
                </div>
                <div style={{fontSize:"11px",color:"rgba(255,255,255,.35)",fontFamily:"system-ui",
                             fontStyle:"italic",marginBottom:"8px"}}>{spec.char}</div>
                <div style={{fontSize:"11px",color:"rgba(255,255,255,.25)",fontFamily:"system-ui"}}>
                  {spec.books}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SAFETY ───────────────────────────────────────────── */}
      <section style={{background:"#040710",padding:"110px 48px",
                       borderTop:"1px solid rgba(255,255,255,.04)"}}>
        <div style={{maxWidth:"680px",margin:"0 auto",textAlign:"center"}}>
          <div style={{fontSize:"10px",letterSpacing:"0.3em",textTransform:"uppercase",
                       color:"#2563EB",marginBottom:"20px",fontFamily:"system-ui"}}>
            Güvenlik Ağı
          </div>
          <h2 style={{fontSize:"clamp(34px,4.5vw,54px)",fontWeight:"400",lineHeight:"1.1",
                      letterSpacing:"-0.025em",marginBottom:"24px"}}>
            50 Hasta, Yorgun Bir Gün —<br/>
            <em style={{color:"rgba(255,255,255,.3)",fontStyle:"italic"}}>O Asla Susmaz.</em>
          </h2>
          <p style={{fontSize:"16px",color:"rgba(255,255,255,.38)",lineHeight:"1.9",
                     fontFamily:"system-ui",fontWeight:"300",marginBottom:"52px"}}>
            Yanlış doz, tehlikeli kombinasyon, atlanmış SGK kısıtlaması —
            sormadan söyler. Duraksatır. Doğrusunu önerir.
          </p>
          <div style={{background:"#080E1A",border:"1px solid rgba(255,255,255,.07)",
                       borderRadius:"14px",padding:"28px 32px",textAlign:"left",
                       position:"relative"}}>
            <div style={{position:"absolute",top:"-1px",left:"32px",right:"32px",height:"1px",
                         background:"linear-gradient(90deg,transparent,rgba(239,68,68,.4),transparent)"}} />
            <div style={{fontSize:"10px",letterSpacing:"0.15em",textTransform:"uppercase",
                         color:"rgba(239,68,68,.6)",fontFamily:"system-ui",marginBottom:"12px"}}>
              ⚠ Örnek Uyarı
            </div>
            <div style={{fontSize:"15px",color:"rgba(255,255,255,.7)",fontFamily:"system-ui",
                         lineHeight:"1.75",fontStyle:"italic"}}>
              "Doktor, bir saniye — bu doz yetişkin dozudur. Nelson'a göre
              bu kiloda maksimum 250 mg olmalı. Düzelteyim mi?"
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section id="fiyatlar" style={{padding:"130px 48px",maxWidth:"1100px",margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:"72px"}}>
          <div style={{fontSize:"10px",letterSpacing:"0.3em",textTransform:"uppercase",
                       color:"#2563EB",marginBottom:"20px",fontFamily:"system-ui"}}>Fiyatlandırma</div>
          <h2 style={{fontSize:"clamp(36px,4vw,52px)",fontWeight:"400",
                      letterSpacing:"-0.025em",fontFamily:"'Georgia',serif"}}>
            Sade. Şeffaf. Adil.
          </h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"2px",borderRadius:"16px",overflow:"hidden"}}>
          {[
            {name:"Starter",price:"₺499",sub:"/ay",highlight:false,
             items:["50 seans/ay","1 kullanıcı","SOAP notları","AI Uzman Asistan"]},
            {name:"Pro",price:"₺1.299",sub:"/ay",highlight:true,
             items:["Sınırsız seans","1 kullanıcı","Öğrenen sistem","Tüm uzmanlar","ICD-10 kodlama"]},
            {name:"Klinik",price:"₺3.999",sub:"/ay",highlight:false,
             items:["Sınırsız seans","5 kullanıcı","Klinik raporlar","Öncelikli destek"]},
          ].map((plan, i) => (
            <div key={plan.name}
                 style={{background:plan.highlight?"#081A35":"#080E1A",
                         padding:"48px 36px",position:"relative",
                         border:plan.highlight?"1px solid rgba(37,99,235,.3)":"none"}}>
              {plan.highlight && (
                <div style={{position:"absolute",top:0,left:0,right:0,height:"3px",
                             background:"linear-gradient(90deg,transparent,#2563EB,transparent)"}} />
              )}
              {plan.highlight && (
                <div style={{position:"absolute",top:"16px",right:"16px",fontSize:"9px",
                             letterSpacing:"0.1em",background:"#2563EB",color:"#fff",
                             padding:"4px 10px",borderRadius:"20px",fontFamily:"system-ui"}}>
                  EN POPÜLER
                </div>
              )}
              <div style={{fontSize:"12px",color:"rgba(255,255,255,.4)",fontFamily:"system-ui",
                           letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"16px"}}>
                {plan.name}
              </div>
              <div style={{marginBottom:"28px"}}>
                <span style={{fontSize:"40px",fontWeight:"400",color:"#fff",
                               fontFamily:"'Georgia',serif"}}>{plan.price}</span>
                <span style={{fontSize:"14px",color:"rgba(255,255,255,.3)",
                               fontFamily:"system-ui"}}>{plan.sub}</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"36px"}}>
                {plan.items.map(item => (
                  <div key={item} style={{display:"flex",alignItems:"center",gap:"10px",
                                          fontSize:"13px",color:"rgba(255,255,255,.55)",
                                          fontFamily:"system-ui"}}>
                    <span style={{color:plan.highlight?"#2563EB":"rgba(255,255,255,.3)"}}>✓</span>
                    {item}
                  </div>
                ))}
              </div>
              <Link href="/giris"
                    style={{display:"block",padding:"13px 24px",textAlign:"center",
                            background:plan.highlight?"#2563EB":"transparent",
                            border:`1px solid ${plan.highlight?"#2563EB":"rgba(255,255,255,.12)"}`,
                            color:"#fff",textDecoration:"none",fontSize:"12px",
                            letterSpacing:"0.09em",textTransform:"uppercase",
                            borderRadius:"2px",fontFamily:"system-ui"}}>
                Başlayın
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA — Full bleed photo ─────────────────────── */}
      <section style={{position:"relative",padding:"160px 48px",textAlign:"center",
                       overflow:"hidden"}}>
        <img src={PHOTOS.hero} alt=""
             style={{position:"absolute",inset:0,width:"100%",height:"100%",
                     objectFit:"cover",objectPosition:"center 30%",
                     filter:"brightness(0.18) saturate(0.5)"}} />
        <div style={{position:"absolute",inset:0,
                     background:"rgba(6,9,16,0.7)"}} />
        <div style={{position:"relative",zIndex:1}}>
          <h2 style={{fontSize:"clamp(42px,6vw,78px)",fontWeight:"400",lineHeight:"1.05",
                      letterSpacing:"-0.025em",marginBottom:"36px"}}>
            Bugün Başlayın.<br/>
            <em style={{color:"rgba(255,255,255,.3)",fontStyle:"italic"}}>
              İlk 14 Gün Ücretsiz.
            </em>
          </h2>
          <Link href="/giris"
                style={{display:"inline-block",padding:"19px 56px",background:"#2563EB",
                        color:"#fff",textDecoration:"none",fontSize:"14px",
                        letterSpacing:"0.1em",textTransform:"uppercase",
                        fontFamily:"system-ui",fontWeight:"500",borderRadius:"2px"}}>
            Ücretsiz Hesap Aç
          </Link>
          <div style={{marginTop:"18px",fontSize:"12px",color:"rgba(255,255,255,.2)",
                       fontFamily:"system-ui"}}>
            Kredi kartı gerekmez · KVKK uyumlu · Türkçe destek
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{padding:"36px 48px",borderTop:"1px solid rgba(255,255,255,.05)",
                      display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:"17px",letterSpacing:"0.18em",color:"rgba(255,255,255,.35)",
                     fontFamily:"'Georgia',serif"}}>
          NOTYA<span style={{color:"#2563EB"}}>.</span>AI
        </div>
        <div style={{fontSize:"11px",color:"rgba(255,255,255,.18)",fontFamily:"system-ui"}}>
          © 2026 Dream Türkiye · KVKK Uyumlu · Frankfurt, EU
        </div>
      </footer>

    </main>
  )
}
