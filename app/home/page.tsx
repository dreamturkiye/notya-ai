'use client';

import React from 'react';

const HomePage: React.FC = () => {
  const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  return (
    <div style={{ fontFamily, margin: 0, padding: 0, background: '#fff', color: '#111' }}>
      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100, height: '52px',
        background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', background: '#0F766E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '18px' }}>N</div>
            <span style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.3px' }}>Notya AI</span>
          </div>

          <div style={{ display: 'flex', gap: '32px', fontSize: '14px', fontWeight: 500 }}>
            <a href="#ozellikler" style={{ color: '#111', textDecoration: 'none' }}>Özellikler</a>
            <a href="#asistanlar" style={{ color: '#111', textDecoration: 'none' }}>Asistanlar</a>
            <a href="#entegrasyonlar" style={{ color: '#111', textDecoration: 'none' }}>Entegrasyonlar</a>
            <a href="#fiyatlar" style={{ color: '#111', textDecoration: 'none' }}>Fiyatlar</a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button style={{ padding: '8px 18px', fontSize: '14px', border: '1px solid #111', borderRadius: '8px', background: 'transparent', cursor: 'pointer' }}>Giriş</button>
            <button style={{ padding: '8px 18px', fontSize: '14px', background: '#0F766E', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Ücretsiz Deneyin</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: '#060C18', minHeight: '100vh', color: '#fff', paddingTop: '80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '60px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '40px', width: '100%' }}>
              {/* Left */}
              <div style={{ flex: 1, maxWidth: '560px' }}>
                <div style={{ display: 'inline-block', background: 'rgba(15,118,110,0.15)', color: '#5EEAD4', padding: '4px 14px', borderRadius: '999px', fontSize: '13px', marginBottom: '24px' }}>
                  Türkiye'nin ilk klinik AI’sı — 15 Gün Ücretsiz
                </div>
                <h1 style={{ fontSize: 'clamp(42px, 6vw, 64px)', lineHeight: 1.05, fontWeight: 700, margin: 0, letterSpacing: '-2.5px' }}>
                  Muayenehanenizin<br />yeni asistanı.
                </h1>
                <p style={{ fontSize: '17px', maxWidth: '420px', marginTop: '20px', lineHeight: 1.45, color: 'rgba(255,255,255,0.75)' }}>
                  TC kimlik doğrulama, sesli asistan, ICD-10 kodlama, SGK entegrasyonu ve çok daha fazlası. Hepsi tek yerde.
                </p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                  <button style={{ padding: '14px 28px', background: '#0F766E', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>Hemen Başla</button>
                  <button style={{ padding: '14px 28px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', fontSize: '15px', cursor: 'pointer' }}>Canlı Demo</button>
                </div>
                <div style={{ marginTop: '48px', display: 'flex', flexWrap: 'wrap', gap: '18px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                  <div>Nelson 22e</div><div>Braunwald</div><div>Harrison</div><div>KVKK</div><div>SGK Medula</div>
                </div>
              </div>

              {/* Right - Chat mockup */}
              <div style={{ flex: 1, display: 'block', maxWidth: '380px' }}>
                <div style={{ background: '#0F172A', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <img src="/doctors/dr_ayse.jpg" alt="Dr Ayşe Kaya" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>Prof. Dr. Ayşe Kaya</div>
                      <div style={{ fontSize: '12px', color: '#5EEAD4' }}>Pediatri • Çevrimiçi</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.08)', padding: '10px 14px', borderRadius: '14px', fontSize: '13px', alignSelf: 'flex-start', maxWidth: '78%' }}>
                      4 yaşındaki hastanın ateş takibi için yeni reçete önerisi?
                    </div>
                    <div style={{ background: '#0F766E', padding: '10px 14px', borderRadius: '14px', fontSize: '13px', alignSelf: 'flex-end', maxWidth: '78%' }}>
                      Nelson 22e'ye göre dozaj 12 mg/kg. Reçeteyi hazırlayayım.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STAT BAR */}
      <div style={{ height: '80px', background: '#fff', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '0 24px', display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
          <div>Günlük <strong>+5 hasta</strong> kapasitesi</div>
          <div style={{ borderLeft: '1px solid #ddd', paddingLeft: '24px' }}>18 → 2 dakika <strong>not/seans</strong></div>
          <div style={{ borderLeft: '1px solid #ddd', paddingLeft: '24px' }}><strong>%94</strong> kullanmaya devam</div>
        </div>
      </div>

      {/* FEATURES */}
      <section id="ozellikler" style={{ padding: '120px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div style={{ color: '#0F766E', fontSize: '13px', fontWeight: 600, letterSpacing: '1px' }}>TEMEL ÖZELLİKLER</div>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 44px)', margin: '12px 0 0', fontWeight: 700 }}>Doktorun ihtiyacı olan her şey, tek yerde.</h2>
        </div>

        {/* Row 1 */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: '60px', alignItems: 'center', marginBottom: '100px' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '26px', fontWeight: 600 }}>Sesli &amp; Doğal</h3>
            <p style={{ fontSize: '16px', color: '#444', lineHeight: 1.6 }}>ElevenLabs destekli sesli asistanınızla konsültasyon sırasında not alın, komut verin. Türkçe doğal konuşma tanıma.</p>
          </div>
          <div style={{ flex: 1, height: '180px', background: 'linear-gradient(180deg, #F1F5F9 0%, #E0E7FF 100%)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end' }}>
              {[40, 72, 55, 88, 64, 95, 48].map((h, i) => (
                <div key={i} style={{ width: '6px', height: `${h}px`, background: '#0F766E', borderRadius: '999px' }} />
              ))}
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: '60px', alignItems: 'center', marginBottom: '100px' }}>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[1,2,3].map(i => <div key={i} style={{ width: '92px', height: '120px', background: '#E2E8F0', borderRadius: '8px', boxShadow: '0 10px 20px rgba(0,0,0,0.08)' }} />)}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '26px', fontWeight: 600 }}>Textbook Zekası</h3>
            <p style={{ fontSize: '16px', color: '#444', lineHeight: 1.6 }}>Nelson, Braunwald ve Harrison referanslı tıbbi bilgi tabanı. Her yanıt akademik kaynaklıdır.</p>
          </div>
        </div>

        {/* Row 3 */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: '60px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '26px', fontWeight: 600 }}>Öğrenen Sistem</h3>
            <p style={{ fontSize: '16px', color: '#444', lineHeight: 1.6 }}>Her seansla birlikte sizin klinik pratiğinize göre uyarlanır. Zamanla daha iyi öneriler sunar.</p>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '28px' }}>
              <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '999px', marginBottom: '8px' }}>
                <div style={{ width: '84%', height: '6px', background: '#0F766E', borderRadius: '999px' }} />
              </div>
              <div style={{ fontSize: '13px', color: '#64748B' }}>Bu ay öğrenme oranı: %84</div>
            </div>
          </div>
        </div>
      </section>

      {/* CAPABILITIES GRID */}
      <section style={{ background: '#F9FAFB', padding: '120px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ color: '#0F766E', fontSize: '13px', fontWeight: 600 }}>KLİNİK ARAÇLAR</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', margin: '12px 0 0', fontWeight: 700 }}>Muayenehaneni tam güçle yönet.</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {[
              { title: 'Hasta Yönetimi', desc: 'TC kimlik doğrulama (MERNiS), profil ve tam tıbbi geçmiş' },
              { title: 'PACS/Görüntüleme', desc: 'DICOM, X-Ray, MRI, BT yükleme ve merkezi yönetim' },
              { title: 'İlaç Etkileşim', desc: 'Anlık etkileşim kontrolü, yaş ve böbrek uyum analizi' },
              { title: 'Hatırlatma', desc: 'WhatsApp ve SMS ile hasta bildirimleri' },
              { title: 'Aylık Raporlar', desc: 'Isı haritası, istatistik ve ICD-10 analizi' },
              { title: 'e-Reçete & Epikriz', desc: 'SGK uyumlu elektronik reçete ve epikriz üretimi' },
              { title: 'ICD-10 Kodlama', desc: 'Türkçe tanı girişi ile anlık otomatik kodlama' },
              { title: '30 SOAP Şablonu', desc: 'Her uzmanlık dalına özel yapılandırılmış not şablonları' }
            ].map((cap, idx) => (
              <div key={idx} style={{ background: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ width: '36px', height: '36px', background: '#0F766E', borderRadius: '10px', marginBottom: '18px' }} />
                <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{cap.title}</div>
                <div style={{ fontSize: '15px', color: '#555', lineHeight: 1.5 }}>{cap.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ASSISTANTS */}
      <section id="asistanlar" style={{ padding: '120px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, textAlign: 'center', marginBottom: '12px' }}>Size atanmış asistanınız sizi bekliyor.</h2>
        <p style={{ textAlign: 'center', color: '#555', marginBottom: '48px' }}>Uzmanlığınıza göre birincil asistan atanır. Konsültasyon için 27+ uzmana erişim.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Card 1 - Primary */}
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', borderLeft: '4px solid #0F766E', boxShadow: '0 10px 30px rgba(15,118,110,0.1)' }}>
            <img src="/doctors/dr_ayse.jpg" alt="Prof Dr Ayşe Kaya" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '20px' }} />
            <div style={{ fontWeight: 600, fontSize: '19px' }}>Prof. Dr. Ayşe Kaya</div>
            <div style={{ color: '#0F766E', marginBottom: '12px' }}>Pediatri • Birincil Asistan</div>
            <div style={{ display: 'inline-block', background: '#CCFBF1', color: '#0F766E', padding: '2px 10px', borderRadius: '999px', fontSize: '12px', marginBottom: '16px' }}>BİRİNCİL ASİSTAN</div>
            <div style={{ fontSize: '13px', color: '#666' }}>Nelson 22e + Harriet Lane</div>
          </div>

          {/* Card 2 */}
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px' }}>
            <img src="/doctors/dr_mehmet.jpg" alt="Prof Dr Mehmet Demir" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '20px' }} />
            <div style={{ fontWeight: 600, fontSize: '19px' }}>Prof. Dr. Mehmet Demir</div>
            <div style={{ color: '#666', marginBottom: '12px' }}>Kardiyoloji</div>
            <div style={{ display: 'inline-block', background: '#F1F5F9', padding: '2px 10px', borderRadius: '999px', fontSize: '12px', marginBottom: '16px' }}>KONSÜLTASYON</div>
            <div style={{ fontSize: '13px', color: '#666' }}>Braunwald 12e</div>
          </div>

          {/* Card 3 */}
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px' }}>
            <img src="/doctors/dr_elif.jpg" alt="Prof Dr Elif Şahin" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '20px' }} />
            <div style={{ fontWeight: 600, fontSize: '19px' }}>Prof. Dr. Elif Şahin</div>
            <div style={{ color: '#666', marginBottom: '12px' }}>Nöroloji</div>
            <div style={{ display: 'inline-block', background: '#F1F5F9', padding: '2px 10px', borderRadius: '999px', fontSize: '12px', marginBottom: '16px' }}>KONSÜLTASYON</div>
            <div style={{ fontSize: '13px', color: '#666' }}>Adams &amp; Victor</div>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '13px', color: '#888' }}>+ 27 uzmanlık alanı konsültasyon için hazır</div>
      </section>

      {/* INTEGRATIONS */}
      <section id="entegrasyonlar" style={{ background: '#060C18', color: '#fff', padding: '120px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ color: '#5EEAD4', fontSize: '13px', fontWeight: 600 }}>ENTEGRASYONLAR</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', margin: '12px 0 0', fontWeight: 700 }}>Türkiye Sağlık Ekosistemi ile tam bağlı.</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {[
              { name: 'e-Nabız / Sağlık.NET', desc: 'Hasta kayıtları', badge: 'ENTEGRE', color: '#5EEAD4' },
              { name: 'MERNiS / TC Kimlik', desc: 'Otomatik kimlik doğrulama', badge: 'ENTEGRE', color: '#5EEAD4' },
              { name: 'SGK Medula', desc: 'e-reçete, provizyon', badge: 'ENTEGRE', color: '#5EEAD4' },
              { name: 'ICD-10 / HBYS', desc: 'Otomatik kodlama', badge: 'ENTEGRE', color: '#5EEAD4' },
              { name: 'e-Devlet / MERNİS', desc: 'TC kimlik doğrulama', badge: 'ENTEGRE', color: '#5EEAD4' },
              { name: 'MHRS Randevu', desc: 'Merkezi randevu', badge: 'YAKINDAN', color: '#F59E0B' },
              { name: 'Paraşüt / Muhasebe', desc: 'Ödeme takibi', badge: 'PLANLANIYOR', color: '#64748B' }
            ].map((int, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
                <div style={{ fontWeight: 600, marginBottom: '6px' }}>{int.name}</div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>{int.desc}</div>
                <div style={{ display: 'inline-block', background: int.color, color: '#111', padding: '1px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 }}>{int.badge}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '120px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, textAlign: 'center', marginBottom: '56px' }}>Üç adımda başlayın.</h2>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '40px', justifyContent: 'center' }}>
          {[
            { num: '01', title: 'Kayıt Ol', desc: '2 dakikada kaydolun' },
            { num: '02', title: 'Asistanla Tanış', desc: 'Uzmanlığınıza göre atama' },
            { num: '03', title: 'Çalış', desc: 'İlk seansı bugün yapın' }
          ].map((step, idx) => (
            <div key={idx} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '42px', fontWeight: 700, color: '#0F766E', marginBottom: '12px' }}>{step.num}</div>
              <div style={{ fontSize: '19px', fontWeight: 600 }}>{step.title}</div>
              <div style={{ color: '#555', marginTop: '8px' }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="fiyatlar" style={{ background: '#F9FAFB', padding: '120px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, marginBottom: '56px' }}>Basit ve şeffaf fiyatlandırma.</h2>
          <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', justifyContent: 'center' }}>
            {[
              { name: 'Starter', price: '299', badge: null },
              { name: 'Pro', price: '799', badge: 'Önerilen', elevated: true },
              { name: 'Klinik', price: '2499', badge: null }
            ].map((tier, idx) => (
              <div key={idx} style={{
                flex: 1, background: '#fff', borderRadius: '20px', padding: '36px 32px',
                border: tier.elevated ? '2px solid #0F766E' : '1px solid #eee',
                boxShadow: tier.elevated ? '0 20px 40px rgba(15,118,110,0.1)' : 'none',
                transform: tier.elevated ? 'scale(1.02)' : 'none'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '21px', fontWeight: 600 }}>{tier.name}</div>
                  {tier.badge && <div style={{ background: '#0F766E', color: '#fff', fontSize: '11px', padding: '2px 10px', borderRadius: '999px' }}>{tier.badge}</div>}
                </div>
                <div style={{ margin: '20px 0' }}>
                  <span style={{ fontSize: '48px', fontWeight: 700 }}>{tier.price}</span>
                  <span style={{ fontSize: '15px', color: '#666' }}> TL/ay</span>
                </div>
                <button style={{ width: '100%', padding: '14px', background: tier.elevated ? '#0F766E' : '#111', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>Başla</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ background: '#060C18', color: '#fff', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 700, marginBottom: '24px' }}>Klinik pratiğinizi bir üst seviyeye taşıyın.</h2>
        <button style={{ padding: '16px 40px', background: '#0F766E', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '17px', fontWeight: 600, cursor: 'pointer' }}>15 Gün Ücretsiz Deneyin</button>
        <div style={{ marginTop: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>15 gün ücretsiz • Kredi kartı yok • KVKK & AES-256 uyumlu</div>
      </section>
    </div>
  );
};

export default HomePage;
