// app/api/asistan/avukat-learn/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { correctionType, original, corrected, actionId, branchId } = body;

  // Load avukat_preferences
  const { data: preferencesData, error: preferencesError } = await supabaseClient
    .from('avukat_preferences')
    .select('*')
    .eq('avukat_id', req.headers.get('x-avukat-id'))
    .single();

  if (preferencesError) {
    return NextResponse.json({ error: 'Failed to load preferences' }, { status: 500 });
  }

  const correctionHistory = preferencesData.correction_history || [];
  correctionHistory.push({ original, corrected, actionId, branchId });

  // Keep last 50 corrections
  if (correctionHistory.length > 50) {
    correctionHistory.shift();
  }

  let preferredDilekce = preferencesData.preferred_dilekce;
  let preferredKanunlar = preferencesData.preferred_kanunlar;

  if (correctionType === 'dilekce') {
    preferredDilekce = corrected;
  } else if (correctionType === 'kanun') {
    preferredKanunlar = corrected;
  }

  // Upsert avukat_preferences
  const { error: upsertError } = await supabaseClient
    .from('avukat_preferences')
    .upsert(
      [
        {
          avukat_id: req.headers.get('x-avukat-id'),
          preferred_dilekce,
          branch_style: preferencesData.branch_style,
          correction_history: correctionHistory,
          preferred_kanunlar,
          sessions_completed: preferencesData.sessions_completed,
          last_session_at: new Date(),
        },
      ],
      { onConflict: ['avukat_id'] }
    );

  if (upsertError) {
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}