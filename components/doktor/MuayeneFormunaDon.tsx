'use client';
/**
 * NOTYA-MUAYENEYE-DON-01 (Gökhan, 2026-09-17) — sonucu bugünkü muayene formuna ekleyen her
 * araçta ("M-CHAT-R/F", gelişim taraması, gebelik izlemi, dahiliye/göz "Nota ekle" kartları)
 * onay mesajının yanında duran ortak dönüş bağlantısı.
 *
 * Kasıtlı olarak ikincil: düz bağlantı, dolgu yok, 12px — birincil yeşil onayla yarışmaz.
 * notId yoksa hiçbir şey çizmez; not eklenemediyse hekimi boşuna bir forma göndermeyiz.
 *
 * minHeight 36: mobil dokunma hedefi kuralı (docs/OPEN-COMMITMENTS.md standing rule). Metin
 * 12px kalıyor — büyüyen yalnız tıklama alanı, görsel ağırlık değil.
 */
import React from 'react';
import { muayeneFormuYolu, MUAYENE_FORMUNA_DON } from '@/lib/doktor/muayeneFormuYolu';

export default function MuayeneFormunaDon({ notId, style }: { notId?: string | null; style?: React.CSSProperties }) {
  if (!notId) return null;
  return (
    <a
      href={muayeneFormuYolu(notId)}
      style={{ fontSize: 12, color: '#2DD4BF', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', minHeight: 36, ...style }}
    >
      {MUAYENE_FORMUNA_DON}
    </a>
  );
}
