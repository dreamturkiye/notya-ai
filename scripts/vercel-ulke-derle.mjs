#!/usr/bin/env node
/**
 * Build command for a release branch on Vercel.
 *
 * Country projects set NOTYA_COUNTRY. They must run `npm run build:ulke`: the country's own
 * build file refuses a bare `next build`, because that would skip the proof that the output
 * holds this pack and no other. A build with no country set — the Turkish project, including
 * a preview of this same commit — keeps `npm run build`, which is what main runs.
 */
import { spawnSync } from 'node:child_process'

const kod = process.env.NOTYA_COUNTRY || ''
const ulke = /^[a-z]{2}$/.test(kod) && kod !== 'tr'
const argv = ulke ? ['run', 'build:ulke'] : ['run', 'build']
const sonuc = spawnSync('npm', argv, { stdio: 'inherit', env: process.env })
process.exit(sonuc.status ?? 1)
