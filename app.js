// 星星数学大冒险 · 纯前端加减法测验
// 题目全部现场生成，不联网、不存个人信息。最高分只存在本机浏览器里。
const QUIZ_SIZE = 16;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function tens(n) { return Math.floor(n / 10) * 10; }
function ones(n) { return n % 10; }
function parts(n) {
  const out = [];
  let rest = n;
  for (const place of [100, 10]) {
    const v = Math.floor(rest / place) * place;
    if (v) out.push(v);
    rest -= v;
  }
  if (rest || out.length === 0) out.push(rest);
  return out;
}
function chip(n, cls) { return '<span class="chip ' + (cls || '') + '">' + n + '</span>'; }

// ---------- 题目生成：每档都控制范围、进位/退位比例、不重复 ----------
function genGentle() {
  const kind = randInt(0, 3);
  if (kind === 0) { // 20 以内加法
    const a = randInt(2, 18), b = randInt(2, 20 - a);
    return { a, b, op: '+', answer: a + b };
  }
  if (kind === 1) { // 20 以内减法
    const a = randInt(6, 20), b = randInt(2, a - 2);
    return { a, b, op: '-', answer: a - b };
  }
  if (kind === 2) { // 两位数 + 一位数，不进位
    const a = randInt(1, 8) * 10 + randInt(1, 7), b = randInt(1, 9 - ones(a));
    return { a, b, op: '+', answer: a + b };
  }
  const a = randInt(1, 9) * 10 + randInt(2, 9), b = randInt(2, ones(a));
  return { a, b, op: '-', answer: a - b }; // 两位数 - 一位数，不退位
}

function genMediumAdd() {
  const wantCarry = Math.random() < 0.5;
  const tA = randInt(1, 7), oA = randInt(1, 9);
  const tB = randInt(1, 8 - tA);
  let oB;
  if (wantCarry && oA < 9) oB = randInt(10 - oA, 9);
  else if (oA === 9) oB = randInt(1, 9);
  else oB = randInt(1, 9 - oA);
  const a = tA * 10 + oA, b = tB * 10 + oB;
  return { a, b, op: '+', answer: a + b, carry: ones(a) + ones(b) >= 10 };
}
function genMediumSub() {
  const wantBorrow = Math.random() < 0.5;
  const tA = randInt(2, 9), oA = randInt(0, 9);
  const tB = randInt(1, tA - 1);
  let oB;
  if (wantBorrow && oA < 9) oB = randInt(oA + 1, 9);
  else oB = randInt(0, oA);
  const a = tA * 10 + oA, b = tB * 10 + oB;
  return { a, b, op: '-', answer: a - b, borrow: ones(a) < ones(b) };
}

function genChallenge() {
  const r = Math.random();
  if (r < 0.4) {
    const a = randInt(102, 289);
    const bMax = Math.min(98, 300 - a);
    const b = randInt(12, Math.max(12, bMax));
    return { a, b, op: '+', answer: a + b };
  }
  if (r < 0.8) {
    const a = randInt(121, 299);
    const b = randInt(12, Math.min(98, a - 21));
    return { a, b, op: '-', answer: a - b };
  }
  // 缺数题：只在 100 以内，形式多样但答案唯一
  const result = randInt(30, 99), known = randInt(11, result - 11), missing = result - known;
  const form = randInt(0, 2);
  if (form === 0) return { display: known + ' + ? = ' + result, answer: missing, kind: 'missing', known, result, op: '+' };
  if (form === 1) return { display: '? + ' + known + ' = ' + result, answer: missing, kind: 'missing', known, result, op: '+' };
  return { display: result + ' - ? = ' + known, answer: missing, kind: 'missing', known, result, op: '-' };
}

function genQuestion(level) {
  if (level === 'gentle') return genGentle();
  if (level === 'challenge') return genChallenge();
  return Math.random() < 0.5 ? genMediumAdd() : genMediumSub();
}
function displayOf(q) {
  if (q.display) return q.display;
  return q.a + ' ' + q.op + ' ' + q.b + ' = ?';
}
function generateQuiz(level) {
  const out = [], used = new Set();
  let tries = 0;
  while (out.length < QUIZ_SIZE && tries < 2000) {
    tries++;
    const q = genQuestion(level);
    const key = displayOf(q) + '=' + q.answer;
    if (used.has(key)) continue;
    used.add(key); out.push(q);
  }
  return out;
}

