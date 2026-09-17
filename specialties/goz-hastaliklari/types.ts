/** GOZ-CHAPTER — shared chapter types (live truth = goz_* tables; these are API/UI contracts). */
export type { GozRef, Dipnot } from './protocols/sources'
export type { VaKategori, VaOkuma, VaSeti, MuayeneOlcum } from './engines/va'
export type { GlokomKart, Damla, GibOlcum } from './engines/glokom'
export type { DrEvre, Dmo, DrSonuc } from './engines/dr'
export type { Ajan, Endikasyon, Enjeksiyon, YanitSinif } from './engines/antiVegf'
export type { AcilKod, AcilBayrak } from './engines/acil'
export type { GozSgkSablon } from './engines/sgkRapor'
export type { GozSerit } from './engines/serit'

export type GozTaraf = 'sag' | 'sol'
export type VisitType = 'genel-poliklinik' | 'glokom' | 'retina' | 'enjeksiyon' | 'katarakt-preop' | 'kornea-on-segment' | 'pediatrik-sasilik' | 'acil'
export type ClinicUnit = 'genel' | 'glokom' | 'retina' | 'katarakt-refraktif' | 'kornea' | 'pediatrik-sasilik'
