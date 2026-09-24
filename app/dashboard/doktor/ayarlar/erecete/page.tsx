'use client';
/**
 * NOTYA-ERECETE-01 — Ayarlar › e-Reçete: SGK Medula kimliği bir kez girilir, reçete Notya'dan gönderilir.
 * Şifre/TC şifreli saklanır, ekrana asla açık dönmez. e-imza PIN'i işlem bazlıdır — burada istenmez.
 */
import React, { useEffect, useState } from 'react';
import { getDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme';

interface Goruntu { tesisKodu: number | null; bransKodu: number | null; doktorTcMaske: string; sifreVar: boolean; ortam: 'test' | 'gercek'; imzaYontemi: 'token' | 'mobil' | 'yok'; sonTest: { tarih: string; durum: string; mesaj: string } | null; eksikler: string[]; hazir: boolean; gonderebilir: boolean }

const kutu: React.CSSProperties = { background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 16, padding: '16px 18px', marginBottom: 14, boxShadow: '0 8px 18px rgba(58,44,34,0.045)' };
const etiket: React.CSSProperties = { display: 'block', fontSize: 12, color: CHROME_RENK.muted, marginBottom: 4 };
const giris: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, color: CHROME_RENK.ink, borderRadius: 8, padding: '9px 10px', fontSize: 14 };
const dugme: React.CSSProperties = { background: CHROME_RENK.pine, color: '#FAF8F4', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 14 };
const dugmeIkincil: React.CSSProperties = { ...dugme, background: 'transparent', color: CHROME_RENK.ink, border: `1.5px solid ${CHROME_RENK.border}` };

