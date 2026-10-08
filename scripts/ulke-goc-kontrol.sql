-- NOTYA-ULKE-SABLON-01 — BEFORE / AFTER CHECK for the country migrations 129–135 (docs/COUNTRY-PACK-DB-ROLLOUT.md).
--
-- READ ONLY: one SELECT. It changes nothing and takes only the locks an ordinary read takes.
--
-- Run it BEFORE the migrations and save the result. Run it again AFTER. Every line must be identical, except:
--     definition storage.objects      (one more policy: the upload rule of the recordings bucket)
--     rows storage.buckets            (one more row: the recordings bucket)
--     rows public.schema_migrations   (seven more rows: 129–135)
-- Any other difference means something of Türkiye's changed: stop and look before doing anything else.
-- (On a database in use, a doctor working between the two runs changes row counts too — hence the quiet hour.)
--
-- What a line is:
--     rows <table>         the exact number of rows in a table that existed before the migrations
--     definition <table>   a fingerprint of its columns (name, type, null rule, default), constraints, indexes,
--                          row-level policies, triggers and row-level-security switches
-- Covered: every table of the `public` schema except the thirteen the migrations create, plus auth.users,
-- storage.objects and storage.buckets.
with yeni(ad) as (
  values ('davet_kodlari'), ('ulke_hesaplari'), ('hekim_dil_tercihleri'), ('ulke_hastalar'), ('hasta_ulke_bilgisi'),
         ('ulke_muayeneler'), ('muayene_dil_kaydi'), ('ulke_kullanim'), ('ulke_notlar'), ('not_dil_kaydi'),
         ('hekim_rolu'), ('hekim_calisma_duzeni'), ('ulke_randevulari')
),
tablolar as (
  select n.nspname as sema, c.relname as ad, c.oid
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where c.relkind in ('r', 'p')
     and (n.nspname = 'public' or (n.nspname, c.relname) in (('auth', 'users'), ('storage', 'objects'), ('storage', 'buckets')))
     and not (n.nspname = 'public' and c.relname in (select ad from yeni))
)
select 'rows ' || sema || '.' || ad as what,
       (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', sema, ad), false, true, '')))[1]::text as value
  from tablolar
union all
select 'definition ' || t.sema || '.' || t.ad,
       md5(
         coalesce((select string_agg(a.attname || ':' || format_type(a.atttypid, a.atttypmod) || ':' || a.attnotnull::text || ':' || coalesce(pg_get_expr(d.adbin, d.adrelid), ''), '|' order by a.attnum)
                     from pg_attribute a
                     left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
                    where a.attrelid = t.oid and a.attnum > 0 and not a.attisdropped), '')
         || '#' || coalesce((select string_agg(k.conname || ':' || pg_get_constraintdef(k.oid), '|' order by k.conname) from pg_constraint k where k.conrelid = t.oid), '')
         || '#' || coalesce((select string_agg(pg_get_indexdef(i.indexrelid), '|' order by i.indexrelid::regclass::text) from pg_index i where i.indrelid = t.oid), '')
         || '#' || coalesce((select string_agg(p.polname || ':' || p.polcmd::text || ':' || p.polpermissive::text || ':' || coalesce(pg_get_expr(p.polqual, p.polrelid), '') || ':' || coalesce(pg_get_expr(p.polwithcheck, p.polrelid), ''), '|' order by p.polname) from pg_policy p where p.polrelid = t.oid), '')
         || '#' || coalesce((select string_agg(g.tgname || ':' || pg_get_triggerdef(g.oid), '|' order by g.tgname) from pg_trigger g where g.tgrelid = t.oid and not g.tgisinternal), '')
         || '#' || (select c.relrowsecurity::text || c.relforcerowsecurity::text from pg_class c where c.oid = t.oid)
       )
  from tablolar t
 order by 1;
