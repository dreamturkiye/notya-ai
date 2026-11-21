'use client';

/**
 * KAN-GRUBU-SECIM-01 — the doctor-side blood-group field: a select with the 8 groups + "Bilinmiyor" (or ABO only, for
 * the pregnancy card whose Rh has its own field). An old stored text that is not a group stays visible as its own
 * option until the doctor picks another (lib/doktor/kanGrubu.ts). The empty option's text is the caller's.
 */
import React from 'react';
import { KAN_GRUPLARI, KAN_GRUBU_BILINMIYOR, kanGrubuSecenekleri } from '@/lib/doktor/kanGrubu';

export default function KanGrubuSecici({ deger, degistir, bosEtiket, style, id, ariaLabel, liste = KAN_GRUPLARI, bilinmiyor = KAN_GRUBU_BILINMIYOR }: {
  deger: string;
  degistir: (v: string) => void;
  /** Text of the empty option ("Kan grubu", "—"). */
  bosEtiket: string;
  style?: React.CSSProperties;
  id?: string;
  ariaLabel?: string;
  liste?: readonly string[];
  bilinmiyor?: string;
}) {
  const { secili, secenekler } = kanGrubuSecenekleri(deger, liste, bilinmiyor);
  return (
    <select id={id} aria-label={ariaLabel} data-kan-grubu="" value={secili} onChange={(e) => degistir(e.target.value)} style={style}>
      <option value="">{bosEtiket}</option>
      {secenekler.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}
