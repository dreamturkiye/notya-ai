-- Migration 010: Randevu hasta durumu (sağlıklı / şikayeti olan hasta)
-- NOTYA-RANDEVU-08: randevu formunda Not alanından önce hızlı bir ayrım — rutin/sağlıklı
-- ziyaret mi, yoksa bir şikayet için mi. Triyaj ve raporlama için düşük maliyetli, yüksek
-- değerli bir alan.
ALTER TABLE randevular ADD COLUMN IF NOT EXISTS hasta_durumu TEXT
  CHECK (hasta_durumu IN ('saglikli', 'sikayetli'));
