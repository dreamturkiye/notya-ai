/**
 * AKKS question bank — all 30 medical branşlar + 10 Özel Branşlar (one file each). Parsed once per process.
 * Every item is a Claude draft (2026-11-24) until a clinician approves it (akks_soru_inceleme, bound to the item hash).
 */
import { bankaCoz, type BankaKaynagi } from '../banka'
import type { SoruMaddesi } from '../tipler'
import acilTip from './acil-tip'
import aileHekimligi from './aile-hekimligi'
import anestezi from './anestezi'
import beyinCerrahisi from './beyin-cerrahisi'
import cocukCerrahisi from './cocuk-cerrahisi'
import dahiliye from './dahiliye'
import dermatoloji from './dermatoloji'
import diyetisyen from './diyetisyen'
import endokrinoloji from './endokrinoloji'
import enfeksiyonHastaliklari from './enfeksiyon-hastaliklari'
import ergoterapi from './ergoterapi'
import estetikCerrahi from './estetik-cerrahi'
import fizikTedavi from './fizik-tedavi'
import fizyoterapi from './fizyoterapi'
import gastroenteroloji from './gastroenteroloji'
import genelCerrahi from './genel-cerrahi'
import gogusCerrahisi from './gogus-cerrahisi'
import gogusHastaliklari from './gogus-hastaliklari'
import gozHastaliklari from './goz-hastaliklari'
import kadinHastaliklariDogum from './kadin-hastaliklari-dogum'
import kalpDamarCerrahisi from './kalp-damar-cerrahisi'
import kardiyoloji from './kardiyoloji'
import klinikDermatoloji from './klinik-dermatoloji'
import klinikPsikolog from './klinik-psikolog'
import kulakBurunBogaz from './kulak-burun-bogaz'
import longevity from './longevity'
import medikalEstetik from './medikal-estetik'
import nefroloji from './nefroloji'
import noroloji from './noroloji'
import odyoloji from './odyoloji'
import onkoloji from './onkoloji'
import ortopedi from './ortopedi'
import pediatri from './pediatri'
import plastikCerrahi from './plastik-cerrahi'
import psikiyatri from './psikiyatri'
import radyoloji from './radyoloji'
import romatoloji from './romatoloji'
import sacEkimi from './sac-ekimi'
import sporHekimligi from './spor-hekimligi'
import uroloji from './uroloji'

export const BANKA_KAYNAKLARI: readonly BankaKaynagi[] = [acilTip, aileHekimligi, anestezi, beyinCerrahisi, cocukCerrahisi, dahiliye, dermatoloji, diyetisyen, endokrinoloji, enfeksiyonHastaliklari, ergoterapi, estetikCerrahi, fizikTedavi, fizyoterapi, gastroenteroloji, genelCerrahi, gogusCerrahisi, gogusHastaliklari, gozHastaliklari, kadinHastaliklariDogum, kalpDamarCerrahisi, kardiyoloji, klinikDermatoloji, klinikPsikolog, kulakBurunBogaz, longevity, medikalEstetik, nefroloji, noroloji, odyoloji, onkoloji, ortopedi, pediatri, plastikCerrahi, psikiyatri, radyoloji, romatoloji, sacEkimi, sporHekimligi, uroloji]

let onbellek: { maddeler: SoruMaddesi[]; hatalar: string[] } | null = null

export function banka(): { maddeler: SoruMaddesi[]; hatalar: string[] } {
  if (onbellek) return onbellek
  const maddeler: SoruMaddesi[] = []
  const hatalar: string[] = []
  for (const k of BANKA_KAYNAKLARI) {
    const r = bankaCoz(k)
    maddeler.push(...r.maddeler)
    hatalar.push(...r.hatalar)
  }
  onbellek = { maddeler, hatalar }
  return onbellek
}

export const tumMaddeler = (): SoruMaddesi[] => banka().maddeler
export const bransMaddeleri = (brans: string): SoruMaddesi[] => banka().maddeler.filter((m) => m.brans === brans)
export const maddeBul = (id: string): SoruMaddesi | null => banka().maddeler.find((m) => m.id === id) ?? null
