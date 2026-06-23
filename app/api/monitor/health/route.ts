// /Users/kaan/notya-ai/app/api/monitor/health/route.ts

import { NextRequest, NextResponse } from "next/server"

const TELEGRAM_BOT = "8920614347"
const TELEGRAM_CHAT = "5545242725"
const BASE_URL = "https://notya-ai.vercel.app"

async function sendTelegram(msg: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text: msg, parse_mode: "HTML" })
  })
}

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("Authorization")
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const routes = [
      { name: "/api/asistan/chat", url: BASE_URL + "/api/asistan/chat" },
      { name: "/api/asistan/mali-chat", url: BASE_URL + "/api/asistan/mali-chat" },
      { name: "/api/asistan/avukat-chat", url: BASE_URL + "/api/asistan/avukat-chat" }
    ]

    const results = await Promise.all(
      routes.map(async (route) => {
        const response = await fetch(route.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "ping", sessionId: "healthcheck" })
        })

        if (response.status >= 500) {
          await sendTelegram(`Alert: ${route.name} returned status ${response.status}`)
        }

        return { name: route.name, status: response.status }
      })
    )

    const summary = `Notya AI Health Check\n${results.map(r => `${r.name}: ${r.status}`).join("\n")}`
    await sendTelegram(summary)

    return NextResponse.json({ ok: true, results }, { status: 200 })
  } catch (error) {
    console.error("Health check failed:", error)
    await sendTelegram(`Error in health check: ${error.message}`)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}