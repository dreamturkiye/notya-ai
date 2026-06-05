
import Link from "next/link"

export default function HomePage() {
  return (
    <main style={{margin:0,padding:0,background:"#060910",color:"#fff",fontFamily:"'Georgia','Times New Roman',serif",minHeight:"100vh",overflowX:"hidden"}}>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{position:"relative",height:"100vh",minHeight:"680px",display:"flex",flexDirection:"column",justifyContent:"flex-end",overflow:"hidden"}}>

        {/* Background — full bleed gradient + mesh */}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,#060910 0%,#0D1825 40%,#071320 60%,#040810 100%)",zIndex:0}} />

        {/* Decorative light leak top-right */}
        <div style={{position:"absolute",top:"-20%",right:"-10%",width:"60vw",height:"60vw",borderRadius:"50%",
                     background:"radial-gradient(ellipse,rgba(37,99,235,0.12) 0%,transparent 70%)",
                     zIndex:1,pointerEvents:"none"}} />

        {/* Subtle grid texture */}
        <div style={{position:"absolute",inset:0,zIndex:1,pointerEvents:"none",
                     backgroundImage:"linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px)",
                     backgroundSize:"80px 80px"}} />

        {/* Nav */}
        <nav style={{position:"absolute",top:0,left:0,right:0,padding:"28px 48px",display:"flex",alignItems:"center",justifyContent:"space-between",zIndex:20}}>
          <div style={{fontSize:"20px",fontWeight:"400",letterSpacing:"0.15em",fontFamily:"'Georgia',serif",color:"#fff"}}>
            NOTYA<span style={{color:"#2563EB"}}>.</span>AI
          </div>
          <div style={{display:"flex",gap:"36px",alignItems:"center"}}>
            <a href="#features" style={{color:"rgba(255,255,255,.5)",fontSize:"13px",letterSpacing:"0.08em",textDecoration:"none",textTransform:"uppercase"}}>Özellikler</a>
            <a href="#uzmanlar" style={{color:"rgba(255,255,255,.5)",fontSize:"13px",letterSpacing:"0.08em",textDecoration:"none",textTransform:"uppercase"}}>Uzmanlar</a>
            <a href="#fiyatlar" style={{color:"rgba(255,255,255,.5)",fontSize:"13px",letterSpacing:"0.08em",textDecoration:"none",textTransform:"uppercase"}}>Fiyatlar</a>
            <Link href="/giris" style={{padding:"10px 24px",border:"1px solid rgba(255,255,255,.25)",borderRadius:"2px",color:"#fff",fontSize:"13px",letterSpacing:"0.08em",textDecoration:"none",textTransform:"uppercase",backdropFilter:"blur(8px)",background:"rgba(255,255,255,.04)"}}>
              Giriş
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div style={{position:"relative",zIndex:10,padding:"0 48px 80px",maxWidth:"820px"}}>

          <div style={{fontSize:"11px",letterSpacing:"0.25em",textTransform:"uppercase",color:"#2563EB",marginBottom:"24px",fontFamily:"'Georgia',serif",fontStyle:"italic"}}>
            Türkiye'nin İlk Yapay Zeka Tıp Uzmanı
          </div>

          <h1 style={{fontSize:"clamp(48px,7vw,92px)",fontWeight:"400",lineHeight:"1.02",margin:"0 0 32px",letterSpacing:"-0.02em",fontFamily:"'Georgia',serif"}}>
            Cebinizdeki<br/>
            <em style={{color:"#2563EB",fontStyle:"italic"}}>Dünyaca Ünlü</em><br/>
            Uzman Doktor.
          </h1>

          <p style={{fontSize:"18px",lineHeight:"1.7",color:"rgba(255,255,255,.55)",maxWidth:"520px",margin:"0 0 48px",fontFamily:"system-ui,sans-serif",fontWeight:"300",letterSpacing:"0.01em"}}>
            Prof. Ayşe, Prof. Mehmet ve Prof. Elif — Nelson, Braunwald ve Harrison'ı
            başucu kitabı olarak bilen uzmanlar. Her seans, her karar, her an yanınızda.
          </p>

          <div style={{display:"flex",gap:"16px",alignItems:"center"}}>
            <Link href="/giris" style={{display:"inline-block",padding:"18px 40px",background:"#2563EB",color:"#fff",textDecoration:"none",fontSize:"14px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"system-ui,sans-serif",fontWeight:"500",borderRadius:"2px",transition:"all .2s"}}>
              Ücretsiz Başlayın
            </Link>
            <Link href="/asistan" style={{display:"inline-flex",alignItems:"center",gap:"8px",color:"rgba(255,255,255,.5)",textDecoration:"none",fontSize:"13px",letterSpacing:"0.06em",fontFamily:"system-ui,sans-serif"}}>
              <span style={{width:"32px",height:"1px",background:"rgba(255,255,255,.3)"}}></span>
              Demoyu Gör
            </Link>
          </div>
        </div>

        {/* Bottom fade */}
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:"200px",background:"linear-gradient(to top,#060910,transparent)",zIndex:5}} />
      </section>

      {/* ── TRUST BAR ────────────────────────────────────────── */}
      <section style={{padding:"32px 48px",borderTop:"1px solid rgba(255,255,255,.06)",borderBottom:"1px solid rgba(255,255,255,.06)",display:"flex",gap:"48px",alignItems:"center",overflowX:"auto"}}>
        {[
          ["Nelson 22e", "Pediatri Referansı"],
          ["Braunwald 12e", "Kardiyoloji Referansı"],
          ["Harrison's 22e", "Dahiliye Referansı"],
          ["Adams & Victor 12e", "Nöroloji Referansı"],
          ["DSM-5-TR", "Psikiyatri Referansı"],
          ["KVKK Uyumlu", "AB Veri Merkezi"],
        ].map(([title, sub]) => (
          <div key={title} style={{flexShrink:0,borderRight:"1px solid rgba(255,255,255,.08)",paddingRight:"48px",lastChild:{borderRight:"none"}}}>
            <div style={{fontSize:"13px",fontWeight:"500",color:"rgba(255,255,255,.7)",fontFamily:"system-ui",letterSpacing:"0.02em",whiteSpace:"nowrap"}}>{title}</div>
            <div style={{fontSize:"10px",color:"rgba(255,255,255,.3)",fontFamily:"system-ui",letterSpacing:"0.06em",textTransform:"uppercase",marginTop:"2px"}}>{sub}</div>
          </div>
        ))}
      </section>

      {/* ── MAIN FEATURE — Voice ─────────────────────────────── */}
      <section id="features" style={{padding:"120px 48px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"80px",alignItems:"center",maxWidth:"1300px",margin:"0 auto"}}>
        <div>
          <div style={{fontSize:"10px",letterSpacing:"0.3em",textTransform:"uppercase",color:"#2563EB",marginBottom:"20px",fontFamily:"system-ui"}}>
            Sesli Konuşma
          </div>
          <h2 style={{fontSize:"clamp(36px,4vw,56px)",fontWeight:"400",lineHeight:"1.1",margin:"0 0 28px",fontFamily:"'Georgia',serif",letterSpacing:"-0.02em"}}>
            İki Meslektaş<br/>
            <em style={{color:"rgba(255,255,255,.4)",fontStyle:"italic"}}>Gibi Konuşun.</em>
          </h2>
          <p style={{fontSize:"16px",lineHeight:"1.8",color:"rgba(255,255,255,.5)",margin:"0 0 40px",fontFamily:"system-ui",fontWeight:"300"}}>
            Buton yok. Bekleme yok. Mikrofona bir kez dokunun —
            Prof. Ayşe sizi karşılar. Doğal, akıcı, gerçek zamanlı.
            Cümlenizin ortasında araya girebilirsiniz, o durur.
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
            {[
              ["🎙️", "Her an dinliyor — push-to-talk yok"],
              ["⚡", "2 saniyede yanıt — gerçek zamanlı"],
              ["🔄", "Araya girince anında durur"],
            ].map(([icon, text]) => (
              <div key={text} style={{display:"flex",alignItems:"center",gap:"14px",fontSize:"15px",color:"rgba(255,255,255,.6)",fontFamily:"system-ui"}}>
                <span style={{fontSize:"20px"}}>{icon}</span>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Visual — simulated conversation */}
        <div style={{background:"#0A1220",border:"1px solid rgba(255,255,255,.07)",borderRadius:"24px",padding:"32px",fontFamily:"system-ui"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"24px",paddingBottom:"20px",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
            <div style={{width:"40px",height:"40px",borderRadius:"50%",background:"linear-gradient(135deg,#0F9B8E,#2563EB)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px"}}>👩‍⚕️</div>
            <div>
              <div style={{fontSize:"13px",fontWeight:"500",color:"#fff"}}>Prof. Ayşe Kaya</div>
              <div style={{fontSize:"11px",color:"#0F9B8E",display:"flex",alignItems:"center",gap:"4px"}}>
                <span style={{width:"6px",height:"6px",borderRadius:"50%",background:"#0F9B8E",display:"inline-block"}}></span>
                Dinliyor
              </div>
            </div>
          </div>
          {[
            {side:"right", text:"7 yaşında, 18 kilo. 3 gündür ateş, sağ kulak ağrısı.", isAI:false},
            {side:"left",  text:"Otoskopide ne görüyorsunuz, doktor?", isAI:true},
            {side:"right", text:"TM hiperemik, mat.", isAI:false},
            {side:"left",  text:"Akut otitis media. Amoksisilin 40 mg/kg/gün, bu kiloda 720 mg, iki doza — yazayım mı?", isAI:true},
            {side:"right", text:"Yaz.", isAI:false},
            {side:"left",  text:"Reçeteye ekledim. 3-5 gün sonra kontrol öneririm. Başka bir şey var mı doktor?", isAI:true},
          ].map((msg, i) => (
            <div key={i} style={{display:"flex",justifyContent:msg.side==="right"?"flex-end":"flex-start",marginBottom:"10px"}}>
              <div style={{maxWidth:"78%",padding:"10px 14px",borderRadius:msg.side==="right"?"14px 14px 2px 14px":"14px 14px 14px 2px",
                           background:msg.side==="right"?"rgba(37,99,235,.25)":"rgba(255,255,255,.06)",
                           color:msg.side==="right"?"rgba(255,255,255,.9)":"rgba(255,255,255,.7)",fontSize:"13px",lineHeight:"1.5"}}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── LEARNING FEATURE ─────────────────────────────────── */}
      <section style={{background:"#040710",padding:"120px 48px",borderTop:"1px solid rgba(255,255,255,.04)"}}>
        <div style={{maxWidth:"1300px",margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:"72px"}}>
            <div style={{fontSize:"10px",letterSpacing:"0.3em",textTransform:"uppercase",color:"#2563EB",marginBottom:"20px",fontFamily:"system-ui"}}>
              Öğrenen Sistem
            </div>
            <h2 style={{fontSize:"clamp(36px,4vw,60px)",fontWeight:"400",lineHeight:"1.1",fontFamily:"'Georgia',serif",letterSpacing:"-0.02em",margin:"0 0 24px"}}>
              10 Seansın Ardından<br/>
              <em style={{color:"rgba(255,255,255,.35)",fontStyle:"italic"}}>Yıllardır Birliktesiniz Gibi.</em>
            </h2>
            <p style={{fontSize:"17px",color:"rgba(255,255,255,.4)",maxWidth:"560px",margin:"0 auto",lineHeight:"1.8",fontFamily:"system-ui",fontWeight:"300"}}>
              Her düzeltme, her tercih, her alışkanlık — öğrenir.
              1. seans ile 10. seans arasındaki fark gece ile gündüz gibidir.
            </p>
          </div>

          {/* Before / After */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"24px",maxWidth:"900px",margin:"0 auto"}}>
            <div style={{background:"#0A1220",border:"1px solid rgba(255,255,255,.06)",borderRadius:"16px",padding:"32px"}}>
              <div style={{fontSize:"10px",letterSpacing:"0.2em",textTransform:"uppercase",color:"rgba(255,255,255,.3)",fontFamily:"system-ui",marginBottom:"20px"}}>1. Seans</div>
              <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                {[
                  {q:"Amoksisilin yaz.", a:"Hangi dozu yazayım, doktor?"},
                  {q:"10 günlük.", a:"Hangi markayı tercih edersiniz?"},
                ].map((ex,i) => (
                  <div key={i}>
                    <div style={{fontSize:"13px",color:"rgba(255,255,255,.4)",fontFamily:"system-ui",marginBottom:"4px",fontStyle:"italic"}}>"{ex.q}"</div>
                    <div style={{fontSize:"13px",color:"rgba(255,255,255,.6)",fontFamily:"system-ui",background:"rgba(255,255,255,.04)",padding:"8px 12px",borderRadius:"8px"}}>{ex.a}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{background:"#08152A",border:"1px solid rgba(37,99,235,.25)",borderRadius:"16px",padding:"32px",position:"relative"}}>
              <div style={{position:"absolute",top:"-1px",left:"24px",right:"24px",height:"1px",background:"linear-gradient(90deg,transparent,#2563EB,transparent)"}} />
              <div style={{fontSize:"10px",letterSpacing:"0.2em",textTransform:"uppercase",color:"#2563EB",fontFamily:"system-ui",marginBottom:"20px"}}>10. Seans</div>
              <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                {[
                  {q:"Amoksisilin yaz.", a:"40 mg/kg/gün, bu kiloda 720 mg. Bildiğiniz gibi Amoksiklav yazıyorsunuz — onu mu yazayım, doktor?"},
                ].map((ex,i) => (
                  <div key={i}>
                    <div style={{fontSize:"13px",color:"rgba(255,255,255,.4)",fontFamily:"system-ui",marginBottom:"4px",fontStyle:"italic"}}>"{ex.q}"</div>
                    <div style={{fontSize:"13px",color:"rgba(255,255,255,.75)",fontFamily:"system-ui",background:"rgba(37,99,235,.1)",padding:"10px 14px",borderRadius:"8px",lineHeight:"1.6"}}>{ex.a}</div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:"20px",fontSize:"12px",color:"rgba(37,99,235,.7)",fontFamily:"system-ui",fontStyle:"italic"}}>
                ✦ Sormadınız — o hatırladı.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SPECIALISTS ──────────────────────────────────────── */}
      <section id="uzmanlar" style={{padding:"120px 48px",maxWidth:"1300px",margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:"72px"}}>
          <div style={{fontSize:"10px",letterSpacing:"0.3em",textTransform:"uppercase",color:"#2563EB",marginBottom:"20px",fontFamily:"system-ui"}}>Uzman Kadromuz</div>
          <h2 style={{fontSize:"clamp(36px,4vw,56px)",fontWeight:"400",lineHeight:"1.1",fontFamily:"'Georgia',serif",letterSpacing:"-0.02em"}}>
            Dünya Standartlarında<br/>
            <em style={{color:"rgba(255,255,255,.35)",fontStyle:"italic"}}>Üç Uzman, Tek Uygulama.</em>
          </h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"2px"}}>
          {[
            {name:"Prof. Ayşe Kaya", title:"Pediatri Uzmanı", emoji:"👩‍⚕️", color:"#0F9B8E", books:["Nelson 22e","Harriet Lane 23e"], char:"Sıcak · Sabırlı · Destekleyici"},
            {name:"Prof. Mehmet Demir", title:"Kardiyoloji Uzmanı", emoji:"👨‍⚕️", color:"#2563EB", books:["Braunwald 12e","ESC 2024"], char:"Hızlı · Net · Güven Verici"},
            {name:"Prof. Elif Şahin", title:"Nöroloji & Dahiliye", emoji:"👩‍⚕️", color:"#7C3AED", books:["Harrison's 22e","Adams & Victor 12e"], char:"Analitik · Dikkatli · Kapsamlı"},
          ].map((spec, i) => (
            <div key={spec.name} style={{background:"#080E1A",padding:"48px 40px",position:"relative",overflow:"hidden",borderRadius:i===0?"16px 0 0 16px":i===2?"0 16px 16px 0":"0"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:"3px",background:`linear-gradient(90deg,transparent,${spec.color},transparent)`}} />
              <div style={{width:"64px",height:"64px",borderRadius:"50%",background:`${spec.color}22`,border:`1px solid ${spec.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"28px",marginBottom:"24px"}}>
                {spec.emoji}
              </div>
              <div style={{fontSize:"18px",fontWeight:"400",color:"#fff",fontFamily:"'Georgia',serif",marginBottom:"4px"}}>{spec.name}</div>
              <div style={{fontSize:"12px",color:spec.color,fontFamily:"system-ui",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:"20px"}}>{spec.title}</div>
              <div style={{fontSize:"13px",color:"rgba(255,255,255,.35)",fontFamily:"system-ui",fontStyle:"italic",marginBottom:"20px"}}>{spec.char}</div>
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                {spec.books.map(b => (
                  <div key={b} style={{fontSize:"12px",color:"rgba(255,255,255,.4)",fontFamily:"system-ui",display:"flex",alignItems:"center",gap:"6px"}}>
                    <span style={{width:"16px",height:"1px",background:`${spec.color}66`,display:"inline-block"}}></span>
                    {b}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SAFETY ───────────────────────────────────────────── */}
      <section style={{background:"#040710",padding:"100px 48px",borderTop:"1px solid rgba(255,255,255,.04)"}}>
        <div style={{maxWidth:"700px",margin:"0 auto",textAlign:"center"}}>
          <div style={{fontSize:"10px",letterSpacing:"0.3em",textTransform:"uppercase",color:"#2563EB",marginBottom:"20px",fontFamily:"system-ui"}}>Güvenlik Ağı</div>
          <h2 style={{fontSize:"clamp(32px,4vw,52px)",fontWeight:"400",lineHeight:"1.15",fontFamily:"'Georgia',serif",letterSpacing:"-0.02em",marginBottom:"24px"}}>
            50 Hasta, Yorgun Bir Gün —<br/>
            <em style={{color:"rgba(255,255,255,.35)",fontStyle:"italic"}}>O Asla Susmaz.</em>
          </h2>
          <p style={{fontSize:"16px",color:"rgba(255,255,255,.4)",lineHeight:"1.9",fontFamily:"system-ui",fontWeight:"300",marginBottom:"48px"}}>
            Yanlış doz, tehlikeli ilaç kombinasyonu, atlanmış SGK kısıtlaması —
            sormadan söyler. Sizi duraksatır. Doğrusunu önerir.
            Meslektaş gibi, asistan gibi değil.
          </p>
          <div style={{background:"#0A1525",border:"1px solid rgba(255,255,255,.08)",borderRadius:"16px",padding:"28px 32px",textAlign:"left",position:"relative"}}>
            <div style={{position:"absolute",top:"-1px",left:"32px",right:"32px",height:"1px",background:"linear-gradient(90deg,transparent,rgba(239,68,68,.5),transparent)"}} />
            <div style={{fontSize:"11px",letterSpacing:"0.15em",textTransform:"uppercase",color:"rgba(239,68,68,.7)",fontFamily:"system-ui",marginBottom:"14px"}}>⚠ Örnek Uyarı</div>
            <div style={{fontSize:"15px",color:"rgba(255,255,255,.75)",fontFamily:"system-ui",lineHeight:"1.7",fontStyle:"italic"}}>
              "Doktor, bir saniye — bu doz yetişkin dozudur. Nelson'a göre bu kiloda maksimum 250 mg olmalı. Düzelteyim mi?"
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section id="fiyatlar" style={{padding:"120px 48px",maxWidth:"1100px",margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:"72px"}}>
          <div style={{fontSize:"10px",letterSpacing:"0.3em",textTransform:"uppercase",color:"#2563EB",marginBottom:"20px",fontFamily:"system-ui"}}>Fiyatlandırma</div>
          <h2 style={{fontSize:"clamp(36px,4vw,52px)",fontWeight:"400",fontFamily:"'Georgia',serif",letterSpacing:"-0.02em"}}>Sade. Şeffaf. Adil.</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"2px"}}>
          {[
            {name:"Starter", price:"₺499", period:"/ay", sessions:"50 seans/ay", users:"1 kullanıcı", features:["SOAP notları","WhatsApp gönderimi","Türkçe AI","AI Uzman Asistan"], highlight:false},
            {name:"Pro", price:"₺1.299", period:"/ay", sessions:"Sınırsız seans", users:"1 kullanıcı", features:["Her şey dahil","ICD-10 kodlama","Öğrenen sistem","Tüm uzmanlar","Çevrimdışı mod"], highlight:true},
            {name:"Klinik", price:"₺3.999", period:"/ay", sessions:"Sınırsız seans", users:"5 kullanıcı", features:["5 kullanıcı","Öncelikli destek","Klinik raporlar","Tüm özellikler"], highlight:false},
          ].map((plan, i) => (
            <div key={plan.name} style={{background:plan.highlight?"#081A35":"#080E1A",padding:"48px 36px",position:"relative",overflow:"hidden",borderRadius:i===0?"16px 0 0 16px":i===2?"0 16px 16px 0":"0",border:plan.highlight?"1px solid rgba(37,99,235,.3)":"1px solid transparent"}}>
              {plan.highlight && <div style={{position:"absolute",top:0,left:0,right:0,height:"3px",background:"linear-gradient(90deg,transparent,#2563EB,transparent)"}} />}
              {plan.highlight && <div style={{position:"absolute",top:"16px",right:"20px",fontSize:"10px",letterSpacing:"0.1em",background:"#2563EB",color:"#fff",padding:"4px 10px",borderRadius:"20px",fontFamily:"system-ui"}}>EN POPÜLER</div>}
              <div style={{fontSize:"14px",color:"rgba(255,255,255,.5)",fontFamily:"system-ui",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:"16px"}}>{plan.name}</div>
              <div style={{marginBottom:"24px"}}>
                <span style={{fontSize:"42px",fontWeight:"400",color:"#fff",fontFamily:"'Georgia',serif"}}>{plan.price}</span>
                <span style={{fontSize:"14px",color:"rgba(255,255,255,.35)",fontFamily:"system-ui"}}>{plan.period}</span>
              </div>
              <div style={{fontSize:"13px",color:"rgba(255,255,255,.4)",fontFamily:"system-ui",marginBottom:"24px"}}>{plan.sessions} · {plan.users}</div>
              <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"36px"}}>
                {plan.features.map(f => (
                  <div key={f} style={{display:"flex",alignItems:"center",gap:"10px",fontSize:"13px",color:"rgba(255,255,255,.6)",fontFamily:"system-ui"}}>
                    <span style={{color:"#2563EB",fontSize:"14px"}}>✓</span>{f}
                  </div>
                ))}
              </div>
              <Link href="/giris" style={{display:"block",padding:"14px 24px",background:plan.highlight?"#2563EB":"transparent",border:`1px solid ${plan.highlight?"#2563EB":"rgba(255,255,255,.15)"}`,color:"#fff",textDecoration:"none",fontSize:"13px",letterSpacing:"0.08em",textTransform:"uppercase",textAlign:"center",borderRadius:"2px",fontFamily:"system-ui"}}>
                Başlayın
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section style={{padding:"120px 48px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"600px",height:"400px",borderRadius:"50%",background:"radial-gradient(ellipse,rgba(37,99,235,0.08) 0%,transparent 70%)",pointerEvents:"none"}} />
        <div style={{position:"relative",zIndex:1}}>
          <h2 style={{fontSize:"clamp(40px,6vw,76px)",fontWeight:"400",lineHeight:"1.05",fontFamily:"'Georgia',serif",letterSpacing:"-0.02em",marginBottom:"32px"}}>
            Bugün Başlayın.<br/>
            <em style={{color:"rgba(255,255,255,.3)",fontStyle:"italic"}}>İlk 14 Gün Ücretsiz.</em>
          </h2>
          <Link href="/giris" style={{display:"inline-block",padding:"20px 56px",background:"#2563EB",color:"#fff",textDecoration:"none",fontSize:"15px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"system-ui",fontWeight:"500",borderRadius:"2px"}}>
            Ücretsiz Hesap Aç
          </Link>
          <div style={{marginTop:"20px",fontSize:"13px",color:"rgba(255,255,255,.25)",fontFamily:"system-ui"}}>
            Kredi kartı gerektirmez · KVKK uyumlu · Türkçe destek
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{padding:"40px 48px",borderTop:"1px solid rgba(255,255,255,.06)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:"16px",fontFamily:"'Georgia',serif",color:"rgba(255,255,255,.4)",letterSpacing:"0.1em"}}>
          NOTYA<span style={{color:"#2563EB"}}>.</span>AI
        </div>
        <div style={{fontSize:"11px",color:"rgba(255,255,255,.2)",fontFamily:"system-ui"}}>
          © 2026 Dream Türkiye · KVKK Uyumlu · AB Veri Merkezi (Frankfurt)
        </div>
      </footer>

    </main>
  )
}
