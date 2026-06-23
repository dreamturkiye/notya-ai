// route.ts

import { NextRequest } from 'next/server';
import { calculateDeadlines, getSurelerForBranch, formatDateTR } from '@/lib/avukat/sureEngine';
import { createClient } from '@supabase/supabase-js';





const getSupabase = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 });
  }

  const token = authHeader.substring(7);
  const { data: user, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 });
  }

  const { branch, baslangicTarihi, seciliSureler, muvekkilId, davaTanimi } = await req.json();
  
  if (!branch || !baslangicTarihi) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid input' }), { status: 400 });
  }

  const baslangicTarihiDate = new Date(baslangicTarihi);
  const sureIds = seciliSureler || getSurelerForBranch(branch);

  let deadlines;
  try {
    deadlines = calculateDeadlines(baslangicTarihiDate, sureIds);
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500 });
  }

  if (!muvekkilId || !davaTanimi) {
    return new Response(JSON.stringify({ success: true, data: { deadlines, inserted: 0 } }), { status: 200 });
  }

  const insertData = deadlines.map(deadline => ({
    avukat_id: user.user.id,
    muvekkel_id: muvekkilId,
    sure_turu: deadline.sureId,
    son_gun: formatDateTR(deadline.sonGun),
    aciklama: deadline.aciklama,
    tamamlandi: false
  }));

  const { data, error: insertError } = await getSupabase().from('sure_takibi').insert(insertData);

  if (insertError) {
    return new Response(JSON.stringify({ success: false, error: insertError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, data: { deadlines, inserted: insertData.length } }), { status: 200 });
}