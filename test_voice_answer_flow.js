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
    url: 'https://example.test/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    beforeParse(window) {
      window.alert = () => {};
      window.speechSynthesis = { cancel() {}, speak() {} };
      window.SpeechSynthesisUtterance = function(text){ this.text = text; };
      window.navigator.serviceWorker = { register: () => Promise.resolve() };
    }
  });
  const { window } = dom;
  const document = window.document;
  await wait(40);

  document.getElementById('openSignupBtn').click();
  document.getElementById('signupName').value = 'Mina';
  document.getElementById('signupRole').value = 'Sales';
  document.getElementById('signupBtn').click();
  await wait(20);

  window.eval("setView('learn')");
  await wait(20);

  const checks = [];
  checks.push({ name:'Roleplay memo is readonly voice box', pass: !!document.getElementById('roleplayMemo') && document.getElementById('roleplayMemo').readOnly });
  checks.push({ name:'Roleplay voice button exists', pass: !!document.getElementById('roleplayVoiceBtn') });
  checks.push({ name:'Quiz voice button exists', pass: document.querySelectorAll('.quizVoiceBtn').length > 0 });

  window.eval("setView('coach')");
  await wait(20);
  checks.push({ name:'Coach voice button exists', pass: !!document.getElementById('coachVoiceBtn') });
  checks.push({ name:'Coach input is readonly voice box', pass: !!document.getElementById('coachInput') && document.getElementById('coachInput').readOnly });

  console.log(JSON.stringify({ checks, passed: checks.filter(c => c.pass).length, total: checks.length }, null, 2));
})();
