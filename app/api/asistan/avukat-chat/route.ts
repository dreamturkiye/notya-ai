import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Anthropic from "@anthropic-ai/sdk"
import { AVUKAT_PERSONAS, getPersonaForBranch, buildAvukatSystemPrompt, type AvukatPersonaId, type BranchId } from "@/lib/avukat/avukatPersonaEngine"
import { quickClassifyLegal } from "@/lib/avukat/avukatIntentParser"
import { toAddressableUser } from "@/lib/userProfile"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message, avukatSessionId, muvekkilId, sessionId, branch, personaId } = await req.json();

    const { data: userRow } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle();
    if (!userRow) return NextResponse.json({ error: "User not found" }, { status: 401 });

    const { data: prefs } = await supabase.from("avukat_preferences").select("*").eq("avukat_id", user.id).maybeSingle();

    let session;
    if (avukatSessionId) {
      const { data: sessionData } = await supabase.from("avukat_sessions").select("*").eq("id", avukatSessionId).eq("avukat_id", user.id).single();
      session = sessionData;
    } else {
      const { data: newSessionData, error } = await supabase.from("avukat_sessions").insert({
        avukat_id: user.id,
        muvekkel_id: muvekkilId || null,
        persona_id: personaId || null,
        messages: [],
        active_context: {}
      }).select().single();
      if (error) throw error;
      session = newSessionData;
    }

    let muvekkel = null;
    if (muvekkilId) {
      const { data: muvekkelData } = await supabase.from("musevvekiller").select("*").eq("id", muvekkilId).single();
      muvekkel = muvekkelData;
    }

    const personaId2 = getPersonaForBranch((branch || "ceza") as BranchId);
    const persona = AVUKAT_PERSONAS[personaId2];

    const systemPrompt = buildAvukatSystemPrompt(persona, prefs, muvekkel || null, toAddressableUser(userRow));

    const aiResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: systemPrompt,
      messages: (session.messages as { role: string, content: string }[]).slice(-20).concat([{ role: "user", content: message }])
    });

    const rawText = aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "{}";
    const { speech, action, proactiveWarning } = JSON.parse(rawText);

    if (action?.type === "CREATE_MUVEKKEL") await supabase.from("musevvekiller").insert({ avukat_id: user.id, ...action.payload });
    if (action?.type === "ADD_DELIL") await supabase.from("deliller").insert({ muvekkel_id: muvekkilId, ...action.payload });
    if (action?.type === "ADD_SURE") await supabase.from("sure_takibi").insert({ avukat_id: user.id, muvekkel_id: muvekkilId, ...action.payload });

    await supabase.from("avukat_sessions").update({ messages: [...session.messages, { role: "user", content: message }, { role: "assistant", content: speech }] }).eq("id", session.id);

    return NextResponse.json({ success: true, data: { speech, proactiveWarning, action, avukatSessionId: session.id } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}