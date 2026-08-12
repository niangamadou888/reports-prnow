// Retention sweep for reports.prnow.io. Hosted report files live as file_data
// LONGBLOBs in the `pdf_records` table (NOT on disk), so unbounded uploads grow
// the MySQL database. This deletes rows older than N days (default 90).
//
// SAFE BY DEFAULT:
//   • Dry-run unless --apply is passed (prints what WOULD be deleted).
//   • Every --apply first streams the doomed rows — INCLUDING file_data — to a
//     gzipped NDJSON backup, so any deletion is recoverable.
//   • --max guards against a misconfigured window wiping the table.
//   • Deletes in batches so a large purge never locks the table.
//   • KEEP_SLUGS are permanent marketing assets (pricing-page sample reports)
//     and are NEVER deleted regardless of age.
//
// A deleted slug degrades gracefully: /{slug} → notFound(), /api/pdfs/{slug} →
// 404 (verified). Excel reports are regenerable from prnow's dynamic route.
//
// Usage (on the VPS, from /root/reports-prnow):
//   node scripts/cleanup-old-reports.js                # dry-run, 90 days
//   node scripts/cleanup-old-reports.js --days=120     # dry-run, custom window
//   node scripts/cleanup-old-reports.js --apply        # backup + delete
// Backups + audit land in REPORTS_CLEANUP_DIR (default /root).

const mysql = require('mysql2/promise')
const mysqlRaw = require('mysql2')
const fs = require('fs')
const zlib = require('zlib')
const path = require('path')
require('dotenv').config()

const args = process.argv.slice(2)
const has = (f) => args.includes(f)
const val = (name, dflt) => {
  const a = args.find((x) => x.startsWith(`--${name}=`))
  return a ? a.split('=')[1] : dflt
}

const APPLY = has('--apply')
const DAYS = Math.max(1, parseInt(val('days', process.env.REPORTS_RETENTION_DAYS || '90'), 10) || 90)
const MAX = Math.max(1, parseInt(val('max', '5000'), 10) || 5000)
const BATCH = 200
const BACKUP_DIR = process.env.REPORTS_CLEANUP_DIR || '/root'
const BACKUP_TTL_DAYS = 30 // prune our own old backup/audit files past this

// Permanent marketing assets: the prnow pricing page links these slugs as
// sample reports (lib/plan-info.ts + pricing_config metadata + PlanCard).
// They must survive every sweep — the 2026-07-23 run deleted 7 of them and
// broke every "Sample Report" link on the pricing page (restored from the
// run's backup). Extend via env REPORTS_KEEP_SLUGS=comma,separated,slugs.
// Additionally, ANY slug starting with "sample-" is permanent: prnow's admin
// generates replacement sample reports under that prefix (KEEP_PREFIX below).
const KEEP_SLUGS = [
  'basic-report', 'basic-report-excel',
  'standard-report', 'standard-report-excel',
  'advanced-report', 'advanced-report-excel',
  'newsfile-report', 'podcast-report', 'standard-extra-report',
  ...(process.env.REPORTS_KEEP_SLUGS || '').split(',').map((s) => s.trim()).filter(Boolean),
]

const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
}
const KEEP_PREFIX = 'sample-'
// prnow now names a sample `{plan}-sample-report` so the workbook slug MIRRORS
// the web report's (…/web/{plan}-sample-report). That name does not start with
// "sample-", so without this suffix rule the sweep would delete every current
// pricing-page sample the moment it turned 90 days old — the exact 2026-07-25
// outage, reintroduced.
const KEEP_SUFFIX = '-sample-report'
const WHERE =
  'uploaded_at < (NOW() - INTERVAL ? DAY) AND slug NOT IN (?) AND slug NOT LIKE ? AND slug NOT LIKE ?'
const WHERE_PARAMS = [DAYS, KEEP_SLUGS, `${KEEP_PREFIX}%`, `%${KEEP_SUFFIX}`]
const mb = (bytes) => (Number(bytes || 0) / 1048576).toFixed(1)
const stamp = () => new Date().toISOString().replace(/[:.]/g, '-')
const log = (m) => console.log(`[cleanup] ${m}`)

