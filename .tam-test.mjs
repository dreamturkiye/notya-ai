// Temporary: the `npm test` file list minus the two files the ledger records as hanging (fishMikrofon, fishWs).
// Not committed.
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const komut = JSON.parse(readFileSync('package.json', 'utf8')).scripts.test
const parcalar = komut.split(' ')
const bas = parcalar.indexOf('--test')
const dosyalar = parcalar.slice(bas + 1).filter((d) => !/fishMikrofon\.test|fishWs\.test/.test(d))
const r = spawnSync('npx', ['--yes', 'tsx', '--experimental-test-module-mocks', '--test', ...dosyalar], { shell: true, encoding: 'utf8', maxBuffer: 1 << 28 })
const cikti = `${r.stdout}\n${r.stderr}`
const satirlar = cikti.split('\n')
console.log(satirlar.filter((s) => /^ℹ (tests|suites|pass|fail|cancelled|skipped)/.test(s)).join('\n'))
const hata = satirlar.findIndex((s) => s.includes('failing tests'))
if (hata >= 0) console.log(satirlar.slice(hata, hata + 120).join('\n'))
console.log('exit', r.status)