// ---------- 图解：只给图和短句，不给大段文字 ----------
function explainHtml(q) {
  if (q.kind === 'missing') {
    return '<div class="title">🔍 这样想</div>' +
      '<div class="step">' + chip(q.result) + ' 减去 ' + chip(q.known) + ' = ' + chip(q.answer, 'answer') + '</div>' +
      '<div class="step">所以 ? = ' + chip(q.answer, 'answer') + '</div>';
  }
  if (q.op === '+') {
    return '<div class="title">🔍 拆开算</div>' +
      '<div class="step">' + chip(q.a) + ' = ' + parts(q.a).map(n => chip(n, n >= 100 ? 'tens' : (n >= 10 ? 'tens' : 'ones'))).join(' + ') + '</div>' +
      '<div class="step">' + chip(q.b) + ' = ' + parts(q.b).map(n => chip(n, n >= 100 ? 'tens' : (n >= 10 ? 'tens' : 'ones'))).join(' + ') + '</div>' +
      '<div class="step">合起来 = ' + chip(q.answer, 'answer') + '</div>';
  }
  if (q.borrow && q.a < 100) {
    const newTens = tens(q.a) - 10, newOnes = ones(q.a) + 10;
    return '<div class="title">🔍 个位不够，向十位借 1 个十</div>' +
      '<div class="step">' + chip(q.a) + ' = ' + chip(newTens, 'tens') + ' + ' + chip(newOnes, 'ones') + '</div>' +
      '<div class="step">' + chip(newTens) + ' - ' + chip(tens(q.b)) + ' = ' + chip(newTens - tens(q.b)) +
      '，' + chip(newOnes) + ' - ' + chip(ones(q.b)) + ' = ' + chip(newOnes - ones(q.b)) + '</div>' +
      '<div class="step">合起来 = ' + chip(q.answer, 'answer') + '</div>';
  }
  if (q.a >= 100) {
    const step1 = q.a - tens(q.b);
    return '<div class="title">🔍 先减整十，再减个位</div>' +
      '<div class="step">' + chip(q.a) + ' - ' + chip(tens(q.b)) + ' = ' + chip(step1) + '</div>' +
      '<div class="step">' + chip(step1) + ' - ' + chip(ones(q.b)) + ' = ' + chip(q.answer, 'answer') + '</div>';
  }
  return '<div class="title">🔍 十位减十位，个位减个位</div>' +
    '<div class="step">' + chip(tens(q.a)) + ' - ' + chip(tens(q.b)) + ' = ' + chip(tens(q.a) - tens(q.b)) +
    '，' + chip(ones(q.a)) + ' - ' + chip(ones(q.b)) + ' = ' + chip(ones(q.a) - ones(q.b)) + '</div>' +
    '<div class="step">合起来 = ' + chip(q.answer, 'answer') + '</div>';
}
function hintHtml(q) {
  if (q.kind === 'missing') return '💡 想一想：' + chip(q.result) + ' 减去 ' + chip(q.known) + ' 是多少？';
  return '💡 ' + chip(q.a) + ' 可以拆成 ' + parts(q.a).map(chip).join(' + ') + ' 来看一看';
}

