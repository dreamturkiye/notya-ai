-- DERM-EXCEPTIONAL-01 — Belge Tier A → derm dual-sign okuma köprüsü.
-- Additive only. derm_vision_reads zaten dual-sign kaydı (asistan draft → uzman onay); burada
-- taslağın NEREDEN geldiği (Belge kasası analizi) ve hangi güven üst sınırıyla yazıldığı saklanır.
-- RLS: hasta_derm üzerinden doctor-own (027_derm_clinic_fit.sql politikaları geçerli kalır).

alter table derm_vision_reads add column if not exists kaynak text not null default 'hekim';
alter table derm_vision_reads add column if not exists belge_id uuid;
alter table derm_vision_reads add column if not exists belge_analiz_id uuid;
alter table derm_vision_reads add column if not exists modalite text;
alter table derm_vision_reads add column if not exists bolge text;
alter table derm_vision_reads add column if not exists fitzpatrick_bilinmiyor boolean;
alter table derm_vision_reads add column if not exists guven_ust_pct integer;
alter table derm_vision_reads add column if not exists asistan_rapor jsonb;

-- Aynı Belge analizi ikinci kez aktarılamaz (onay bekleyen taslak varken 409).
create unique index if not exists derm_vision_belge_analiz_draft_idx
  on derm_vision_reads (belge_analiz_id)
  where belge_analiz_id is not null and status = 'draft';

create index if not exists derm_vision_kaynak_idx on derm_vision_reads (hasta_derm_id, kaynak);
