-- DAH-SCORE2-DIABETES (2026-09-17): SCORE2-Diabetes girdisi — diyabet tanı yaşı (DM kartında tanı tarihi yoksa hekim girer).
alter table dahiliye_kvr add column if not exists dm_tani_yasi int check (dm_tani_yasi is null or (dm_tani_yasi between 0 and 110));
