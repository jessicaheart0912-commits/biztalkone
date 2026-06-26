const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const base = '/home/user/business_english_brand_ai_app';
const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
const dataJs = fs.readFileSync(path.join(base, 'data.js'), 'utf8');
const appJs = fs.readFileSync(path.join(base, 'app.js'), 'utf8');

const mergedHtml = html
  .replace(/<link rel="manifest"[^>]*>\s*/g, '')
  .replace(/<link rel="stylesheet"[^>]*>\s*/g, '')
  .replace(/<script src="data.js"><\/script>\s*<script src="app.js"><\/script>/, `<script>${dataJs}\n${appJs}</script>`);

const checks = [];
const wait = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const dom = new JSDOM(mergedHtml, {
    url: 'https://example.test/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    beforeParse(window) {
      window.__alerts = [];
      window.alert = msg => window.__alerts.push(msg);
      window.speechSynthesis = { cancel() {}, speak() {} };
      window.SpeechSynthesisUtterance = function(text){ this.text = text; };
      window.navigator.serviceWorker = { register: () => Promise.resolve() };
      window.fetch = async () => ({ ok: true, json: async () => ({ choices:[{ message:{ content:'Coach: Test reply' } }] }) });
    }
  });

  const { window } = dom;
  const document = window.document;

  await wait(30);

  const freeCard = [...document.querySelectorAll('#pricingSection .pricing-card h3')].some(el => el.textContent.trim() === 'Free');
  checks.push({ name: 'Free card exists', pass: freeCard });

  const compareHeaders = [...document.querySelectorAll('.plan-table thead th')].map(el => el.textContent.trim());
  checks.push({ name: 'Plan comparison table exists', pass: compareHeaders.join('|') === '항목|Free|Starter|Pro|Executive' });

  document.getElementById('openSignupBtn').click();
  document.getElementById('signupName').value = 'Mina';
  document.getElementById('signupRole').value = 'Sales Manager';
  document.getElementById('signupBtn').click();
  await wait(20);

  checks.push({ name: 'Current plan defaults to Free', pass: window.eval('currentPlanName()') === 'Free' });
  checks.push({ name: 'Plan banner rendered', pass: document.getElementById('planBanner').textContent.includes('현재 플랜') });

  window.eval("setView('learn')");
  await wait(10);
  const lockedLesson = document.querySelector('.lesson-item[data-lesson="n2"]');
  lockedLesson.click();
  await wait(10);
  checks.push({ name: 'Locked lesson opens upgrade flow', pass: !document.getElementById('checkoutModal').classList.contains('hidden') });

  window.eval('closeCheckout()');
  window.eval("setView('coach')");
  await wait(10);

  for (let i = 0; i < 3; i++) {
    document.getElementById('coachInput').value = `Test roleplay reply ${i}`;
    document.getElementById('coachReplyBtn').click();
    await wait(20);
  }
  checks.push({ name: 'Free AI quota triggers checkout', pass: !document.getElementById('checkoutModal').classList.contains('hidden') && document.getElementById('checkoutFeedback').textContent.includes('AI 롤플레이') });

  document.getElementById('checkoutName').value = 'Mina';
  document.getElementById('checkoutEmail').value = 'mina@company.com';
  document.getElementById('checkoutCardNumber').value = '4242424242424242';
  document.getElementById('checkoutExpiry').value = '12/29';
  document.getElementById('checkoutCvc').value = '123';
  document.getElementById('checkoutAgree').checked = true;
  document.getElementById('confirmCheckoutBtn').click();
  await wait(40);

  checks.push({ name: 'Upgrade stores paid plan', pass: window.eval('currentPlanName()') === 'Starter' });

  window.eval("setLesson('networking','n2')");
  await wait(20);
  checks.push({ name: 'Starter unlocks second lesson', pass: document.getElementById('lessonContent').textContent.includes('링크드인 연결 제안') });

  console.log(JSON.stringify({ checks, passed: checks.filter(c => c.pass).length, total: checks.length }, null, 2));
})();
