-- NOTYA-DAH-WOW-NEXT C4 (2026-09-17): SGK rapor şablonlarına D vitamini ve B12 eklendi (engines/sgkRapor.ts 'vitd' | 'b12').
alter table dahiliye_sgk_raporlari drop constraint if exists dahiliye_sgk_raporlari_sablon_check;
alter table dahiliye_sgk_raporlari add constraint dahiliye_sgk_raporlari_sablon_check check (sablon in ('ht','dm','statin','doak','vitd','b12'));
