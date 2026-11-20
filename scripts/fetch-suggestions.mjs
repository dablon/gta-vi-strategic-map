// Convierte los issues abiertos con label "pin-suggestion" en public/suggestions.json.
// Sin backend: GitHub issues es la bandeja de moderación; el bot solo lee.
// Corre en discover.yml. Sin token funciona (repo público, rate limit 60/h).
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { nearestRegion } from '../src/data/resolve.mjs'
import { SuggestionSchema } from '../src/data/pinSchema.mjs'
import { parseIssueBody } from './lib/issue-body.mjs'

const REPO = process.env.GITHUB_REPOSITORY || 'dablon/gta-vi-strategic-map'
const OUT = new URL('../public/suggestions.json', import.meta.url)

const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'leonida-atlas-bot' }
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

const res = await fetch(
  `https://api.github.com/repos/${REPO}/issues?labels=pin-suggestion&state=open&per_page=100`,
  { headers },
)
if (!res.ok) {
  console.error(`suggestions: GitHub respondió ${res.status}; conservo el archivo previo.`)
  process.exit(0)
}
const issues = await res.json()

const suggestions = []
for (const issue of issues) {
  const parsed = parseIssueBody(issue.body)
  if (!parsed) {
    console.warn(`suggestions: issue #${issue.number} sin bloque parseable; se omite.`)
    continue
  }
  const candidate = SuggestionSchema.safeParse({
    issue: issue.number,
    url: issue.html_url,
    name: parsed.name,
    category: parsed.category,
    region: parsed.region ?? nearestRegion(parsed.wx, parsed.wy),
    area: parsed.area,
    notes: parsed.notes,
    wx: Math.round(parsed.wx),
    wy: Math.round(parsed.wy),
  })
  if (!candidate.success) {
    console.warn(`suggestions: issue #${issue.number} inválido: ${candidate.error.issues[0]?.message}`)
    continue
  }
  suggestions.push(candidate.data)
}

suggestions.sort((a, b) => a.issue - b.issue)
const next = { suggestions }
const previous = existsSync(OUT) ? readFileSync(OUT, 'utf8') : null
const serialized = `${JSON.stringify(next, null, 2)}\n`
if (serialized !== previous) {
  writeFileSync(OUT, serialized)
  console.log(`suggestions: ${suggestions.length} propuestas abiertas → suggestions.json`)
} else {
  console.log(`suggestions: ${suggestions.length} propuestas abiertas (sin cambios)`)
}