/** Stream the doomed rows (incl. file_data) to a gzipped NDJSON backup. */
function backupDoomed(backupPath) {
  return new Promise((resolve, reject) => {
    const gz = zlib.createGzip()
    const out = fs.createWriteStream(backupPath)
    gz.pipe(out)
    const conn = mysqlRaw.createConnection(dbConfig)
    const stream = conn
      .query(`SELECT slug, original_name, uploaded_at, file_size, file_path, file_type, file_data FROM pdf_records WHERE ${WHERE}`, WHERE_PARAMS)
      .stream()
    let count = 0
    stream.on('data', (row) => {
      const rec = { ...row, file_data: row.file_data ? Buffer.from(row.file_data).toString('base64') : null }
      // Respect backpressure so a 260 MB export never balloons memory.
      if (!gz.write(JSON.stringify(rec) + '\n')) {
        stream.pause()
        gz.once('drain', () => stream.resume())
      }
      count++
    })
    stream.on('error', (e) => { conn.destroy(); gz.destroy(); reject(e) })
    stream.on('end', () => { gz.end(); conn.end() })
    out.on('finish', () => resolve(count))
    out.on('error', reject)
  })
}

/** Delete our own backup/audit files older than BACKUP_TTL_DAYS. */
function pruneOldBackups() {
  const cutoff = Date.now() - BACKUP_TTL_DAYS * 86400_000
  let pruned = 0
  for (const f of fs.readdirSync(BACKUP_DIR)) {
    if (!/^reports-cleanup-(backup-)?.*\.(gz|json)$/.test(f)) continue
    const p = path.join(BACKUP_DIR, f)
    try {
      if (fs.statSync(p).mtimeMs < cutoff) { fs.unlinkSync(p); pruned++ }
    } catch { /* ignore */ }
  }
  if (pruned) log(`pruned ${pruned} backup/audit file(s) older than ${BACKUP_TTL_DAYS}d`)
}

async function main() {
  const conn = await mysql.createConnection(dbConfig)
  try {
    const [[agg]] = await conn.query(
      `SELECT COUNT(*) n, COALESCE(SUM(file_size),0) bytes, MIN(uploaded_at) oldest, MAX(uploaded_at) newest FROM pdf_records WHERE ${WHERE}`,
      WHERE_PARAMS,
    )
    log(`retention=${DAYS}d  keep=${KEEP_SLUGS.length} pinned slug(s)  candidates=${agg.n}  ~${mb(agg.bytes)}MB  range=${agg.oldest || '—'} .. ${agg.newest || '—'}`)

    if (agg.n === 0) { log('nothing to delete.'); return }

    if (!APPLY) {
      const [sample] = await conn.query(
        `SELECT slug, uploaded_at, file_type FROM pdf_records WHERE ${WHERE} ORDER BY uploaded_at LIMIT 15`, WHERE_PARAMS)
      log('DRY-RUN — no deletions. Oldest sample:')
      for (const r of sample) console.log(`   ${new Date(r.uploaded_at).toISOString()}  ${r.file_type.padEnd(5)}  ${r.slug}`)
      log(`re-run with --apply to back up and delete these ${agg.n} row(s).`)
      return
    }

    if (agg.n > MAX) {
      console.error(`[cleanup] REFUSING: ${agg.n} candidates exceed --max ${MAX}. Widen --max deliberately to proceed.`)
      process.exitCode = 2
      return
    }

    const ts = stamp()
    const backupPath = path.join(BACKUP_DIR, `reports-cleanup-backup-${ts}.ndjson.gz`)
    const auditPath = path.join(BACKUP_DIR, `reports-cleanup-${ts}.json`)

    log(`backing up ${agg.n} row(s) → ${backupPath}`)
    const backedUp = await backupDoomed(backupPath)
    const size = fs.statSync(backupPath).size
    if (!backedUp || size < 20) throw new Error('backup looks empty — aborting before any delete')
    log(`backup ok: ${backedUp} row(s), ${mb(size)}MB`)

    let deleted = 0
    for (;;) {
      const [res] = await conn.query(`DELETE FROM pdf_records WHERE ${WHERE} LIMIT ${BATCH}`, WHERE_PARAMS)
      deleted += res.affectedRows
      if (res.affectedRows < BATCH) break
    }

    fs.writeFileSync(auditPath, JSON.stringify({
      ranAt: new Date().toISOString(), retentionDays: DAYS,
      candidates: agg.n, deleted, backup: backupPath,
      keepSlugs: KEEP_SLUGS,
      range: { oldest: agg.oldest, newest: agg.newest }, approxBytes: Number(agg.bytes),
    }, null, 2))
    log(`DELETED ${deleted} row(s). backup=${backupPath} audit=${auditPath}`)
    pruneOldBackups()
  } finally {
    await conn.end()
  }
}

main().catch((e) => { console.error('[cleanup] FAILED:', e.message); process.exit(1) })