export default function EReceteAyarPage() {
  const [g, setG] = useState<Goruntu | null>(null);
  const [varsayilanBrans, setVarsayilanBrans] = useState<number | null>(null);
  const [tesisKodu, setTesisKodu] = useState('');
  const [bransKodu, setBransKodu] = useState('');
  const [doktorTc, setDoktorTc] = useState('');
  const [sifre, setSifre] = useState('');
  const [ortam, setOrtam] = useState<'test' | 'gercek'>('gercek');
  const [imza, setImza] = useState<'token' | 'mobil' | 'yok'>('yok');
  const [mesaj, setMesaj] = useState('');
  const [mesgul, setMesgul] = useState(false);

  const yukle = async () => {
    const t = await getDoctorAccessToken();
    if (!t) return;
    const r = await fetch('/api/doktor/erecete-ayar', { headers: { Authorization: `Bearer ${t}` } });
    const j = await r.json().catch(() => ({}));
    if (j.ayar) {
      setG(j.ayar); setVarsayilanBrans(j.varsayilanBransKodu ?? null);
      setTesisKodu(j.ayar.tesisKodu ? String(j.ayar.tesisKodu) : '');
      setBransKodu(j.ayar.bransKodu ? String(j.ayar.bransKodu) : (j.varsayilanBransKodu ? String(j.varsayilanBransKodu) : ''));
      setOrtam(j.ayar.ortam || 'gercek'); setImza(j.ayar.imzaYontemi || 'yok');
    }
  };
  useEffect(() => { yukle(); }, []);

  const kaydet = async () => {
    setMesgul(true); setMesaj('');
    const t = await getDoctorAccessToken();
    if (!t) { setMesgul(false); return; }
    const body: Record<string, string> = { tesisKodu, bransKodu, ortam, imzaYontemi: imza };
    if (doktorTc.trim()) body.doktorTc = doktorTc.trim();
    if (sifre) body.sifre = sifre;
    const r = await fetch('/api/doktor/erecete-ayar', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (j.ayar) { setG(j.ayar); setSifre(''); setDoktorTc(''); setMesaj('Kaydedildi. Şifre ve TC şifreli olarak saklandı.'); }
    else setMesaj(j.error || 'Kaydedilemedi.');
    setMesgul(false);
  };

  const testEt = async () => {
    setMesgul(true); setMesaj('SGK\'ya bağlanılıyor…');
    const t = await getDoctorAccessToken();
    if (!t) { setMesgul(false); return; }
    const r = await fetch('/api/doktor/erecete-ayar', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify({ islem: 'test' }) });
    const j = await r.json().catch(() => ({}));
    if (j.ayar) setG(j.ayar);
    setMesaj(j.mesaj || j.error || 'Test tamamlanamadı.');
    setMesgul(false);
  };

  const durumRenk = g?.sonTest?.durum === 'baglandi' ? '#2E6E4E' : g?.sonTest?.durum === 'kimlik_hatali' ? CHROME_RENK.warn : '#B4832F';

  return (
    <div>
      <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4 }}>Ayarlar</div>
      <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 30, margin: '0 0 6px', color: '#2e251d', letterSpacing: '-0.02em' }}>💊 e-Reçete</h1>
      <p style={{ fontSize: 14, color: CHROME_RENK.muted, marginBottom: 18 }}>SGK Medula kimliğinizi bir kez girin; reçeteyi Notya&apos;dan gönderin. Şifreniz şifreli saklanır ve ekrana bir daha gelmez. e-imza PIN&apos;i her reçetede sizden istenir — burada saklanmaz (yasal zorunluluk).</p>
      <div style={{ maxWidth: 720 }}>

        {/* Durum */}
        <div style={{ ...kutu, borderColor: g?.hazir ? '#8FCBA8' : CHROME_RENK.border }}>
          <div style={{ fontSize: 12, color: CHROME_RENK.muted, letterSpacing: 1.2, marginBottom: 6 }}>DURUM</div>
          {g ? (
            <>
              <div style={{ fontSize: 14, color: CHROME_RENK.ink }}>{g.hazir ? '✅ Kimlik bilgileri tam.' : `⬜ Eksik: ${g.eksikler.join(', ')}`}</div>
              <div style={{ fontSize: 14, marginTop: 4, color: durumRenk }}>
                {g.sonTest ? `${g.sonTest.durum === 'baglandi' ? '✅' : g.sonTest.durum === 'kimlik_hatali' ? '❌' : '⚠️'} ${g.sonTest.mesaj} (${new Date(g.sonTest.tarih).toLocaleString('tr-TR')})` : 'Bağlantı henüz test edilmedi.'}
              </div>
              <div style={{ fontSize: 13, marginTop: 4, color: CHROME_RENK.muted }}>
                {g.gonderebilir ? 'Canlı gönderim: e-imza aracı kurulunca bir tıkla Medula\'ya gönderilir.' : 'Canlı gönderim için bağlantı testi ✅ ve bir e-imza yöntemi gerekir.'}
              </div>
            </>
          ) : <div style={{ fontSize: 13, color: CHROME_RENK.muted }}>Yükleniyor…</div>}
        </div>

        {/* Kimlik */}
        <div style={kutu}>
          <div style={{ fontSize: 12, color: CHROME_RENK.muted, letterSpacing: 1.2, marginBottom: 10 }}>SGK MEDULA KİMLİĞİ</div>
          <div className="notya-grid-yigin" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label><span style={etiket}>Hekim TC kimlik no {g?.doktorTcMaske ? `(kayıtlı: ${g.doktorTcMaske})` : ''}</span><input style={giris} inputMode="numeric" maxLength={11} value={doktorTc} onChange={(e) => setDoktorTc(e.target.value.replace(/\D/g, ''))} placeholder={g?.doktorTcMaske ? 'Değiştirmek için yazın' : '11 hane'} /></label>
            <label><span style={etiket}>SGK hekim şifresi {g?.sifreVar ? '(kayıtlı)' : ''}</span><input style={giris} type="password" autoComplete="new-password" value={sifre} onChange={(e) => setSifre(e.target.value)} placeholder={g?.sifreVar ? 'Değiştirmek için yazın' : 'medeczane.sgk.gov.tr/doktor'} /></label>
            <label><span style={etiket}>Tesis kodu</span><input style={giris} inputMode="numeric" value={tesisKodu} onChange={(e) => setTesisKodu(e.target.value.replace(/\D/g, ''))} placeholder="Muayenehanenizin SGK tesis kodu" /></label>
            <label><span style={etiket}>SGK branş kodu {varsayilanBrans ? `(branşınız için ${varsayilanBrans})` : ''}</span><input style={giris} inputMode="numeric" value={bransKodu} onChange={(e) => setBransKodu(e.target.value.replace(/\D/g, ''))} placeholder="örn. 1600" /></label>
          </div>
        </div>

        {/* e-imza + ortam */}
        <div style={kutu}>
          <div style={{ fontSize: 12, color: CHROME_RENK.muted, letterSpacing: 1.2, marginBottom: 10 }}>E-İMZA VE ORTAM</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 14, color: CHROME_RENK.ink }}>
            {(['token', 'mobil', 'yok'] as const).map((v) => (
              <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="radio" checked={imza === v} onChange={() => setImza(v)} />{v === 'token' ? 'e-imza kartı / USB token (bu bilgisayarda)' : v === 'mobil' ? 'Mobil imza (telefon)' : 'Henüz e-imzam yok'}</label>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 13, color: CHROME_RENK.ink }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={ortam === 'test'} onChange={(e) => setOrtam(e.target.checked ? 'test' : 'gercek')} />SGK test ortamını kullan (yalnız Notya ekibi; gerçek reçete oluşmaz)</label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" style={dugme} disabled={mesgul} onClick={kaydet}>Kaydet</button>
          <button type="button" style={dugmeIkincil} disabled={mesgul || !g?.hazir} onClick={testEt} title={g?.hazir ? 'Gerçek ortamda salt-okunur sorgu — reçete oluşturmaz' : 'Önce kimlik bilgilerini kaydedin'}>🔌 Bağlantıyı test et</button>
          {mesaj && <span style={{ fontSize: 13, color: CHROME_RENK.ink }}>{mesaj}</span>}
        </div>

        {/* Nasıl alınır */}
        <div style={{ ...kutu, marginTop: 18 }}>
          <div style={{ fontSize: 12, color: CHROME_RENK.muted, letterSpacing: 1.2, marginBottom: 8 }}>BU BİLGİLER NEREDEN ALINIR</div>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7, color: CHROME_RENK.ink }}>
            <li><b>Doktor Bilgi Bankası kaydı</b> — İl Sağlık Müdürlüğü; kayıt yoksa reçeteler ödenmez ve Reçetem&apos;e giriş reddedilir.</li>
            <li><b>SGK hekim şifresi</b> — <a href="https://medeczane.sgk.gov.tr/doktor" target="_blank" rel="noopener noreferrer" style={{ color: CHROME_RENK.pine }}>medeczane.sgk.gov.tr/doktor</a> (e-imza veya e-Devlet ile giriş, &quot;Kullanıcı işlemleri&quot;).</li>
            <li><b>Tesis kodu</b> — muayenehanenizin SGK&apos;ya kayıtlı sözleşmesiz sağlık tesisi kodu (SGK İl Müdürlüğü / e-Devlet SGK işlemleri). İşyeri hekimliği 11&lt;il&gt;9903, aile hekimliği 11&lt;il&gt;9904.</li>
            <li><b>e-imza</b> — NES: Kamu SM (TÜBİTAK) veya özel ESHS (e-Güven, TürkTrust, e-Tuğra) kartı/USB token; ya da operatörünüzden mobil imza. 2016&apos;dan beri e-reçete kaydı imzasız kabul edilmez.</li>
            <li><b>Renkli ve beyaz reçete</b> — Sağlık Bakanlığı Reçetem sistemine e-imzayla girilir; Notya reçete sayfasından metni hazırlar ve numarayı geri alır.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
