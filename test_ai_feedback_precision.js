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
  await wait(30);

  window.eval("setView('coach')");
  await wait(20);

  document.getElementById('coachInput').value = 'Nice to meet you. What brings you here today?';
  await window.handleCoachReply();
  await wait(20);

  const feedback = document.getElementById('coachFeedback').innerHTML;
  const lastCoach = [...document.querySelectorAll('#coachLog .chat-bubble')].pop().textContent;

  const checks = [
    { name:'Structured feedback sections', pass: feedback.includes('강점') && feedback.includes('더 자연스럽게 다듬기') && feedback.includes('추천 교정 문장') },
    { name:'Coach follow-up reply generated', pass: /Coach:/.test(lastCoach) && /Follow-up:/i.test(lastCoach) },
    { name:'Improved sentence in feedback', pass: feedback.includes('Nice to meet you') || feedback.includes('What brings you here today?') }
  ];

  console.log(JSON.stringify({ checks, passed: checks.filter(c => c.pass).length, total: checks.length }, null, 2));
})();
