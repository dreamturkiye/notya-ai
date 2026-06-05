
export default function InstallPage() {
  return (
    <div style={{minHeight:"100vh",background:"#0A1628",color:"#fff",fontFamily:"system-ui,sans-serif",
                 display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <div style={{maxWidth:"400px",width:"100%",textAlign:"center"}}>
        <div style={{fontSize:"64px",marginBottom:"16px"}}>🩺</div>
        <h1 style={{fontSize:"28px",fontWeight:"700",marginBottom:"8px"}}>
          <span style={{color:"#2563EB"}}>Notya</span> AI
        </h1>
        <p style={{fontSize:"15px",color:"rgba(255,255,255,.6)",marginBottom:"36px"}}>
          AI Uzman Asistan — Cebinizde dünyaca ünlü uzman
        </p>

        {/* iPhone */}
        <div style={{background:"#0F2040",border:"1px solid rgba(255,255,255,.1)",borderRadius:"16px",
                     padding:"20px",marginBottom:"16px",textAlign:"left"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"16px"}}>
            <span style={{fontSize:"28px"}}>🍎</span>
            <div>
              <div style={{fontWeight:"600",fontSize:"16px"}}>iPhone'a Yükle</div>
              <div style={{fontSize:"12px",color:"rgba(255,255,255,.5)"}}>Safari ile aç</div>
            </div>
          </div>
          {[
            ["1", "Safari'de notya-ai.vercel.app aç"],
            ["2", "Alt çubukta Paylaş  ↑  butonuna bas"],
            ["3", "\"Ana Ekrana Ekle\" seç"],
            ["4", "Sağ üstte \"Ekle\" ye bas"],
          ].map(([n, t]) => (
            <div key={n} style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"10px"}}>
              <div style={{width:"24px",height:"24px",borderRadius:"50%",background:"#2563EB",
                           display:"flex",alignItems:"center",justifyContent:"center",
                           fontSize:"12px",fontWeight:"700",flexShrink:0}}>{n}</div>
              <div style={{fontSize:"14px",color:"rgba(255,255,255,.8)"}}>{t}</div>
            </div>
          ))}
        </div>

        {/* Android */}
        <div style={{background:"#0F2040",border:"1px solid rgba(255,255,255,.1)",borderRadius:"16px",
                     padding:"20px",marginBottom:"32px",textAlign:"left"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"16px"}}>
            <span style={{fontSize:"28px"}}>🤖</span>
            <div>
              <div style={{fontWeight:"600",fontSize:"16px"}}>Android'e Yükle</div>
              <div style={{fontSize:"12px",color:"rgba(255,255,255,.5)"}}>Chrome ile aç</div>
            </div>
          </div>
          {[
            ["1", "Chrome'da notya-ai.vercel.app aç"],
            ["2", "Sağ üst 3 nokta menüsüne bas"],
            ["3", "\"Uygulamayı Yükle\" veya \"Ana Ekrana Ekle\" seç"],
            ["4", "\"Yükle\" ye bas — hazır!"],
          ].map(([n, t]) => (
            <div key={n} style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"10px"}}>
              <div style={{width:"24px",height:"24px",borderRadius:"50%",background:"#059669",
                           display:"flex",alignItems:"center",justifyContent:"center",
                           fontSize:"12px",fontWeight:"700",flexShrink:0}}>{n}</div>
              <div style={{fontSize:"14px",color:"rgba(255,255,255,.8)"}}>{t}</div>
            </div>
          ))}
        </div>

        <a href="/asistan" style={{display:"block",background:"linear-gradient(135deg,#7C3AED,#2563EB)",
                                    color:"#fff",textDecoration:"none",borderRadius:"14px",
                                    padding:"16px",fontSize:"16px",fontWeight:"700"}}>
          🩺 Hemen Başla — Tarayıcıda Aç
        </a>

        <p style={{fontSize:"11px",color:"rgba(255,255,255,.3)",marginTop:"20px"}}>
          App Store veya Google Play indirmesi gerekmez.<br/>
          Tamamen ücretsiz kurulum — uygulama gibi çalışır.
        </p>
      </div>
    </div>
  )
}
