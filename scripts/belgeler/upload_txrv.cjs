// NOTYA-BELGE-02 — upload the exported ONNX to Supabase Storage (public bucket 'motorlar', immutable sha-named file)
// and write core/belgeler/motorlar/txrv.meta.json + activate the registry row.
const fs = require('fs'), path = require('path')
const { createClient } = require('@supabase/supabase-js')
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split('\n').map((l) => l.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].replace(/^["']|["']$/g, '')]))
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const meta = JSON.parse(fs.readFileSync('/tmp/txrv-out/txrv.meta.json', 'utf8'))
;(async () => {
  const { data: buckets } = await sb.storage.listBuckets()
  if (!buckets.some((b) => b.name === 'motorlar')) { const { error } = await sb.storage.createBucket("motorlar", { public: true }); if (error) throw error; console.log('bucket created') }
  const bytes = fs.readFileSync(path.join('/tmp/txrv-out', meta.dosya))
  const { error } = await sb.storage.from('motorlar').upload(meta.dosya, bytes, { contentType: 'application/octet-stream', cacheControl: '31536000', upsert: true })
  if (error) throw error
  const modelUrl = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/motorlar/${meta.dosya}`
  const head = await fetch(modelUrl, { method: 'HEAD' }); console.log('public HEAD', head.status, head.headers.get('content-length'))
  fs.writeFileSync('core/belgeler/motorlar/txrv.meta.json', JSON.stringify({ motor: meta.motor, surum: meta.surum, modelUrl, sha256: meta.sha256, bytes: meta.bytes, pathologies: meta.pathologies, license: meta.license }, null, 2) + '\n')
  const { error: e2 } = await sb.from('motor_kayit').update({ surum: meta.surum, weights_sha256: meta.sha256, model_url: modelUrl, ticari_kullanim: true, aktif: true, dogrulama_seti: 'torchxrayvision published (Cohen et al. 2022) — kendi golden set bekliyor', dogrulama_auroc: { kaynak: 'yayinlanmis', not: 'per-code own eval pending', parity_onnx_vs_torch: meta.parity_maxdiff }, guncellendi: new Date().toISOString() }).eq('motor', 'txrv-densenet121')
  if (e2) throw e2
  console.log('registry active; url', modelUrl)
})().catch((e) => { console.error('ERR', e.message || e); process.exit(1) })
