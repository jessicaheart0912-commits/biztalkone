const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return res.status(200).json({ ok: false, mode: 'demo' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const email = String(body.email || '').trim().toLowerCase();
  const name = String(body.name || '').trim();
  const role = String(body.role || '').trim();
  if (!email || !name) return res.status(400).json({ error: 'Missing name or email' });

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { error } = await supabase.from('user_profiles').upsert({ email, name, role, updated_at: new Date().toISOString() }, { onConflict: 'email' });
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
};
