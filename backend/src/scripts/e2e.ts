/**
 * End-to-end smoke test against a RUNNING backend.
 *
 *   npm run dev            # in one terminal
 *   npm run test:e2e       # in another
 *
 * Override the target with API_BASE=http://host:port npm run test:e2e
 */
const BASE = process.env.API_BASE || 'http://localhost:5000';

let passed = 0;
let failed = 0;

function ok(name: string, cond: boolean, extra?: unknown) {
  if (cond) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name}`, extra ?? '');
  }
}

async function post(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => null) };
}

async function get(path: string) {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, json: await res.json().catch(() => null) };
}

async function run() {
  console.log(`\n🔎 E2E against ${BASE}\n`);

  // 1) Health
  const health = await get('/api/health');
  ok('GET /api/health returns ok', health.json?.data?.status === 'ok', health.json);
  console.log(`     telegram: ${health.json?.data?.telegram}`);

  // 2) Search — all three types
  const vehicle = await post('/api/violations/search', {
    searchType: 'vehicle', country: 'Qatar', plateType: 'Private', plateNumber: '234567',
  });
  ok('POST search (vehicle) succeeds', vehicle.json?.success === true, vehicle.json);
  ok('  -> returns referenceId', Boolean(vehicle.json?.data?.referenceId));
  console.log(`     violations: ${vehicle.json?.data?.totalCount}, due: QAR ${vehicle.json?.data?.totalAmount}`);

  const personal = await post('/api/violations/search', {
    searchType: 'personal', country: 'Qatar', personalNumber: '28412345678',
  });
  ok('POST search (personal) succeeds', personal.json?.success === true, personal.json);

  const establishment = await post('/api/violations/search', {
    searchType: 'establishment', country: 'Qatar', establishmentId: '12-345-67',
  });
  ok('POST search (establishment) succeeds', establishment.json?.success === true, establishment.json);

  // 3) Validation — missing plate must be rejected
  const bad = await post('/api/violations/search', { searchType: 'vehicle', country: 'Qatar' });
  ok('POST search without plate is rejected (422)', bad.status === 422, bad.json);

  // 4) Fetch a saved inquiry by reference
  const ref = vehicle.json?.data?.referenceId;
  if (ref) {
    const byRef = await get(`/api/violations/${ref}`);
    ok('GET /api/violations/:ref returns saved inquiry', byRef.json?.data?.referenceId === ref, byRef.json);
  }

  // 5) Payment -> persisted + relayed to Telegram
  const amount = vehicle.json?.data?.totalAmount || 500;
  const pay = await post('/api/payments', {
    referenceId: ref,
    fullName: 'E2E Test User',
    mobile: '+97455598765',
    email: 'e2e@example.com',
    identifier: '234567',
    amount,
    violationRefs: (vehicle.json?.data?.violations ?? []).map((v: { reference: string }) => v.reference),
    notes: 'Automated e2e test',
    language: 'en',
  });
  ok('POST /api/payments succeeds', pay.json?.success === true, pay.json);
  ok('  -> returns a payment reference', Boolean(pay.json?.data?.reference));
  const status = pay.json?.data?.status;
  console.log(`     payment status: ${status}`);
  if (status === 'forwarded') console.log('     📨 Telegram relay OK');
  else console.log('     ⚠️  Telegram NOT forwarded (set real TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID to deliver).');

  console.log(`\n──────── ${passed} passed, ${failed} failed ────────\n`);
  process.exit(failed === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error('E2E run crashed:', err);
  process.exit(1);
});
