
import Link from "next/link"

export default function HomePage() {

  // Unsplash photo IDs — free commercial use, no attribution needed for display
  const HERO_IMG    = "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1800&q=85&fit=crop"  // Doctor at desk, moody lighting
  const FEATURE_IMG = "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=85&fit=crop" // Clinical conversation
  const TRUST_IMG   = "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&q=85&fit=crop"   // Stethoscope on notes

  return (
    <main style={{margin:0,padding:0,background:"#05080F",color:"#fff",fontFamily:"'Georgia','Times New Roman',serif",overflowX:"hidden"}}>

      {/* ══ NAV ══════════════════════════════════════════════════ */}
      <nav style={{position:"fixed",top:0,left:0,right:0,padding:"22px 48px",display:"flex",alignItems:"center",justifyContent:"space-between",zIndex:100,background:"linear-gradient(to bottom,rgba(5,8,15,.95),transparent)"}}>
        <div style={{fontSize:"18px",fontWeight:"400",letterSpacing:"0.18em",color:"#fff"}}>
          NOTYA<span style={{color:"#2563EB"}}>.</span>AI
        </div>
        <div style={{display:"flex",gap:"32px",alignItems:"center"}}>
          {["Özellikler","Uzmanlar","Fiyatlar"].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`}
              style={{color:"rgba(255,255,255,.45)",fontSize:"12px",letterSpacing:"0.1em",textDecoration:"none",textTransform:"uppercase",fontFamily:"system-ui"}}>
              {item}
            </a>
          ))}
          <Link href="/giris"
            style={{padding:"9px 22px",border:"1px solid rgba(255,255,255,.2)",color:"rgba(255,255,255,.7)",fontSize:"12px",letterSpacing:"0.1em",textDecoration:"none",textTransform:"uppercase",fontFamily:"system-ui",background:"rgba(255,255,255,.03)",backdropFilter:"blur(12px)",borderRadius:"1px"}}>
            Giriş
          </Link>
        </div>
      </nav>

      {/* ══ HERO — FULL BLEED PHOTO ══════════════════════════════ */}
      <section style={{position:"relative",height:"100vh",minHeight:"700px",overflow:"hidden"}}>

        {/* The photograph */}
        <img src={HERO_IMG} alt="" aria-hidden="true"
          style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"center 30%",filter:"brightness(0.45) saturate(0.8)"}} />

        {/* Dark gradient overlay — heavier on left for text legibility */}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(105deg,rgba(5,8,15,0.92) 0%,rgba(5,8,15,0.65) 45%,rgba(5,8,15,0.2) 100%)"}} />

        {/* Blue accent light — top right, subtle */}
        <div style={{position:"absolute",top:"-15%",right:"-5%",width:"50vw",height:"60vh",
                     background:"radial-gradient(ellipse,rgba(37,99,235,0.15) 0%,transparent 65%)",
                     pointerEvents:"none"}} />

        {/* Content */}
        <div style={{position:"relative",zIndex:10,height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",padding:"0 48px 80px",maxWidth:"860px"}}>

          <div style={{fontSize:"11px",letterSpacing:"0.3em",textTransform:"uppercase",color:"#2563EB",marginBottom:"28px",fontFamily:"system-ui",fontStyle:"normal"}}>
            Türkiye'nin İlk Yapay Zeka Tıp Uzmanı
          </div>

          <h1 style={{fontSize:"clamp(52px,7.5vw,100px)",fontWeight:"400",lineHeight:"0.97",margin:"0 0 36px",letterSpacing:"-0.03em"}}>
            Cebinizdeki<br/>
            <em style={{color:"#2563EB",fontStyle:"italic"}}>Dünyaca Ünlü</em><br/>
            Uzman Doktor.
          </h1>

          <p style={{fontSize:"19px",lineHeight:"1.75",color:"rgba(255,255,255,.5)",maxWidth:"500px",margin:"0 0 52px",fontFamily:"system-ui",fontWeight:"300"}}>
            Nelson, Braunwald ve Harrison'ı başucu kitabı olarak bilen üç uzman.
            Sesli. Gerçek zamanlı. Sizi tanıyan.
          </p>

          <div style={{display:"flex",gap:"20px",alignItems:"center",flexWrap:"wrap"}}>
            <Link href="/giris"
              style={{padding:"18px 44px",background:"#2563EB",color:"#fff",textDecoration:"none",fontSize:"13px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"system-ui",fontWeight:"500",borderRadius:"1px"}}>
              Ücretsiz Başlayın
            </Link>
            <Link href="/asistan"
              style={{display:"flex",alignItems:"center",gap:"10px",color:"rgba(255,255,255,.4)",textDecoration:"none",fontSize:"13px",letterSpacing:"0.06em",fontFamily:"system-ui"}}>
              <span style={{width:"36px",height:"1px",background:"rgba(255,255,255,.25)"}}></span>
              Demoyu Gör
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{position:"absolute",bottom:"36px",left:"50%",transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:"6px",zIndex:10,opacity:.4}}>
          <div style={{width:"1px",height:"48px",background:"linear-gradient(to bottom,rgba(255,255,255,.6),transparent)"}} />
          <div style={{fontSize:"9px",letterSpacing:"0.2em",textTransform:"uppercase",color:"rgba(255,255,255,.6)",fontFamily:"system-ui"}}>Keşfet</div>
        </div>
      </section>

      {/* ══ TRUST BAR ════════════════════════════════════════════ */}
      <section style={{padding:"28px 48px",borderTop:"1px solid rgba(255,255,255,.05)",borderBottom:"1px solid rgba(255,255,255,.05)",display:"flex",gap:"0",overflowX:"auto",background:"rgba(255,255,255,.02)"}}>
        {[
          ["Nelson 22e","Pediatri"],["Braunwald 12e","Kardiyoloji"],["Harrison's 22e","Dahiliye"],
          ["Adams & Victor 12e","Nöroloji"],["DSM-5-TR","Psikiyatri"],["KVKK Uyumlu","AB Frankfurt"],
        ].map(([title,sub],i) => (
          <div key={title} style={{flexShrink:0,padding:"0 44px",borderRight:i<5?"1px solid rgba(255,255,255,.06)":"none"}}>
            <div style={{fontSize:"13px",fontWeight:"400",color:"rgba(255,255,255,.55)",fontFamily:"system-ui",whiteSpace:"nowrap"}}>{title}</div>
            <div style={{fontSize:"10px",color:"rgba(255,255,255,.25)",fontFamily:"system-ui",letterSpacing:"0.08em",textTransform:"uppercase",marginTop:"3px"}}>{sub}</div>
          </div>
        ))}
      </section>

      {/* ══ FEATURE — SPLIT WITH PHOTO ═══════════════════════════ */}
      <section id="özellikler" style={{display:"grid",gridTemplateColumns:"1fr 1fr",minHeight:"600px"}}>

        {/* Left — photograph */}
        <div style={{position:"relative",overflow:"hidden",minHeight:"500px"}}>
          <img src={FEATURE_IMG} alt="Doktor muayene" 
            style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"center",filter:"brightness(0.5) saturate(0.75)"}} />
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to right,transparent 60%,#05080F)"}} />
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,#05080F 0%,transparent 40%)"}} />
          {/* Floating quote on photo */}
          <div style={{position:"absolute",bottom:"48px",left:"48px",right:"80px",zIndex:10}}>
            <div style={{fontSize:"22px",fontWeight:"400",fontFamily:"'Georgia',serif",lineHeight:"1.4",color:"rgba(255,255,255,.85)",fontStyle:"italic"}}>
              "Sanki yıllardır birlikte çalışıyoruz."
            </div>
            <div style={{fontSize:"12px",color:"rgba(255,255,255,.35)",fontFamily:"system-ui",marginTop:"10px",letterSpacing:"0.06em"}}>
              — Dr. Gökhan S., Pediatrist
            </div>
          </div>
        </div>

        {/* Right — text */}
        <div style={{padding:"80px 64px",display:"flex",flexDirection:"column",justifyContent:"center",background:"#07101A"}}>
          <div style={{fontSize:"10px",letterSpacing:"0.3em",textTransform:"uppercase",color:"#2563EB",marginBottom:"20px",fontFamily:"system-ui"}}>
            Sesli Konuşma
          </div>
          <h2 style={{fontSize:"clamp(32px,3.5vw,50px)",fontWeight:"400",lineHeight:"1.1",margin:"0 0 28px",letterSpacing:"-0.02em"}}>
            İki Meslektaş<br/>
            <em style={{color:"rgba(255,255,255,.3)",fontStyle:"italic"}}>Gibi Konuşun.</em>
          </h2>
          <p style={{fontSize:"16px",lineHeight:"1.85",color:"rgba(255,255,255,.45)",margin:"0 0 40px",fontFamily:"system-ui",fontWeight:"300"}}>
            Buton yok. Bekleme yok. Mikrofona bir kez dokunun, Prof. Ayşe sizi karşılar.
            Cümlenizin ortasında söz kesebilirsiniz — o anında durur.
          </p>
          {[
            ["🎙️","Her an dinliyor — push-to-talk yok"],
            ["⚡","2 saniyede yanıt — gerçek zamanlı"],
            ["🔄","Araya girince anında durur"],
            ["🧠","Her seanstan öğrenir"],
          ].map(([icon,text]) => (
            <div key={text} style={{display:"flex",alignItems:"center",gap:"14px",fontSize:"14px",color:"rgba(255,255,255,.5)",fontFamily:"system-ui",marginBottom:"14px"}}>
              <span style={{fontSize:"18px",width:"24px",textAlign:"center"}}>{icon}</span>{text}
            </div>
          ))}
          <Link href="/asistan"
            style={{display:"inline-flex",alignItems:"center",gap:"10px",marginTop:"16px",color:"#2563EB",textDecoration:"none",fontSize:"13px",letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"system-ui"}}>
            Deneyin
            <span style={{width:"28px",height:"1px",background:"#2563EB"}}></span>
          </Link>
        </div>
      </section>

      {/* ══ LEARNING — FULL BLEED DARK SECTION ══════════════════ */}
      <section style={{position:"relative",overflow:"hidden",padding:"140px 48px",background:"#030710"}}>

        {/* Background photo, very dark */}
        <img src={TRUST_IMG} alt="" aria-hidden="true"
          style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"center",filter:"brightness(0.1) saturate(0.4)",opacity:.7}} />
        <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(3,7,16,.97),rgba(3,7,16,.92))"}} />

        <div style={{position:"relative",zIndex:10,maxWidth:"1200px",margin:"0 auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"80px",alignItems:"center"}}>

            {/* Left */}
            <div>
              <div style={{fontSize:"10px",letterSpacing:"0.3em",textTransform:"uppercase",color:"#2563EB",marginBottom:"20px",fontFamily:"system-ui"}}>
                Öğrenen Sistem
              </div>
              <h2 style={{fontSize:"clamp(36px,4vw,58px)",fontWeight:"400",lineHeight:"1.08",margin:"0 0 28px",letterSpacing:"-0.02em"}}>
                10 Seans Sonra<br/>
                <em style={{color:"rgba(255,255,255,.3)",fontStyle:"italic"}}>Yıllardır Birliktesiniz.</em>
              </h2>
              <p style={{fontSize:"16px",lineHeight:"1.85",color:"rgba(255,255,255,.4)",fontFamily:"system-ui",fontWeight:"300",marginBottom:"36px"}}>
                Her düzeltme öğrenir. Her tercih hatırlanır. Her alışkanlık kayıt altına alınır.
                1. seans ile 10. seans arasındaki fark gece ile gündüz gibidir.
              </p>
              <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
                {[
                  "Tercih ettiğiniz ilaç markalarını öğrenir",
                  "Not stilinize göre uzun veya kısa yazar",
                  "Sık koyduğunuz tanıları önde önerir",
                  "Her düzeltmeden sonra bir daha aynı hatayı yapmaz",
                ].map(item => (
                  <div key={item} style={{display:"flex",alignItems:"flex-start",gap:"12px",fontSize:"14px",color:"rgba(255,255,255,.45)",fontFamily:"system-ui"}}>
                    <span style={{color:"#2563EB",marginTop:"2px",flexShrink:0}}>✦</span>{item}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — comparison cards */}
            <div style={{display:"flex",flexDirection:"column",gap:"3px"}}>
              {/* 1st session */}
              <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.06)",padding:"28px 32px",borderRadius:"12px 12px 0 0"}}>
                <div style={{fontSize:"10px",letterSpacing:"0.2em",textTransform:"uppercase",color:"rgba(255,255,255,.25)",fontFamily:"system-ui",marginBottom:"16px"}}>1. Seans</div>
                <div style={{fontSize:"13px",color:"rgba(255,255,255,.35)",fontFamily:"system-ui",fontStyle:"italic",marginBottom:"8px"}}>"Amoksisilin yaz."</div>
                <div style={{fontSize:"13px",color:"rgba(255,255,255,.5)",fontFamily:"system-ui",background:"rgba(255,255,255,.04)",padding:"10px 14px",borderRadius:"6px"}}>
                  Hangi dozu yazayım, doktor?
                </div>
              </div>
              {/* Arrow */}
              <div style={{textAlign:"center",padding:"8px 0",fontSize:"16px",color:"rgba(37,99,235,.4)"}}>↓</div>
              {/* 10th session */}
              <div style={{background:"rgba(37,99,235,.08)",border:"1px solid rgba(37,99,235,.2)",padding:"28px 32px",borderRadius:"0 0 12px 12px",position:"relative"}}>
                <div style={{position:"absolute",top:0,left:"24px",right:"24px",height:"1px",background:"linear-gradient(90deg,transparent,#2563EB,transparent)"}} />
                <div style={{fontSize:"10px",letterSpacing:"0.2em",textTransform:"uppercase",color:"#2563EB",fontFamily:"system-ui",marginBottom:"16px"}}>10. Seans</div>
                <div style={{fontSize:"13px",color:"rgba(255,255,255,.35)",fontFamily:"system-ui",fontStyle:"italic",marginBottom:"8px"}}>"Amoksisilin yaz."</div>
                <div style={{fontSize:"13px",color:"rgba(255,255,255,.7)",fontFamily:"system-ui",background:"rgba(37,99,235,.1)",padding:"10px 14px",borderRadius:"6px",lineHeight:"1.65"}}>
                  40 mg/kg/gün, bu kiloda 720 mg. Bildiğiniz gibi Amoksiklav yazıyorsunuz — onu mu yazayım, doktor?
                </div>
                <div style={{marginTop:"12px",fontSize:"12px",color:"rgba(37,99,235,.6)",fontFamily:"system-ui",fontStyle:"italic"}}>
                  ✦ Sormadınız — hatırladı.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SPECIALISTS — PHOTO CARDS ════════════════════════════ */}
      <section id="uzmanlar" style={{padding:"120px 48px",background:"#05080F"}}>
        <div style={{maxWidth:"1200px",margin:"0 auto"}}>
          <div style={{marginBottom:"72px"}}>
            <div style={{fontSize:"10px",letterSpacing:"0.3em",textTransform:"uppercase",color:"#2563EB",marginBottom:"18px",fontFamily:"system-ui"}}>Uzman Kadromuz</div>
            <h2 style={{fontSize:"clamp(36px,4.5vw,60px)",fontWeight:"400",lineHeight:"1.05",letterSpacing:"-0.02em",maxWidth:"600px"}}>
              Üç Uzman.<br/>
              <em style={{color:"rgba(255,255,255,.3)",fontStyle:"italic"}}>Sonsuz Güven.</em>
            </h2>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"2px"}}>
            {[
              {
                name:"Prof. Ayşe Kaya",
                title:"Pediatri Uzmanı",
                char:"Sıcak · Sabırlı · Destekleyici",
                books:["Nelson Textbook 22e","Harriet Lane 23e","Oski's Pediatrics 4e"],
                color:"#0F9B8E",
                photo:"https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80&fit=crop&crop=face",
                greeting:"Merhaba doktor. Hangi hastamıza bakıyoruz bugün?"
              },
              {
                name:"Prof. Mehmet Demir",
                title:"Kardiyoloji Uzmanı",
                char:"Hızlı · Net · Güven Verici",
                books:["Braunwald Heart Disease 12e","ESC Guidelines 2024","ACC/AHA 2024"],
                color:"#2563EB",
                photo:"https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=80&fit=crop&crop=face",
                greeting:"Doktor, dinliyorum."
              },
              {
                name:"Prof. Elif Şahin",
                title:"Nöroloji & Dahiliye",
                char:"Analitik · Dikkatli · Kapsamlı",
                books:["Harrison's Principles 22e","Adams & Victor 12e","Goldman-Cecil 27e"],
                color:"#7C3AED",
                photo:"https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=600&q=80&fit=crop&crop=face",
                greeting:"Merhaba doktor. Vakayı dinliyorum."
              },
            ].map((spec, i) => (
              <div key={spec.name} style={{position:"relative",overflow:"hidden",minHeight:"480px",
                                           borderRadius:i===0?"16px 0 0 16px":i===2?"0 16px 16px 0":"0"}}>
                {/* Photo */}
                <img src={spec.photo} alt={spec.name}
                  style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top",filter:"brightness(0.4) saturate(0.7) contrast(1.1)"}} />
                {/* Gradient overlay */}
                <div style={{position:"absolute",inset:0,background:`linear-gradient(to top,rgba(5,8,15,0.98) 0%,rgba(5,8,15,0.4) 50%,rgba(5,8,15,0.1) 100%)`}} />
                {/* Color accent line */}
                <div style={{position:"absolute",top:0,left:0,right:0,height:"3px",background:`linear-gradient(90deg,transparent,${spec.color},transparent)`}} />

                {/* Content */}
                <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"36px 32px",zIndex:10}}>
                  <div style={{fontSize:"12px",color:spec.color,fontFamily:"system-ui",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:"8px"}}>{spec.title}</div>
                  <div style={{fontSize:"22px",fontWeight:"400",color:"#fff",fontFamily:"'Georgia',serif",marginBottom:"8px"}}>{spec.name}</div>
                  <div style={{fontSize:"12px",color:"rgba(255,255,255,.35)",fontFamily:"system-ui",fontStyle:"italic",marginBottom:"20px"}}>{spec.char}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:"5px",marginBottom:"20px"}}>
                    {spec.books.map(b => (
                      <div key={b} style={{fontSize:"11px",color:"rgba(255,255,255,.3)",fontFamily:"system-ui",display:"flex",alignItems:"center",gap:"6px"}}>
                        <span style={{width:"14px",height:"1px",background:`${spec.color}55`,display:"inline-block",flexShrink:0}}></span>{b}
                      </div>
                    ))}
                  </div>
                  <div style={{borderTop:"1px solid rgba(255,255,255,.08)",paddingTop:"16px",fontSize:"12px",color:"rgba(255,255,255,.3)",fontFamily:"system-ui",fontStyle:"italic",lineHeight:"1.6"}}>
                    "{spec.greeting}"
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SAFETY ═══════════════════════════════════════════════ */}
      <section style={{background:"#030710",padding:"120px 48px",borderTop:"1px solid rgba(255,255,255,.04)"}}>
        <div style={{maxWidth:"720px",margin:"0 auto",textAlign:"center"}}>
          <div style={{fontSize:"10px",letterSpacing:"0.3em",textTransform:"uppercase",color:"#2563EB",marginBottom:"20px",fontFamily:"system-ui"}}>Güvenlik Ağı</div>
          <h2 style={{fontSize:"clamp(34px,4.5vw,56px)",fontWeight:"400",lineHeight:"1.1",letterSpacing:"-0.02em",marginBottom:"24px"}}>
            50 Hasta.<br/>Yorgun Bir Gün.<br/>
            <em style={{color:"rgba(255,255,255,.25)",fontStyle:"italic"}}>O Asla Susmaz.</em>
          </h2>
          <p style={{fontSize:"17px",color:"rgba(255,255,255,.35)",lineHeight:"1.9",fontFamily:"system-ui",fontWeight:"300",marginBottom:"56px"}}>
            Yanlış doz, tehlikeli kombinasyon, atlanmış SGK kısıtlaması —
            sormadan söyler. Sizi duraksatır. Doğrusunu önerir.
            Meslektaş gibi davranır, asistan gibi değil.
          </p>
          <div style={{background:"#080F1E",border:"1px solid rgba(255,255,255,.07)",borderRadius:"16px",padding:"32px 40px",textAlign:"left",position:"relative"}}>
            <div style={{position:"absolute",top:0,left:"40px",right:"40px",height:"1px",background:"linear-gradient(90deg,transparent,rgba(239,68,68,.4),transparent)"}} />
            <div style={{fontSize:"10px",letterSpacing:"0.15em",textTransform:"uppercase",color:"rgba(239,68,68,.6)",fontFamily:"system-ui",marginBottom:"14px"}}>⚠ Örnek Proaktif Uyarı</div>
            <div style={{fontSize:"17px",color:"rgba(255,255,255,.65)",fontFamily:"'Georgia',serif",lineHeight:"1.75",fontStyle:"italic"}}>
              "Doktor, bir saniye — bu doz yetişkin dozudur. Nelson'a göre bu kiloda maksimum 250 mg olmalı. Düzelteyim mi?"
            </div>
          </div>
        </div>
      </section>

      {/* ══ PRICING ══════════════════════════════════════════════ */}
      <section id="fiyatlar" style={{padding:"120px 48px",background:"#05080F"}}>
        <div style={{maxWidth:"1100px",margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:"72px"}}>
            <div style={{fontSize:"10px",letterSpacing:"0.3em",textTransform:"uppercase",color:"#2563EB",marginBottom:"18px",fontFamily:"system-ui"}}>Fiyatlandırma</div>
            <h2 style={{fontSize:"clamp(36px,4.5vw,56px)",fontWeight:"400",letterSpacing:"-0.02em"}}>Sade. Şeffaf. Adil.</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"2px"}}>
            {[
              {name:"Starter",price:"₺499",features:["50 seans/ay","1 kullanıcı","SOAP notları","WhatsApp","AI Asistan"],highlight:false},
              {name:"Pro",price:"₺1.299",features:["Sınırsız seans","1 kullanıcı","Her şey dahil","Öğrenen sistem","Tüm uzmanlar"],highlight:true},
              {name:"Klinik",price:"₺3.999",features:["Sınırsız seans","5 kullanıcı","Klinik raporlar","Öncelikli destek"],highlight:false},
            ].map((plan,i) => (
              <div key={plan.name} style={{
                background:plan.highlight?"#081428":"#07101A",
                padding:"52px 40px",position:"relative",
                borderRadius:i===0?"16px 0 0 16px":i===2?"0 16px 16px 0":"0",
                border:plan.highlight?"1px solid rgba(37,99,235,.3)":"1px solid rgba(255,255,255,.04)"
              }}>
                {plan.highlight && <div style={{position:"absolute",top:0,left:0,right:0,height:"2px",background:"linear-gradient(90deg,transparent,#2563EB,transparent)"}} />}
                {plan.highlight && <div style={{position:"absolute",top:"18px",right:"22px",fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",background:"#2563EB",color:"#fff",padding:"4px 10px",borderRadius:"20px",fontFamily:"system-ui"}}>En Popüler</div>}
                <div style={{fontSize:"12px",color:"rgba(255,255,255,.4)",fontFamily:"system-ui",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"20px"}}>{plan.name}</div>
                <div style={{marginBottom:"32px"}}>
                  <span style={{fontSize:"48px",fontWeight:"400",fontFamily:"'Georgia',serif",color:"#fff"}}>{plan.price}</span>
                  <span style={{fontSize:"14px",color:"rgba(255,255,255,.25)",fontFamily:"system-ui"}}>/ay</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:"12px",marginBottom:"40px"}}>
                  {plan.features.map(f => (
                    <div key={f} style={{display:"flex",alignItems:"center",gap:"10px",fontSize:"14px",color:"rgba(255,255,255,.5)",fontFamily:"system-ui"}}>
                      <span style={{color:"#2563EB",fontSize:"12px"}}>✓</span>{f}
                    </div>
                  ))}
                </div>
                <Link href="/giris"
                  style={{display:"block",padding:"14px 24px",background:plan.highlight?"#2563EB":"transparent",border:`1px solid ${plan.highlight?"transparent":"rgba(255,255,255,.12)"}`,color:"#fff",textDecoration:"none",fontSize:"12px",letterSpacing:"0.1em",textTransform:"uppercase",textAlign:"center",borderRadius:"1px",fontFamily:"system-ui"}}>
                  Başlayın
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA — FULL BLEED ═══════════════════════════════ */}
      <section style={{position:"relative",overflow:"hidden",padding:"160px 48px",textAlign:"center"}}>
        <img src="https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=1800&q=80&fit=crop" alt="" aria-hidden
          style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"center",filter:"brightness(0.15) saturate(0.5)"}} />
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,#05080F,rgba(5,8,15,.85),#05080F)"}} />
        <div style={{position:"relative",zIndex:10}}>
          <h2 style={{fontSize:"clamp(44px,7vw,88px)",fontWeight:"400",lineHeight:"1.03",letterSpacing:"-0.03em",marginBottom:"36px"}}>
            Bugün Başlayın.<br/>
            <em style={{color:"rgba(255,255,255,.25)",fontStyle:"italic"}}>İlk 14 Gün Ücretsiz.</em>
          </h2>
          <Link href="/giris"
            style={{display:"inline-block",padding:"20px 60px",background:"#2563EB",color:"#fff",textDecoration:"none",fontSize:"14px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"system-ui",fontWeight:"500",borderRadius:"1px"}}>
            Ücretsiz Hesap Aç
          </Link>
          <div style={{marginTop:"22px",fontSize:"12px",color:"rgba(255,255,255,.2)",fontFamily:"system-ui",letterSpacing:"0.04em"}}>
            Kredi kartı gerektirmez · KVKK uyumlu · Türkçe destek
          </div>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════ */}
      <footer style={{padding:"40px 48px",borderTop:"1px solid rgba(255,255,255,.05)",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#030710"}}>
        <div style={{fontSize:"16px",fontFamily:"'Georgia',serif",color:"rgba(255,255,255,.3)",letterSpacing:"0.15em"}}>
          NOTYA<span style={{color:"#2563EB"}}>.</span>AI
        </div>
        <div style={{fontSize:"11px",color:"rgba(255,255,255,.18)",fontFamily:"system-ui",letterSpacing:"0.04em"}}>
          © 2026 Dream Türkiye · KVKK Uyumlu · AB Veri Merkezi Frankfurt
        </div>
      </footer>

    </main>
  )
}