// ---------- 界面状态 ----------
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  const screens = { start: $('start-screen'), quiz: $('quiz-screen'), result: $('result-screen') };
  let level = 'medium', questions = [], index = 0, stars = 0, correct = 0;
  let input = '', answered = false, wrong = [], startTime = 0, timerId = null, nextTimer = null;
  let soundOn = true, audioCtx = null;

  function show(screen) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screens[screen].classList.remove('hidden');
  }
  function beep(freq, dur) {
    if (!soundOn) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = freq; o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(0.12, audioCtx.currentTime);
      o.start(); o.stop(audioCtx.currentTime + dur);
    } catch (e) { /* 声音不可用时静默继续 */ }
  }
  function fmtTime(ms) {
    const s = Math.floor(ms / 1000);
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }
  function bestKey(l) { return 'cute-math-best-' + l; }
  function updateBestLine() {
    const best = localStorage.getItem(bestKey(level));
    $('best-line').textContent = best ? '这个难度最好成绩：答对 ' + best + ' / ' + QUIZ_SIZE + ' 题' : '';
  }
  function renderQuestion() {
    const q = questions[index];
    answered = false; input = '';
    $('question-text').textContent = displayOf(q);
    $('answer-display').innerHTML = '<span class="placeholder">?</span>';
    $('answer-display').className = 'answer-display';
    $('feedback').textContent = ''; $('feedback').className = 'feedback';
    $('explain-panel').classList.add('hidden'); $('explain-panel').innerHTML = '';
    $('how-btn').classList.add('hidden'); $('next-btn').classList.add('hidden');
    $('hint-btn').classList.remove('hidden');
    $('progress-text').textContent = (index + 1) + ' / ' + questions.length;
    $('progress-fill').style.width = (index / questions.length * 100) + '%';
    $('star-count').textContent = '⭐ ' + stars;
    $('question-box').classList.remove('shake', 'pop');
  }
  function setInput() {
    $('answer-display').innerHTML = input ? input : '<span class="placeholder">?</span>';
  }
  function checkAnswer() {
    if (answered || !input) return;
    const q = questions[index];
    answered = true;
    const ok = parseInt(input, 10) === q.answer;
    const disp = $('answer-display');
    if (ok) {
      correct++; stars++;
      disp.className = 'answer-display correct pop';
      $('feedback').textContent = '🎉 答对啦！太棒了！'; $('feedback').className = 'feedback good';
      $('star-count').textContent = '⭐ ' + stars;
      $('hint-btn').classList.add('hidden');
      beep(880, 0.18);
      nextTimer = setTimeout(nextQuestion, 1100);
    } else {
      wrong.push(q);
      disp.className = 'answer-display wrong shake';
      $('feedback').textContent = '正确答案是 ' + q.answer + '，没关系～'; $('feedback').className = 'feedback bad';
      $('how-btn').classList.remove('hidden'); $('next-btn').classList.remove('hidden');
      $('hint-btn').classList.add('hidden');
      beep(220, 0.25);
    }
  }
  function nextQuestion() {
    index++;
    if (index >= questions.length) showResult();
    else renderQuestion();
  }
  function showResult() {
    clearInterval(timerId);
    $('progress-fill').style.width = '100%';
    const elapsed = fmtTime(Date.now() - startTime);
    const acc = correct / questions.length;
    const starNum = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1;
    $('result-stars').textContent = '⭐'.repeat(starNum) + '☆'.repeat(3 - starNum);
    $('result-line').textContent = '答对 ' + correct + ' / ' + questions.length + ' 题';
    $('result-time').textContent = '用时 ' + elapsed;
    const prev = parseInt(localStorage.getItem(bestKey(level)) || '0', 10);
    if (correct > prev) localStorage.setItem(bestKey(level), String(correct));
    $('wrong-list').innerHTML = wrong.length
      ? '<h3 style="text-align:center;margin:0">错题图解（点开看）</h3>' + wrong.map(q =>
          '<details class="wrong-item"><summary>' + displayOf(q).replace('?', q.answer) + '</summary><div class="explain">' + explainHtml(q) + '</div></details>').join('')
      : '<p style="text-align:center">🎊 全对！你就是小小数学家！</p>';
    show('result');
  }
  function startQuiz() {
    questions = generateQuiz(level); index = 0; stars = 0; correct = 0; wrong = [];
    startTime = Date.now();
    clearInterval(timerId);
    timerId = setInterval(() => { $('timer').textContent = fmtTime(Date.now() - startTime); }, 1000);
    $('timer').textContent = '00:00';
    show('quiz'); renderQuestion();
  }

  document.querySelectorAll('.level').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.level').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected'); level = btn.dataset.level; updateBestLine();
    });
  });
  $('start-btn').addEventListener('click', startQuiz);
  $('again-btn').addEventListener('click', startQuiz);
  $('change-level-btn').addEventListener('click', () => { clearInterval(timerId); updateBestLine(); show('start'); });
  $('quit-btn').addEventListener('click', () => { clearInterval(timerId); clearTimeout(nextTimer); updateBestLine(); show('start'); });
  $('sound-btn').addEventListener('click', () => {
    soundOn = !soundOn; $('sound-btn').textContent = soundOn ? '🔊' : '🔇';
  });
  $('hint-btn').addEventListener('click', () => {
    if (answered) return;
    $('explain-panel').innerHTML = hintHtml(questions[index]);
    $('explain-panel').classList.remove('hidden');
  });
  $('how-btn').addEventListener('click', () => {
    $('explain-panel').innerHTML = explainHtml(questions[index]);
    $('explain-panel').classList.remove('hidden');
  });
  $('next-btn').addEventListener('click', nextQuestion);
  document.querySelectorAll('.keypad button').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.key;
      if (answered) return;
      if (k === 'back') input = input.slice(0, -1);
      else if (k === 'ok') { checkAnswer(); return; }
      else if (input.length < 3) input += k;
      setInput();
    });
  });
  document.addEventListener('keydown', e => {
    if (screens.quiz.classList.contains('hidden')) return;
    if (/^[0-9]$/.test(e.key) && !answered && input.length < 3) { input += e.key; setInput(); }
    else if (e.key === 'Backspace' && !answered) { input = input.slice(0, -1); setInput(); }
    else if (e.key === 'Enter') { if (answered) nextQuestion(); else checkAnswer(); }
  });
  updateBestLine();
}

if (typeof module !== 'undefined') {
  module.exports = { generateQuiz, displayOf, explainHtml, QUIZ_SIZE };
}
