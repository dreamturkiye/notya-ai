'use client';
/**
 * Hafif Markdown — asistan cevapları için (Kaan 2026-09-10: "**Cinsiyet:** Kız hasta" ham görünüyordu).
 * Desteklenen: **kalın**, "- " madde satırları, "**Etiket:** değer" satırları iki sütun gibi hizalı,
 * boş satır = paragraf boşluğu. Bağımlılık yok; klinik metinde bunun ötesi gerekmez.
 */
import React from 'react';

function kalin(metin: string, karanlik: boolean): React.ReactNode[] {
  const parcalar = metin.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parcalar.map((p, i) => (p.startsWith('**') && p.endsWith('**') ? <b key={i} style={{ color: karanlik ? '#EDF1F7' : '#111' }}>{p.slice(2, -2)}</b> : <React.Fragment key={i}>{p}</React.Fragment>));
}

export default function HafifMarkdown({ metin, karanlik = true }: { metin: string; karanlik?: boolean }) {
  const etiketRenk = karanlik ? '#7FB8B0' : '#0F6B5C';
  const satirlar = metin.replace(/\r/g, '').split('\n');
  const cikti: React.ReactNode[] = [];
  let madde: string[] = [];
  const maddeyiBos = (key: string) => {
    if (!madde.length) return;
    cikti.push(
      <div key={key} style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', columnGap: 10, rowGap: 5, margin: '4px 0 6px' }}>
        {madde.map((m, i) => {
          const es = m.match(/^\*\*([^*]+?):?\*\*:?\s*(.*)$/);
          if (es) {
            return (
              <React.Fragment key={i}>
                <span style={{ color: etiketRenk, fontWeight: 600, whiteSpace: 'nowrap' }}>{es[1].replace(/:$/, '')}</span>
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
  satirlar.forEach((s, i) => {
    const t = s.trim();
    const md = t.match(/^[-•*]\s+(.*)$/);
    if (md) { madde.push(md[1]); return; }
    maddeyiBos(`m${i}`);
    if (!t) { cikti.push(<div key={`b${i}`} style={{ height: 6 }} />); return; }
    cikti.push(<div key={`p${i}`} style={karanlik ? undefined : { color: '#222' }}>{kalin(t, karanlik)}</div>);
  });
  maddeyiBos('son');
  return <div style={{ lineHeight: 1.55 }}>{cikti}</div>;
}
