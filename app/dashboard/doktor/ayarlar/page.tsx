/**
 * NOTYA-SADE-01 (Ö4) — Ayarlar: kurulum/idare işlerinin tek kapısı.
 * Entegrasyonlar, Personel, SGK Medula ve Araçlar günlük klinik akış değildir; üst menüden
 * kaldırılıp buraya toplandı. Rotalar değişmedi — bu sayfa yalnız bir yönlendirme katmanıdır.
 *
 * NOTYA-YENI-GORUNUM-01: warm chrome pass — content only, header/dock now come from the layout.
 */
'use client';
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme';

const BOLUMLER = [
  { baslik: 'Entegrasyonlar', aciklama: 'Takvim, e-posta ve dış sistem bağlantıları', rota: '/dashboard/doktor/entegrasyonlar', ikon: '🔌' },
  { baslik: 'Hesabım', aciklama: 'E-posta ve şifre', rota: '/dashboard/doktor/hesap', ikon: '🔑' },
  { baslik: 'Personel', aciklama: 'Çalışanların hesapları ve erişim yetkileri', rota: '/dashboard/doktor/personel', ikon: '👥' },
  { baslik: 'e-Reçete', aciklama: 'SGK hekim şifresi, tesis kodu, e-imza — bir kez girin, reçeteyi Notya\'dan gönderin', rota: '/dashboard/doktor/ayarlar/erecete', ikon: '💊' },
  { baslik: 'SGK Medula', aciklama: 'SGK Medula işlemleri', rota: '/doktor-tools/sgk-medula', ikon: '🏥' },
  { baslik: 'Araçlar', aciklama: 'ICD-10, e-reçete, epikriz ve diğer yardımcı araçlar', rota: '/doktor-tools', ikon: '🧰' },
];

export default function AyarlarPage() {
  return (
    <div>
      <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4 }}>Doktor</div>
      <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 32, margin: '0 0 6px', color: '#2e251d', letterSpacing: '-0.02em' }}>Ayarlar</h1>
      <p style={{ fontSize: 14, color: CHROME_RENK.muted, marginBottom: 22 }}>Kurulum ve yönetim işlemleri — günlük akışınızı kalabalıklaştırmasın diye burada.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 640 }}>
        {BOLUMLER.map((b) => (
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
