/**
 * NOTYA-TEK-BEYIN — mevcut ElevenLabs ajanı → Custom LLM'li kopya (thin mouth).
 * scripts/tek-beyin-ajanlari.mts yazar (elle düzenleme). Mevcut ajanlara dokunulmaz.
 * NOTYA-TEK-BEYIN-CORE-01: copies are served to every doctor + klinik by default
 * (app/api/asistan/signed-url + klinik-signed-url); kill switch NOTYA_TEK_BEYIN_DOKTORLAR=off.
 */
export const TEK_BEYIN_AJANLARI: Record<string, string> = {
  "agent_3601ktc884ntf3dbdkjtyx6vdfwa": "agent_6701m3cyqgc3fvxszstap39atqhm",
  "agent_6501ktc87nmyeca88wskfvr8dfxh": "agent_9701m3cyqrynfd1a1npxjc0ea8dt",
  "agent_1301kwjdee1afajrqkdxmghna6sx": "agent_8401m3cyqx6vfgpt4zbxacrkwcb8"
}
