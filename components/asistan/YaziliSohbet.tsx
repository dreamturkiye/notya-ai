/**
 * NOTYA-KADEME-01 — Yazılı Ayşe (temel kademe yüzeyi).
 * Doktor MİKROFONLA konuşur (tarayıcı STT — ücretsiz), Ayşe YAZILI cevap verir:
 * ElevenLabs jetonu hiç yanmaz. Arkada /api/asistan/chat çalışır — yani hasta dosyası
 * bilinci, "son hastam" çözümleme, ilaç etkileşim uyarısı ve aksiyonlar TAMAMEN aktif.
 * Halka açılışta kademe planı: temel = bu yüzey; orta/pro = ElevenLabs sesli 1:1
 * (seans limitli). Kademe zorlaması abonelik lansmanında eklenecek — yetenek bugün herkese açık.
 *
 * NOTYA-ASISTAN-YUZEN-01: sohbet durumu (mesajlar, girdi, STT, ortak oturum) AsistanOturumContext'te —
 * doktor başka sayfaya geçince sohbet sürer. Bu bileşen yalnız görünüm.
 *
 * AU-DEPTH-PARITY-03: the view is the shared YaziliSohbetGorunumu; Türkiye's words and cards are YaziliSohbetTR
 * (AsistanSayfaTR.tsx). This file only reads the session.
 */
'use client';

import React from 'react';
import { useAsistanOturum } from '@/components/asistan/AsistanOturumContext';
import { YaziliSohbetTR } from '@/components/asistan/AsistanSayfaTR';

export default function YaziliSohbet() {
  return <YaziliSohbetTR o={useAsistanOturum()} />;
}
