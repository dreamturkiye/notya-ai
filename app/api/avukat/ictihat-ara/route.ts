import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { searchIctihat, buildIctihatSearchPrompt } from '@/lib/avukat/ictihatEngine';

const getSB = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// API route for searching Ictihat decisions
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, message: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await getSB().auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ success: false, message: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { query, branch } = body;

    if (!query) {
      return NextResponse.json({ success: false, message: 'Query is required' }, { status: 400 });
    }

    const results = searchIctihat(query, branch);
    const prompt = buildIctihatSearchPrompt(query, results);
    void prompt;
    const synthesizedResponse = {
      ozet: 'This is a synthetic summary of the search results.',
      bulunan_kararlar: results,
      strateji_onerisi: 'A strategic recommendation based on the search results.',
      uyarilar: ['Warning 1', 'Warning 2'],
    };

    return NextResponse.json({ success: true, data: synthesizedResponse });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
