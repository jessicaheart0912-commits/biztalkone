module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'OPENAI_API_KEY is not configured' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const userText = String(body.userText || '').trim();
  const lesson = body.lesson || {};
  const plan = String(body.plan || 'Free');
  if (!userText) return res.status(400).json({ error: 'userText is required' });

  const systemPrompt = [
    'You are a professional business English coach for Korean learners.',
    'Return strict JSON with keys: reply, feedback, score.',
    'reply: one natural English roleplay response.',
    'feedback: HTML-safe Korean coaching with sections <strong>강점</strong>, <strong>더 자연스럽게 다듬기</strong>, <strong>추천 교정 문장</strong>.',
    'score: integer 0-100.'
  ].join(' ');

  const userPrompt = [
    `Plan: ${plan}`,
    `Lesson: ${lesson.title || ''} / ${lesson.titleEn || ''}`,
    `Scenario: ${lesson.brief || ''}`,
    `Key expressions: ${(lesson.expressions || []).map(e => e.en).join('; ')}`,
    `Learner reply: ${userText}`
  ].join('
');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    return res.status(500).json({ error: text.slice(0, 500) });
  }

  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content || '{}';
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    parsed = {
      reply: 'Thanks for sharing that. Could you clarify your main priority for this meeting?',
      feedback: '<strong>강점</strong><br>• 답변 의도는 분명합니다.<br><br><strong>더 자연스럽게 다듬기</strong><br>• 핵심 표현을 한 개 더 넣어보세요.<br><br><strong>추천 교정 문장</strong><br>I would like to align on the main priority and confirm the next step together.',
      score: 82
    };
  }
  return res.status(200).json({
    reply: parsed.reply || 'Thanks for sharing that. Could you tell me a bit more?',
    feedback: parsed.feedback || '<strong>강점</strong><br>• 방향은 좋습니다.<br><br><strong>더 자연스럽게 다듬기</strong><br>• 목적과 이유를 함께 말해보세요.<br><br><strong>추천 교정 문장</strong><br>I would like to confirm the priority and suggest the next step clearly.',
    score: Number(parsed.score || 82)
  });
};
