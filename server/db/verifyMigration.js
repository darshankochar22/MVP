#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Schema parity guard.
//
//   npm run db:check-parity
//
// Builds two fresh in-memory SQLite schemas and asserts they are identical:
//   A) what the app's init() DDL creates  (the schema the test oracle trusts)
//   B) what applying the generated Drizzle migrations creates
//
// Exits 0 when faithful, 1 (with a diff) when they drift. Run in CI so the
// Drizzle migration can never silently fall behind init() again — that drift
// is what previously left the migration missing 27 tables + dozens of columns.
//
// Allowed difference: `app_meta` — an internal key/value table created at
// runtime by stampSchemaVersion(), intentionally not Drizzle-tracked.
// ---------------------------------------------------------------------------
process.env.NODE_ENV = 'test';
const path = require('path');
const { createClient } = require('@libsql/client');
const { drizzle } = require('drizzle-orm/libsql');
const { migrate } = require('drizzle-orm/libsql/migrator');

const ALLOWED_INIT_ONLY_TABLES = new Set(['app_meta']);

async function snapshot(client) {
  const tnames = (await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__drizzle%' ORDER BY name"
  )).rows.map((r) => r.name);
  const snap = {};
  for (const t of tnames) {
    snap[t] = (await client.execute(`PRAGMA table_info('${t}')`)).rows
      // INTEGER PRIMARY KEY reports notnull=0 under init() but notnull=1 from the
      // migration — semantically identical in SQLite, so ignore notnull on PKs.
      .map((c) => `${c.name}|${(c.type || '').toUpperCase()}|nn=${c.pk ? '*' : c.notnull}|dflt=${c.dflt_value}|pk=${c.pk}`)
      .sort();
  }
  return snap;
}

(async () => {
  const { rawDb, initDB } = require(path.join(__dirname, 'index'));
  await initDB();
  const A = await snapshot(rawDb);

  const clientB = createClient({ url: 'file::memory:' });
  await clientB.execute('PRAGMA foreign_keys = ON;');
  await migrate(drizzle(clientB), { migrationsFolder: path.join(__dirname, 'migrations', 'sqlite') });
  const B = await snapshot(clientB);

  const problems = [];
  for (const t of Object.keys(A)) {
    if (!B[t]) {
      if (!ALLOWED_INIT_ONLY_TABLES.has(t)) problems.push(`missing table in migration: ${t}`);
      continue;
    }
    const sb = new Set(B[t]); const sa = new Set(A[t]);
    A[t].filter((c) => !sb.has(c)).forEach((c) => problems.push(`${t}: init-only column ${c}`));
    B[t].filter((c) => !sa.has(c)).forEach((c) => problems.push(`${t}: migration-only column ${c}`));
  }
  for (const t of Object.keys(B)) if (!A[t]) problems.push(`extra table in migration: ${t}`);

  if (typeof clientB.close === 'function') clientB.close();

  if (problems.length) {
    console.error(`✖ schema parity FAILED — init() and the Drizzle migration have drifted:\n  ${problems.join('\n  ')}`);
    console.error(`\nFix: update server/db/schema/sqlite, then \`npm run db:generate:sqlite\`.`);
    process.exit(1);
  }
  console.log(`✓ schema parity OK — Drizzle migration matches init() exactly (${Object.keys(B).length} tables; app_meta runtime-only).`);
  process.exit(0);
})().catch((e) => { console.error('check-parity error:', e); process.exit(1); });
