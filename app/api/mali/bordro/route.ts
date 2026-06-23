export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { brutMaas, engellilikDerecesi, cocukSayisi, evliMi, kidemYili, musteriId } = body

    if (typeof brutMaas !== 'number' || brutMaas <= 0) {
      return NextResponse.json({ success: false, error: 'Geçersiz brutMaas' }, { status: 400 })
    }

    const input = {
      brutMaas,
      engellilikDerecesi: engellilikDerecesi ?? null,
      cocukSayisi: cocukSayisi ?? 0,
      evliMi: evliMi ?? false,
      kidemYili: kidemYili ?? 0,
    }

    const result = hesaplaBordro(input)
    const ozet = formatBordroText(result)

    if (musteriId) {
      await supabase.from('mali_actions').insert({
        mali_session_id: null,
        action_type: 'BORDRO_HESAP',
        input_text: JSON.stringify(input),
        ai_response: ozet,
        action_data: result,
      })
    }

    return NextResponse.json({ success: true, data: result, ozet })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Sunucu hatası' }, { status: 500 })
  }
}