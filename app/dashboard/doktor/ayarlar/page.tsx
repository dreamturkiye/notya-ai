/**
 * NOTYA-SADE-01 (Ö4) — Ayarlar: kurulum/idare işlerinin tek kapısı.
 * Entegrasyonlar, Personel, SGK Medula ve Araçlar günlük klinik akış değildir; üst menüden
 * kaldırılıp buraya toplandı. Rotalar değişmedi — bu sayfa yalnız bir yönlendirme katmanıdır.
 */
'use client';

import DoktorNav from '@/components/doktor/DoktorNav';

const BOLUMLER = [
  { baslik: 'Entegrasyonlar', aciklama: 'Takvim, e-posta ve dış sistem bağlantıları', rota: '/dashboard/doktor/entegrasyonlar', ikon: '🔌' },
  { baslik: 'Personel', aciklama: 'Sekreter hesapları ve erişim yetkileri', rota: '/dashboard/doktor/personel', ikon: '👥' },
  { baslik: 'SGK Medula', aciklama: 'SGK Medula işlemleri', rota: '/doktor-tools/sgk-medula', ikon: '🏥' },
  { baslik: 'Araçlar', aciklama: 'ICD-10, e-reçete, epikriz ve diğer yardımcı araçlar', rota: '/doktor-tools', ikon: '🧰' },
];

export default function AyarlarPage() {
  return (
    <div style={{ backgroundColor: '#0A1628', minHeight: '100vh', color: 'white' }}>
      <DoktorNav />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
        <h1 style={{ fontSize: 22, marginBottom: 6 }}>Ayarlar</h1>
        <p style={{ fontSize: 13, color: '#8FA0B5', marginBottom: 20 }}>Kurulum ve yönetim işlemleri — günlük akışınızı kalabalıklaştırmasın diye burada.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {BOLUMLER.map((b) => (
            <a
              key={b.rota}
              href={b.rota}
              style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '16px 18px', textDecoration: 'none', color: 'white' }}
            >
              <span style={{ fontSize: 22 }}>{b.ikon}</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}>{b.baslik}</span>
                <span style={{ display: 'block', fontSize: 12, color: '#8FA0B5', marginTop: 2 }}>{b.aciklama}</span>
              </span>
              <span style={{ color: '#5F7189', fontSize: 18 }}>›</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
