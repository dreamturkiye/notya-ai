'use client'
/**
 * HASTA-PORTALI-GUNLUK — today's doses grouped by time. One big "Aldım" per time group (5 medicines at 08:00 = one tap),
 * a round check per medicine, and Atladım / Ertele behind a second tap. As-needed medicines show the time since the last
 * dose and the doctor's minimum interval when set (never a computed dose).
 * BUGUN-V2: Atladım / Ertele sit behind a quiet "…" in the row (and long-press), not under every medicine.
 * DOZ-KAYDI-ISTEGE-BAGLI: a medicine the patient does not log shows its time and dose only — no tick, no menu, a quiet
 * "Hatırlatma" / "Hatırlatma kapalı" word; an unmarked logged dose says "Kayıt yok", never "alınmadı".
 */
import { useState } from 'react'
import type { GunlukDurum } from '@/lib/saglikEvi/ozet'
import type { SaglikEviSozleri } from '@/lib/saglikEvi/sozler'
import { saatMetni, sureMetni } from '@/lib/saglikEvi/sozler'
import type { GunlukEylemleri } from './eylemler'
import { UyariIsareti } from '@/components/doktor/saglikEvi/UyariIsareti'

const Tik = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>

export function DozListesi({ s, durum, eylemler }: { s: SaglikEviSozleri; durum: GunlukDurum; eylemler: GunlukEylemleri }) {
  const [acik, setAcik] = useState<string | null>(null)
  const [mesgul, setMesgul] = useState<string | null>(null)
  const gruplar = new Map<string, GunlukDurum['bugunDozlar']>()
  for (const d of durum.bugunDozlar) gruplar.set(d.at, [...(gruplar.get(d.at) || []), d])
  const isle = async (anahtar: string, planIds: string[], at: string | null, d: 'alindi' | 'atlandi' | 'ertelendi' | 'geri') => {
    setMesgul(anahtar)
    if (d === 'alindi') try { navigator.vibrate?.(12) } catch { /* yok */ }
    try { await eylemler.doz(planIds, at, d) } finally { setMesgul(null); setAcik(null) }
  }
  const simdi = Date.now()
  const hatirlatmaGlobal = durum.tercihler.hatirlatmaAcik !== false
  const hatirlatiyor = (planId: string) => hatirlatmaGlobal && durum.planlar.find((p) => p.id === planId)?.hatirlatmaAcik !== false
  return (
    <div>
      {[...gruplar.entries()].map(([at, liste]) => {
        const bekleyen = liste.filter((x) => x.kayitAcik && x.durum !== 'alindi' && x.durum !== 'atlandi')
        const acikta = bekleyen.find((b) => b.durum !== 'kayit_yok')
        const saat = liste[0].saat
        return (
          <div key={at} className="sge-doz-grup">
            <div className="sge-doz-saat">{saat}<small>{bekleyen.length ? (acikta ? s.durum[acikta.durum] : '') : liste.some((x) => x.kayitAcik) ? s.durum.alindi : ''}</small></div>
            <div>
              {liste.map((x) => {
                const anahtar = `${x.planId}|${at}`
                const dolu = x.durum === 'alindi'
                if (!x.kayitAcik) {
                  return (
                    <div key={anahtar} className="sge-dozsatir">
                      <div className="sge-dozsatir-metin">
                        <div className="sge-dozsatir-ad">{x.ad}{x.kaynak === 'hasta' ? <span className="sge-etiket sge-etiket--hasta">{s.hastaEkledi}</span> : null}{x.kritik ? <span className="sge-etiket sge-etiket--kritik">{s.kritik}</span> : null}</div>
                        {x.doz ? <div className="sge-dozsatir-doz">{x.doz}</div> : null}
                      </div>
                      <span className="sge-not" style={{ margin: 0, flexShrink: 0 }}>{dolu ? s.durum.alindi : hatirlatiyor(x.planId) ? s.yalnizHatirlatma : s.hatirlatmaKapaliEtiket}</span>
                    </div>
                  )
                }
                return (
                  <div key={anahtar}>
                    <div className="sge-dozsatir">
                      <div className="sge-dozsatir-metin">
                        <div className="sge-dozsatir-ad">{x.ad}{x.kaynak === 'hasta' ? <span className="sge-etiket sge-etiket--hasta">{s.hastaEkledi}</span> : null}{x.kritik ? <span className="sge-etiket sge-etiket--kritik">{s.kritik}</span> : null}</div>
                        {x.doz ? <div className="sge-dozsatir-doz">{x.doz}</div> : null}
                        {/* UYARI-RENKLERI: a missed / skipped dose is an adherence lapse — slate, dashed mark, its word; never red. */}
                        {x.durum === 'atlandi' || x.durum === 'kayit_yok' ? <div className="sge-dozsatir-doz"><UyariIsareti ton="uyum" etiket={x.durum === 'atlandi' ? s.uyumAtlandi : s.uyumIsaretlenmedi} kucuk /></div> : x.durum === 'ertelendi' ? <div className="sge-dozsatir-doz">{s.durum[x.durum]}</div> : null}
                      </div>
                      {!dolu && x.durum !== 'atlandi' ? (
                        <button type="button" className="sge-doz-diger" aria-label={`${x.ad} ${saat}: ${s.digerSecenek}`} aria-expanded={acik === anahtar} onClick={() => setAcik(acik === anahtar ? null : anahtar)}>
                          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden><circle cx="5" cy="12" r="1.8" fill="currentColor" /><circle cx="12" cy="12" r="1.8" fill="currentColor" /><circle cx="19" cy="12" r="1.8" fill="currentColor" /></svg>
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={`sge-tik${dolu ? ' sge-tik--dolu' : x.durum === 'atlandi' ? ' sge-tik--atla' : x.durum === 'kayit_yok' ? ' sge-tik--kacti' : ''}`}
                        aria-pressed={dolu}
                        aria-label={`${x.ad} ${saat}: ${dolu ? s.geriAl : s.simdiAldim}`}
                        disabled={mesgul === anahtar}
                        onClick={() => (dolu || x.durum === 'atlandi' ? isle(anahtar, [x.planId], at, 'geri') : isle(anahtar, [x.planId], at, 'alindi'))}
                        onContextMenu={(e) => { e.preventDefault(); setAcik(acik === anahtar ? null : anahtar) }}
                      >
                        {dolu ? <Tik /> : x.durum === 'atlandi' ? '–' : <Tik />}
                      </button>
                    </div>
                    {!dolu && x.durum !== 'atlandi' && acik === anahtar ? (
                      <div className="sge-doz-menu">
                        <button type="button" onClick={() => isle(anahtar, [x.planId], at, 'atlandi')}>{s.simdiAtladim}</button>
                        <button type="button" onClick={() => isle(anahtar, [x.planId], at, 'ertelendi')}>{s.simdiErtele}</button>
                        <button type="button" onClick={() => setAcik(null)}>{s.vazgec}</button>
                      </div>
                    ) : null}
                  </div>
                )
              })}
              {bekleyen.length > 1 ? (
                <button type="button" className="sge-btn-aldim sge-grup-aldim" disabled={mesgul === at} onClick={() => isle(at, bekleyen.map((b) => b.planId), at, 'alindi')}>
                  <Tik /> {s.grupAldim(bekleyen.length)}
                </button>
              ) : null}
            </div>
          </div>
        )
      })}
      {durum.gerektikce.length ? (
        // PORTAL-REGRESYON-2026-11-25: the "as needed" word gets the full width (it never fit the 62 px time column).
        <div className="sge-doz-grup sge-doz-grup--gerektikce">
          <div className="sge-doz-saat">{s.gerektikceBaslik}</div>
          <div>
            {durum.gerektikce.map((g) => (
              <div key={g.planId} className="sge-dozsatir sge-dozsatir--gerektikce">
                <div className="sge-dozsatir-metin">
                  <div className="sge-dozsatir-ad">{g.ad}</div>
                  {g.doz ? <div className="sge-dozsatir-doz">{g.doz}</div> : null}
                  <div className="sge-dozsatir-doz">{g.sonAt ? s.sonDoz(sureMetni(simdi - Date.parse(g.sonAt))) : s.sonDozYok}</div>
                  {g.minAralikSaat && g.uygunAt ? <div className="sge-dozsatir-doz" style={{ color: g.bekle ? 'var(--sge-uyum)' : undefined }}>{s.aralik(g.minAralikSaat, saatMetni(g.uygunAt))}</div> : null}
                </div>
                <button type="button" className="sge-btn" disabled={mesgul === g.planId} onClick={() => isle(g.planId, [g.planId], null, 'alindi')}>{s.gerektikceVerdim}</button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {!durum.bugunDozlar.length && !durum.gerektikce.length ? <p className="sge-not">{s.ilacYokBaslik}</p> : null}
    </div>
  )
}
