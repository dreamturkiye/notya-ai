// /Users/kaan/notya-ai/app/api/monitor/alert/route.ts

import { NextRequest, NextResponse } from "next/server"

const TELEGRAM_BOT = "8920614347"
const TELEGRAM_CHAT = "5545242725"

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text: message, parse_mode: "HTML" })
    })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error("Alert failed:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}