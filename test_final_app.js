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

const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const dom = new JSDOM(mergedHtml, {
    url: 'https://example.test/?payment=cancel&plan=Starter',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    beforeParse(window) {
      window.alert = () => {};
      window.speechSynthesis = { cancel() {}, speak() {} };
      window.SpeechSynthesisUtterance = function(text){ this.text = text; };
      window.navigator.serviceWorker = { register: () => Promise.resolve() };
      window.fetch = async () => ({ ok: true, json: async () => ({ choices:[{ message:{ content:'Coach: Test reply' } }] }) });
    }
  });
  const { window } = dom;
  const document = window.document;
  await wait(40);

  const checks = [];
  checks.push({ name:'Free/Starter transition table visible', pass: document.body.textContent.includes('Free → Starter 전환 설계 비교') });
  checks.push({ name:'Payment cancel modal from query', pass: !document.getElementById('paymentResultModal').classList.contains('hidden') && document.getElementById('paymentResultTitle').textContent.includes('취소') });

  document.getElementById('closePaymentResultBtn').click();
  await wait(20);

  document.getElementById('openSignupBtn').click();
  document.getElementById('signupName').value = 'Mina';
  document.getElementById('signupRole').value = 'Sales';
  document.getElementById('signupBtn').click();
  await wait(30);

  window.eval("openCheckout('Starter')");
  await wait(20);
  document.querySelector('[data-preview-payment="success"]').click();
  await wait(20);
  checks.push({ name:'Payment success preview', pass: document.getElementById('paymentResultTitle').textContent.includes('정상적으로 확인') && document.getElementById('paymentResultActions').textContent.includes('대시보드로 이동') });

  document.getElementById('closePaymentResultBtn').click();
  await wait(20);
  window.eval("openCheckout('Starter')");
  await wait(20);
  document.querySelector('[data-preview-payment="fail"]').click();
  await wait(20);
  checks.push({ name:'Payment fail preview', pass: document.getElementById('paymentResultTitle').textContent.includes('완료하지 못했습니다') && document.getElementById('paymentResultActions').textContent.includes('다시 결제하기') });

  console.log(JSON.stringify({ checks, passed: checks.filter(c => c.pass).length, total: checks.length }, null, 2));
})();
