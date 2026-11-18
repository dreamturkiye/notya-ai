# TR outreach durum (canlı) — gift-first (4 adım)

**Demo slotları (placeholder):** Perşembe 20:00 · Cuma 13:00  
Doldur: `docs/growth/whatsapp-hazir-yanitlar.md` üstündeki `Secenek1` / `Secenek2`.

**Akış:** mesaj_1 (kart) → `/evet-*` (PDF + merak) → `/demo-*` (Notya + slot) → `/saat` `/deneme` `/onay` · 5g sessiz → `/takip` bir kez → `ilgilenmiyor`.

## Aksiyon

| Doktor | durum | sıradaki_adim |
|--------|--------|----------------|
| Ali Demirhan · Pediatri · +905333752572 | `kart_gonderildi` | bekle (STEP 1 soru) · 2g sonra `/demo-ped` |
| Müjdegül Z.Karaca · KD · +905344250343 | `teklif_edildi` | bekle — `/evet-kd` |
| Ayda Acar · Dermatoloji · +905324533071 | `teklif_edildi` | bekle — `/evet-derm` |

**Sıradaki mesaj_1:** sonraki `hazir` satır → HTML / CSV (`Ali Kütük` …)

```bash
python3 scripts/tr-wa-gift-first.py --refresh-status
python3 scripts/tr-wa-gift-first.py --apply-followups
```
