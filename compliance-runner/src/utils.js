/**
 * Argument parsing and validation utilities
 */

function parseArgs(argv) {
  const out = { reviewedDate: null, mode: null, outFile: null, dryRun: false, runId: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dryRun') out.dryRun = true;
    else if (a.startsWith('--reviewedDate=')) out.reviewedDate = a.split('=')[1];
    else if (a === '--reviewedDate') out.reviewedDate = argv[++i];
    else if (a.startsWith('--mode=')) out.mode = a.split('=')[1];
    else if (a === '--mode') out.mode = argv[++i];
    else if (a.startsWith('--out=')) out.outFile = a.split('=')[1];
    else if (a === '--out') out.outFile = argv[++i];
    else if (a.startsWith('--runId=')) out.runId = Number(a.split('=')[1]);
    else if (a === '--runId') out.runId = Number(argv[++i]);
  }
  return out;
}

function assertIsoDate(d) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    throw new Error(`startDate must be YYYY-MM-DD (got: ${d})`);
  }
}

function normalizeMode(m) {
  const v = String(m || '').trim();
  if (!v) throw new Error('mode is required (2To1 or 3To1)');
  const normalized = v.toLowerCase();
  if (normalized === '2to1' || normalized === '2to1'.toLowerCase()) return '2To1';
  if (normalized === '3to1' || normalized === '3to1'.toLowerCase()) return '3To1';
  if (normalized === '2') return '2To1';
  if (normalized === '3') return '3To1';
  throw new Error(`mode must be 2To1 or 3To1 (got: ${m})`);
}

function dbConfigFromEnv() {
  const server = process.env.CMP_DB_SERVER;
  const database = process.env.CMP_DB_DATABASE;
  const user = process.env.CMP_DB_USER;
  const password = process.env.CMP_DB_PASSWORD;
  if (!server || !database || !user || !password) {
    throw new Error(
      'Missing DB env vars. Required: CMP_DB_SERVER, CMP_DB_DATABASE, CMP_DB_USER, CMP_DB_PASSWORD'
    );
  }
  const port = process.env.CMP_DB_PORT ? Number(process.env.CMP_DB_PORT) : undefined;
  const encrypt = String(process.env.CMP_DB_ENCRYPT || 'true').toLowerCase() === 'true';
  const trustServerCertificate =
    String(process.env.CMP_DB_TRUST_CERT || 'false').toLowerCase() === 'true';

  return {
    server,
    database,
    user,
    password,
    port,
    options: {
      encrypt,
      trustServerCertificate,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30_000,
    },
  };
}

module.exports = {
  parseArgs,
  assertIsoDate,
  normalizeMode,
  dbConfigFromEnv
};