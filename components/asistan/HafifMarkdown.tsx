'use client';
/**
 * Hafif Markdown — asistan cevapları için (Kaan 2026-09-10: "**Cinsiyet:** Kız hasta" ham görünüyordu).
 * Desteklenen: **kalın**, "- " madde satırları, "**Etiket:** değer" satırları iki sütun gibi hizalı,
 * boş satır = paragraf boşluğu. Bağımlılık yok; klinik metinde bunun ötesi gerekmez.
 * MD-TABLO (2026-09-17): pipe tabloları gerçek tablo (dar ekranda yalnız tablo yatay kayar, sayfa taşmaz), # / ## / ### başlık, --- ayraç.
 */
import React from 'react';
import { tabloBasiMi, tabloOku, ayiriciMi, inlineMaddeAyir, type Tablo } from '@/lib/asistan/markdownTablo';

const HIZA = { sol: 'left', orta: 'center', sag: 'right' } as const;

function TabloGorunum({ tablo, karanlik }: { tablo: Tablo; karanlik: boolean }) {
  const cizgi = karanlik ? 'rgba(255,255,255,0.12)' : '#D6DCE4';
  const hucre = (i: number): React.CSSProperties => ({ textAlign: HIZA[tablo.hizalar[i] || 'sol'], padding: '5px 8px', borderBottom: `1px solid ${cizgi}`, verticalAlign: 'top', minWidth: 72, maxWidth: 260, overflowWrap: 'break-word' });
  return (
    // width 0 + minWidth 100%: the wide table never adds to the bubble's / panel's intrinsic width (390px panel grew to 421px); it scrolls here.
    <div style={{ overflowX: 'auto', width: 0, minWidth: '100%', margin: '6px 0', WebkitOverflowScrolling: 'touch' }} data-md-tablo>
      <table style={{ borderCollapse: 'collapse', fontSize: '0.93em', lineHeight: 1.4, width: 'max-content', maxWidth: 'none' }}>
        <thead>
          <tr style={{ background: karanlik ? 'rgba(255,255,255,0.06)' : '#F1F4F8' }}>
            {tablo.baslik.map((h, i) => <th key={i} style={{ ...hucre(i), fontWeight: 700, color: karanlik ? '#EDF1F7' : '#111' }}>{kalin(h, karanlik)}</th>)}
          </tr>
        </thead>
        <tbody>
          {tablo.satirlar.map((r, j) => (
            <tr key={j}>{r.map((h, i) => <td key={i} style={hucre(i)}>{kalin(h, karanlik)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function kalin(metin: string, karanlik: boolean): React.ReactNode[] {
  const parcalar = metin.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parcalar.map((p, i) => (p.startsWith('**') && p.endsWith('**') ? <b key={i} style={{ color: karanlik ? '#EDF1F7' : '#111' }}>{p.slice(2, -2)}</b> : <React.Fragment key={i}>{p}</React.Fragment>));
}

export default function HafifMarkdown({ metin, karanlik = false }: { metin: string; karanlik?: boolean }) {
  const etiketRenk = karanlik ? '#7FB8B0' : '#0F6B5C';
  const satirlar = metin.replace(/\r/g, '').split('\n');
  // NOTYA-ASISTAN-REHBER-01: tek satıra • ile zincirlenmiş maddeler gerçek madde satırlarına açılır.
  const acik = satirlar.flatMap(inlineMaddeAyir);
  const cikti: React.ReactNode[] = [];
  let madde: string[] = [];
  const maddeyiBos = (key: string) => {
    if (!madde.length) return;
    cikti.push(
      // fit-content(45%) + wrapping label: a long "**Label:** value" label (max-content + nowrap) set the chat panel's min width (445px panel on a 360px screen, left edge cut).
      <div key={key} style={{ display: 'grid', gridTemplateColumns: 'fit-content(45%) minmax(0, 1fr)', columnGap: 10, rowGap: 5, margin: '4px 0 6px' }}>
        {madde.map((m, i) => {
          const es = m.match(/^\*\*([^*]+?):?\*\*:?\s*(.*)$/);
          if (es) {
            return (
              <React.Fragment key={i}>
                <span style={{ color: etiketRenk, fontWeight: 600, overflowWrap: 'anywhere' }}>{es[1].replace(/:$/, '')}</span>
                <span>{kalin(es[2], karanlik)}</span>
              </React.Fragment>
            );
          }
          return (
            <React.Fragment key={i}>
              <span style={{ color: etiketRenk }}>•</span>
              <span>{kalin(m, karanlik)}</span>
            </React.Fragment>
          );
        })}
      </div>
    );
    madde = [];
  };
  for (let i = 0; i < acik.length; i++) {
    const t = acik[i].trim();
    if (tabloBasiMi(acik, i)) {
      maddeyiBos(`m${i}`);
      const { tablo, sonraki } = tabloOku(acik, i);
      cikti.push(<TabloGorunum key={`t${i}`} tablo={tablo} karanlik={karanlik} />);
      i = sonraki - 1;
      continue;
    }
    // MD-TABLO-FIX (Kaan, 2026-09-19): tablo olarak ayristirilamayan ham satirlar hekime
    // "IIIII IIIII" gibi gorunuyordu. Yalniz ayiractan ibaret bir satir ("|---|---|") bicim
    // gurultusudur - asla duz metin olarak basilmaz.
    if (t.includes('|') && ayiriciMi(t)) continue;
    const md = t.match(/^[-•*]\s+(.*)$/);
    if (md && !/^(?:[-*]\s*){3,}$/.test(t)) { madde.push(md[1]); continue; }
    maddeyiBos(`m${i}`);
    if (!t) { cikti.push(<div key={`b${i}`} style={{ height: 6 }} />); continue; }
    if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(t)) { cikti.push(<hr key={`h${i}`} style={{ border: 0, borderTop: `1px solid ${karanlik ? 'rgba(255,255,255,0.12)' : '#D6DCE4'}`, margin: '8px 0' }} />); continue; }
    const baslik = t.match(/^(#{1,3})\s+(.*)$/);
    if (baslik) {
      cikti.push(<div key={`g${i}`} style={{ fontWeight: 700, fontSize: baslik[1].length === 1 ? '1.12em' : baslik[1].length === 2 ? '1.06em' : '1em', margin: '8px 0 2px', color: karanlik ? '#EDF1F7' : '#111' }}>{kalin(baslik[2], karanlik)}</div>);
      continue;
    }
    // NOTYA-AYSE-DANIS-BICIM (Kaan/Dr. Gökhan, 2026-09-23): a long structured report (çek listesi +
    // Öneri) writes its section labels as a WHOLE line of just "**Etiket:**" or "**Etiket**" -- not
    // real markdown headings (#), and not caught by the "**Etiket:** değer" two-column layout above
    // (that one needs a value on the SAME line). Without this, such a line just fell through to a
    // plain paragraph -- same size, same spacing as body text, so a long report read as one flat
    // block. Treat a line that IS ONLY a bold span (optionally with a trailing colon) as a heading.
    const saltKalinBaslik = t.match(/^\*\*([^*]+?)\*\*:?$/);
    if (saltKalinBaslik) {
      cikti.push(<div key={`gb${i}`} style={{ fontWeight: 700, fontSize: '1.03em', margin: '12px 0 3px', color: karanlik ? '#EDF1F7' : '#111' }}>{saltKalinBaslik[1]}</div>);
      continue;
    }
    cikti.push(<div key={`p${i}`} style={karanlik ? undefined : { color: '#222' }}>{kalin(t, karanlik)}</div>);
  }
  maddeyiBos('son');
  // overflowWrap on the root: hosts without it (HastaKonsult, epikriz, SGK rapor) let an unbroken token (URL, code) run past the bubble.
  return <div style={{ lineHeight: 1.55, overflowWrap: 'anywhere' }}>{cikti}</div>;
}
