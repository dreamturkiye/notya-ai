import { CHROME_RENK as R, CHROME_FONT, CHROME_FONT_HREF } from '@/lib/doktor/chromeTheme'

export default function InstallPage() {
  const kart = {background:R.paper,border:`1px solid ${R.border}`,borderRadius:"16px",
                padding:"20px",textAlign:"left" as const,boxShadow:"0 18px 50px rgba(58,44,34,0.08)"}
  return (
    <div style={{minHeight:"100dvh",background:R.cream,color:R.ink,fontFamily:CHROME_FONT.sans,
                 display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"calc(24px + env(safe-area-inset-top, 0px)) 16px calc(24px + env(safe-area-inset-bottom, 0px))",boxSizing:"border-box"}}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={CHROME_FONT_HREF} />
      <div style={{maxWidth:"400px",width:"100%",textAlign:"center"}}>
        <div style={{fontSize:"64px",marginBottom:"16px"}}>🩺</div>
        <h1 style={{fontSize:"28px",fontWeight:"560",marginBottom:"8px",fontFamily:CHROME_FONT.serif,color:R.ink}}>
          <span style={{color:R.pine}}>Notya</span> AI
        </h1>
        <p style={{fontSize:"15px",color:R.muted,marginBottom:"36px"}}>
          Yapay Zekâ Uzman Asistanı — Cebinizde dünyaca ünlü uzman
        </p>

        {/* iPhone */}
        <div style={{...kart,marginBottom:"16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"16px"}}>
            <span style={{fontSize:"28px"}}>🍎</span>
            <div>
              <div style={{fontWeight:"600",fontSize:"16px"}}>iPhone'a Yükle</div>
              <div style={{fontSize:"12px",color:R.muted}}>Safari ile aç</div>
            </div>
          </div>
          {[
            ["1", "Safari'de www.notya.io aç"],
            ["2", "Alt çubukta Paylaş  ↑  butonuna bas"],
            ["3", "\"Ana Ekrana Ekle\" seç"],
            ["4", "Sağ üstte \"Ekle\" ye bas"],
          ].map(([n, t]) => (
            <div key={n} style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"10px"}}>
              <div style={{width:"24px",height:"24px",borderRadius:"50%",background:R.pine,color:"#fff",
                           display:"flex",alignItems:"center",justifyContent:"center",
                           fontSize:"12px",fontWeight:"700",flexShrink:0}}>{n}</div>
              <div style={{fontSize:"14px",color:R.ink}}>{t}</div>
            </div>
          ))}
        </div>

        {/* Android */}
        <div style={{...kart,marginBottom:"32px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"16px"}}>
            <span style={{fontSize:"28px"}}>🤖</span>
            <div>
              <div style={{fontWeight:"600",fontSize:"16px"}}>Android'e Yükle</div>
              <div style={{fontSize:"12px",color:R.muted}}>Chrome ile aç</div>
            </div>
          </div>
          {[
            ["1", "Chrome'da www.notya.io aç"],
            ["2", "Sağ üst 3 nokta menüsüne bas"],
            ["3", "\"Uygulamayı Yükle\" veya \"Ana Ekrana Ekle\" seç"],
            ["4", "\"Yükle\" ye bas — hazır!"],
          ].map(([n, t]) => (
            <div key={n} style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"10px"}}>
              <div style={{width:"24px",height:"24px",borderRadius:"50%",background:R.pine,color:"#fff",
                           display:"flex",alignItems:"center",justifyContent:"center",
                           fontSize:"12px",fontWeight:"700",flexShrink:0}}>{n}</div>
              <div style={{fontSize:"14px",color:R.ink}}>{t}</div>
            </div>
          ))}
        </div>

        <a href="/dashboard/doktor" style={{display:"block",background:R.pine,
                                    color:"#fff",textDecoration:"none",borderRadius:"14px",
                                    padding:"16px",fontSize:"16px",fontWeight:"700"}}>
          🩺 Hemen Başla — Tarayıcıda Aç
        </a>

        <p style={{fontSize:"11px",color:R.muted,marginTop:"20px"}}>
          App Store veya Google Play indirmesi gerekmez.<br/>
          Tamamen ücretsiz kurulum — uygulama gibi çalışır.
        </p>
      </div>
    </div>
  )
}
