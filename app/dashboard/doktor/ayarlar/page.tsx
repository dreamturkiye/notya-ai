/**
 * NOTYA-SADE-01 (Ö4) — Ayarlar: kurulum/idare işlerinin tek kapısı.
 * Entegrasyonlar, Personel, SGK Medula ve Araçlar günlük klinik akış değildir; üst menüden
 * kaldırılıp buraya toplandı. Rotalar değişmedi — bu sayfa yalnız bir yönlendirme katmanıdır.
 *
 * NOTYA-YENI-GORUNUM-01: warm chrome pass — content only, header/dock now come from the layout.
 *
 * NOTYA-BLE-SANDBOX-01: «Cihazlar» satırı yalnız cihazSandboxAcikMi (Kaan + Dr. Gökhan) —
 * sunucu GET /api/doktor/cihazlar → { yetkili }; gizleme kozmetik, API 403 asıl kapı.
 */
'use client';
import { useEffect, useState } from 'react';
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';

const BOLUMLER = [
  { baslik: 'Entegrasyonlar', aciklama: 'Takvim, e-posta ve dış sistem bağlantıları', rota: '/dashboard/doktor/entegrasyonlar', ikon: '🔌' },
  { baslik: 'Hesabım', aciklama: 'E-posta ve şifre', rota: '/dashboard/doktor/hesap', ikon: '🔑' },
  { baslik: 'İletişim', aciklama: 'Hastalarınıza kendi WhatsApp ve e-postanızdan tek dokunuşla yazın', rota: '/dashboard/doktor/ayarlar/iletisim', ikon: '💬' },
  { baslik: 'Gelen Belgeler', aciklama: 'Sekreterinizin gelen belgeleri görüp dosyalamasına izin verin', rota: '/dashboard/doktor/ayarlar/gelen-belgeler', ikon: '📥' },
  { baslik: 'Personel',aciklama: 'Çalışanların hesapları ve erişim yetkileri', rota: '/dashboard/doktor/personel', ikon: '👥' },
  { baslik: 'Ayşe’nin hafızası', aciklama: 'Öğrendiği kurallar — görünür, kapatılır, unutulur', rota: '/dashboard/doktor/ayarlar/ayse-hafizasi', ikon: '✦' },
  { baslik: 'e-Reçete', aciklama: 'SGK hekim şifresi, tesis kodu, e-imza — bir kez girin, reçeteyi Notya\'dan gönderin', rota: '/dashboard/doktor/ayarlar/erecete', ikon: '💊' },
  { baslik: 'SGK Medula', aciklama: 'SGK Medula işlemleri', rota: '/doktor-tools/sgk-medula', ikon: '🏥' },
  { baslik: 'Araçlar', aciklama: 'ICD-10, e-reçete, epikriz ve diğer yardımcı araçlar', rota: '/doktor-tools', ikon: '🧰' },
];

/** Sandbox satırı — herkese açılana kadar yalnız yetkili hesaplara eklenir. */
const CIHAZLAR_SATIR = {
  baslik: 'Cihazlar',
  aciklama: 'Bluetooth ölçüm cihazı eşleştirme (sandbox — yalnız siz)',
  rota: '/dashboard/doktor/ayarlar/cihazlar',
  ikon: '📶',
};

export default function AyarlarPage() {
  const [cihazSandbox, setCihazSandbox] = useState(false);

  useEffect(() => {
    let iptal = false;
    (async () => {
      const token = await ensureDoctorAccessToken();
      if (!token || iptal) return;
      const r = await fetch('/api/doktor/cihazlar', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const d = (await r.json().catch(() => ({}))) as { yetkili?: boolean };
      if (!iptal && d.yetkili === true) setCihazSandbox(true);
    })();
    return () => { iptal = true; };
  }, []);

  const liste = cihazSandbox
    ? [BOLUMLER[0], BOLUMLER[1], CIHAZLAR_SATIR, ...BOLUMLER.slice(2)]
    : BOLUMLER;

  return (
    <div>
      <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4 }}>Doktor</div>
      <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 32, margin: '0 0 6px', color: '#2e251d', letterSpacing: '-0.02em' }}>Ayarlar</h1>
      <p style={{ fontSize: 14, color: CHROME_RENK.muted, marginBottom: 22 }}>Kurulum ve yönetim işlemleri — günlük akışınızı kalabalıklaştırmasın diye burada.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 640 }}>
        {liste.map((b) => (
          <a
            key={b.rota}
            href={b.rota}
            style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 16, padding: '16px 18px', textDecoration: 'none', color: CHROME_RENK.ink, boxShadow: '0 8px 18px rgba(58,44,34,0.045)' }}
          >
            <span style={{ fontSize: 22 }}>{b.ikon}</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}>{b.baslik}</span>
              <span style={{ display: 'block', fontSize: 12, color: CHROME_RENK.muted, marginTop: 2 }}>{b.aciklama}</span>
            </span>
            <span style={{ color: '#C9BEA9', fontSize: 18 }}>›</span>
          </a>
        ))}
      </div>
    </div>
  );
}
