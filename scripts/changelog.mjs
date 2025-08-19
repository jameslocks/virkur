#!/usr/bin/env node
// Simple changelog generator using Conventional Commits subjects since last tag.
// Usage:
//   node scripts/changelog.mjs --level patch|minor|major
//   node scripts/changelog.mjs --version 1.2.3

import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

function run(cmd) {
  try { return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() } catch { return '' }
}

function getPkg() {
  const text = readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')
  return JSON.parse(text)
}

function nextFrom(version, level) {
  const [maj, min, pat, ...rest] = version.split('-')[0].split('.').map(n => Number(n))
  if (level === 'major') return `${maj + 1}.0.0`
  if (level === 'minor') return `${maj}.${min + 1}.0`
  return `${maj}.${min}.${(pat || 0) + 1}`
}

function parseArgs(argv) {
  const out = { version: '', level: '' }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--version') out.version = argv[++i]
    else if (a === '--level') out.level = argv[++i]
  }
  return out
}

function today() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
}

function lastTag() {
  const t = run('git describe --tags --abbrev=0')
  return t || null
}

function getCommits(sinceTag) {
  const range = sinceTag ? `${sinceTag}..HEAD` : 'HEAD'
  const raw = run(`git log ${range} --pretty=format:%s`)
  if (!raw) return []
  return raw.split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('Merge '))
}

function classify(subject) {
  const m = subject.match(/^(\w+)(\([^)]*\))?(!)?:\s*(.+)$/)
  if (!m) return { type: 'other', text: subject }
  const type = m[1]
  const bang = !!m[3]
  const text = m[4]
  const map = { feat: 'feat', fix: 'fix', perf: 'perf', refactor: 'refactor', docs: 'docs', test: 'test', build: 'build', ci: 'ci', chore: 'chore' }
  const t = map[type] || 'other'
  return { type: t, text: bang ? `${text} (BREAKING)` : text }
}

function group(commits) {
  const order = ['feat','fix','perf','refactor','docs','test','build','ci','chore','other']
  const out = Object.fromEntries(order.map(k => [k, []]))
  for (const s of commits) {
    // ignore release housekeeping commits
    if (/^chore\(release\)/.test(s) || /^docs\(changelog\)/.test(s)) continue
    const { type, text } = classify(s)
    out[type].push(text)
  }
  return { order, groups: out }
}

function render(version, date, grouped) {
  let md = `## v${version} - ${date}\n\n`
  const titles = {
    feat: 'Features', fix: 'Fixes', perf: 'Performance', refactor: 'Refactoring', docs: 'Docs', test: 'Tests', build: 'Build', ci: 'CI', chore: 'Chores', other: 'Other'
  }
  for (const key of grouped.order) {
    const items = grouped.groups[key]
    if (!items.length) continue
    md += `### ${titles[key]}\n`
    for (const it of items) md += `- ${it}\n`
    md += `\n`
  }
  return md
}

function prependChangelog(section) {
  const path = resolve(process.cwd(), 'CHANGELOG.md')
  const exists = existsSync(path)
  const current = exists ? readFileSync(path, 'utf8') : '# Changelog\n\n'
  if (current.includes(section.split('\n')[0])) {
    console.log('Changelog already contains this version section. Skipping.')
    return
  }
  const next = current + section
  writeFileSync(path, next, 'utf8')
}

function main() {
  const { version: vArg, level } = parseArgs(process.argv)
  const pkg = getPkg()
  const intendedVersion = vArg || (level ? nextFrom(pkg.version, level) : pkg.version)
  const prev = lastTag()
  const commits = getCommits(prev)
  if (commits.length === 0) {
    console.log('No commits to include since last tag.')
    return
  }
  const grouped = group(commits)
  const section = render(intendedVersion, today(), grouped)
  prependChangelog(section)
  console.log(`Generated changelog for v${intendedVersion}.`)
}

main()

