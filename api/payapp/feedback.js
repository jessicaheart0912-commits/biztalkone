const { createClient } = require('@supabase/supabase-js');

function normalizeBody(req) {
  if (req.method === 'GET') return req.query || {};
  if (typeof req.body === 'object' && req.body) return req.body;
  const raw = String(req.body || '');
  const params = new URLSearchParams(raw);
  const body = {};
  for (const [key, value] of params.entries()) body[key] = value;
  return body;
}

module.exports = async (req, res) => {
  const body = normalizeBody(req);
  const email = String(body.var1 || body.recvemail || '').trim().toLowerCase();
  const plan = String(body.var2 || '수강생 전용').trim();
  const payState = Number(body.pay_state || 0);
  const amount = Number(body.price || 0);
  const mulNo = String(body.mul_no || body.trade_no || '').trim();
  const status = payState === 4 ? 'active' : payState === 10 ? 'pending' : (payState === 8 || payState === 32 || payState === 9 || payState === 64 ? 'cancelled' : 'requested');

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    await supabase.from('payment_logs').insert({
      email: email || null,
      plan: plan || null,
      amount: amount || null,
      status,
      payapp_mul_no: mulNo || null,
      payapp_pay_state: Number.isFinite(payState) ? payState : null,
      raw_payload: body
    });

    if (email && payState === 4) {
      await supabase.from('subscriptions').insert({
        email,
        plan,
        status: 'active',
        amount,
        cycle: 'one_time',
        payapp_mul_no: mulNo || null,
        payapp_pay_state: payState,
        started_at: body.pay_date || new Date().toISOString(),
        expires_at: null,
        updated_at: new Date().toISOString()
      });
    }
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('SUCCESS');
};
