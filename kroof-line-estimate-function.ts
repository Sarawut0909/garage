// Supabase Edge Function: kroof-line-estimate
// Deploy with JWT verification disabled; the function validates origin, payload, honeypot and throttles duplicate phone submissions.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN') ?? '';
const LINE_TARGET_ID = Deno.env.get('LINE_TARGET_ID') ?? '';
const ALLOWED_ORIGINS = new Set([
  'https://sarawut0909.github.io',
  'https://หลังคาเครูฟ.com',
  'https://www.หลังคาเครูฟ.com',
]);
const corsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://sarawut0909.github.io',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
});
const json = (body: unknown, status = 200, origin: string | null = null) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json; charset=utf-8' } });
const clean = (v: unknown, max = 500): string => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
const escapeLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim();

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response('ok', { status: 200, headers: corsHeaders(origin) });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, origin);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: 'Origin not allowed' }, 403, origin);
  const lengthHeader = Number(req.headers.get('content-length') || '0');
  if (lengthHeader > 20_000) return json({ error: 'ข้อมูลมีขนาดใหญ่เกินไป' }, 413, origin);
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !LINE_CHANNEL_ACCESS_TOKEN || !LINE_TARGET_ID) {
    return json({ error: 'ระบบแจ้งเตือนยังตั้งค่าไม่ครบ กรุณาติดต่อผู้ดูแลเว็บไซต์' }, 503, origin);
  }
  let raw: Record<string, unknown>;
  try { raw = await req.json(); } catch { return json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, 400, origin); }
  // Honeypot: bots may fill this hidden field; pretend success but do not process it.
  if (clean(raw.website, 200)) return json({ ok: true, lineSent: true }, 200, origin);
  const name = clean(raw.name, 100);
  const phone = clean(raw.phone, 30);
  const location = clean(raw.location, 200);
  const extra = clean(raw.extra, 1500);
  const carCount = clean(raw.carCount, 50);
  const roofStyle = clean(raw.roofStyle, 80);
  const roofMaterial = clean(raw.roofMaterial, 80);
  const width = Number(raw.width);
  const depth = Number(raw.length);
  if (!name || !Number.isFinite(width) || !Number.isFinite(depth) || width < 1 || depth < 1 || width > 100 || depth > 100) {
    return json({ error: 'กรุณาตรวจสอบชื่อและขนาดพื้นที่ (1–100 เมตร)' }, 400, origin);
  }
  if (phone && !/^[0-9+()\-\s]{8,20}$/.test(phone)) return json({ error: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง' }, 400, origin);

  const supaHeaders = { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };
  // Simple duplicate-phone throttle: one request per phone per 2 minutes.
  if (phone) {
    const since = new Date(Date.now() - 120_000).toISOString();
    const q = new URLSearchParams({ select: 'id', phone: `eq.${phone}`, created_at: `gte.${since}`, limit: '1' });
    const recent = await fetch(`${SUPABASE_URL}/rest/v1/kroof_estimate_requests?${q}`, { headers: supaHeaders });
    if (recent.ok) {
      const rows = await recent.json();
      if (Array.isArray(rows) && rows.length) return json({ error: 'รับคำขอจากเบอร์นี้แล้ว กรุณารอสักครู่ก่อนส่งซ้ำ' }, 429, origin);
    }
  }

  const record = { name, phone: phone || null, location: location || null, car_count: carCount, roof_style: roofStyle, roof_material: roofMaterial, width_m: width, length_m: depth, extra: extra || null, source: 'website', status: 'new' };
  const saved = await fetch(`${SUPABASE_URL}/rest/v1/kroof_estimate_requests`, { method: 'POST', headers: supaHeaders, body: JSON.stringify(record) });
  if (!saved.ok) {
    // Do not expose database response details to visitors.
    console.error('Failed to save estimate request; status:', saved.status);
    return json({ error: 'บันทึกคำขอไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' }, 500, origin);
  }
  const lines = [
    '🔔 มีคำขอประเมินราคาใหม่ — K-Roof', '',
    `จำนวนรถ: ${escapeLine(carCount) || '-'}`,
    `รูปแบบ: ${escapeLine(roofStyle) || '-'}`,
    `วัสดุหลังคา: ${escapeLine(roofMaterial) || '-'}`,
    `ขนาด: กว้าง ${width} ม. × ยาว ${depth} ม.`,
    `ชื่อผู้ติดต่อ: ${escapeLine(name)}`,
    `เบอร์โทรศัพท์: ${escapeLine(phone) || 'ไม่ได้ระบุ'}`,
    `พื้นที่ติดตั้ง: ${escapeLine(location) || 'ไม่ได้ระบุ'}`,
    `รายละเอียด: ${escapeLine(extra) || 'ไม่มี'}`,
    '', 'กรุณาติดต่อกลับเพื่อประเมินราคา'
  ].join('\n').slice(0, 4900);
  const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: LINE_TARGET_ID, messages: [{ type: 'text', text: lines }] }),
  });
  if (!lineResponse.ok) {
    console.error('LINE push failed; status:', lineResponse.status, 'request was saved');
    return json({ ok: true, saved: true, lineSent: false, message: 'บันทึกคำขอแล้ว แต่ส่งแจ้งเตือน LINE ไม่สำเร็จ' }, 200, origin);
  }
  return json({ ok: true, saved: true, lineSent: true }, 200, origin);
});
