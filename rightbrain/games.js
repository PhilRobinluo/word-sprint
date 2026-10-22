/* 右脑记单词 · 小游戏引擎（2026-10-22，待审）
 * RBG.bind(host) 后：RBG.lobby() / RBG.start(id) / RBG.handle(act, el, e)
 * 5 个短游戏：字母气球、听音找图、翻牌配对、拼词小火车、打地鼠字母。
 * 答错不跳过：重播声音 + 高亮提示 + 再试，直到答对。每局 1–3 星，星星攒够才开宝箱（规则在 index.html 的 gameGate/gamePool/gameResult）。
 */
(function () {
  const W = window, D = document;
  let H = null;           // host API from index.html
  let G = null;           // current game state
  let locked = false;

  const CATALOG = [
    { id: 'balloon', name: '字母气球', emoji: '🎈', tip: '听字母名字，戳破气球', intro: 'g_balloon', color: '#FF8FB1' },
    { id: 'listen',  name: '听音找图', emoji: '👂', tip: '听单词，点对的图片', intro: 'g_listen',  color: '#3A8DDE' },
    { id: 'memory',  name: '翻牌配对', emoji: '🃏', tip: '翻开卡片找一对',     intro: 'g_memory',  color: '#9C6ADE' },
    { id: 'train',   name: '拼词小火车', emoji: '🚂', tip: '把字母拼成小词',   intro: 'g_train',   color: '#2EA868' },
    { id: 'whack',   name: '打地鼠字母', emoji: '🐹', tip: '字母跳出来快点点', intro: 'g_whack',   color: '#FF8A3D' },
  ];

  const css = `
.g-lobby{display:flex;flex-direction:column;gap:12px;padding-bottom:24px}
.g-hello{display:flex;align-items:center;gap:12px;margin:2px 0 6px}
.g-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.g-card{border:0;border-radius:24px;padding:16px 12px;background:var(--paper,#FFF9EE);box-shadow:0 6px 0 var(--line,#E7D9C1);display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;font:inherit;color:var(--ink,#3D3229);min-height:132px;-webkit-tap-highlight-color:transparent}
.g-card:active{transform:translateY(4px);box-shadow:0 2px 0 var(--line,#E7D9C1)}
.g-card .ge{font-size:42px;line-height:1}
.g-card .gn{font-weight:900;font-size:20px}
.g-card .gt{font-size:13px;color:var(--muted,#6F6253);font-weight:700;text-align:center}
.g-stage{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;padding-bottom:20px}
.g-prompt{background:var(--paper,#FFF9EE);border-radius:22px;padding:12px 16px;font-weight:900;font-size:20px;box-shadow:0 4px 0 var(--line,#E7D9C1);text-align:center;width:100%;max-width:420px}
.g-prompt button.speak{border:0;background:#FFF3CF;border-radius:999px;padding:6px 14px;font-weight:800;margin-left:8px;cursor:pointer}
.g-score{display:flex;gap:10px;align-items:center;font-weight:800;color:var(--muted,#6F6253);font-size:15px}
.g-score b{color:var(--orange,#F2643A);font-size:22px}
.g-score .dot{width:14px;height:14px;border-radius:50%;background:var(--line,#E7D9C1);display:inline-block;transition:background .3s,transform .3s}
.g-score .dot.on{background:#2EA868}.g-score .dot.cur{background:#FFC93C;transform:scale(1.3)}
.g-card.locked{filter:grayscale(.7);opacity:.6}
.g-lock{display:flex;flex-direction:column;align-items:center;gap:10px;background:#FFF3CF;border-radius:22px;padding:14px;text-align:center;font-size:18px}
.g-lock .lk{font-size:44px;animation:gwiggle 1.6s ease-in-out infinite}
.g-lock .btn{min-height:56px;border-radius:20px;font-weight:900;font-size:20px;border:0;padding:0 26px;background:var(--orange,#F2643A);color:#fff;box-shadow:0 5px 0 var(--orange-d,#C94E2A)}
.g-meta{font-weight:800;color:var(--muted,#6F6253);margin:0 0 4px;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px}
.g-bank{display:inline-flex;gap:2px;font-size:18px}.g-bank i{font-style:normal;color:#E0D2B8}.g-bank i.on{color:#FFC93C}
.g-stars3{display:flex;justify-content:center;gap:8px;margin:6px 0}
.g-bigstar{font-size:64px;line-height:1;color:#E7D9C1;animation:gstar .6s cubic-bezier(.2,1.6,.4,1) both}
.g-bigstar.on{color:#FFC93C;text-shadow:0 4px 0 #D9A21E}
.g-eyes{font-size:64px}
@keyframes gstar{0%{transform:scale(0) rotate(-40deg);opacity:0}100%{transform:none;opacity:1}}
@keyframes gwiggle{0%,100%{transform:rotate(0)}20%{transform:rotate(-12deg)}40%{transform:rotate(10deg)}60%{transform:rotate(-6deg)}}
.g-donebox{text-align:center;padding:10px 0 20px}
.g-donebox .rtitle{font-size:30px;font-weight:900;margin:8px 0}
.g-btns{width:100%;max-width:360px;display:flex;flex-direction:column;gap:10px;margin-top:14px}
.g-btns .btn{min-height:56px;border-radius:20px;font-weight:900;font-size:20px;border:0;cursor:pointer}
.g-btns .btn.primary{background:var(--orange,#F2643A);color:#fff;box-shadow:0 5px 0 var(--orange-d,#C94E2A)}
.g-btns .btn.ghost{background:var(--paper,#FFF9EE);color:var(--ink,#3D3229);box-shadow:0 4px 0 var(--line,#E7D9C1)}

/* 气球 */
.g-sky{position:relative;width:100%;max-width:440px;height:min(58vh,420px);background:linear-gradient(180deg,#D6EEFF,#F6EEDC);border-radius:28px;overflow:hidden;box-shadow:inset 0 0 0 3px var(--line,#E7D9C1)}
.g-balloon{position:absolute;width:86px;height:110px;border:0;background:transparent;cursor:pointer;padding:0;animation:gfloat 3.2s ease-in-out infinite;-webkit-tap-highlight-color:transparent}
.g-balloon .blob{width:78px;height:86px;border-radius:50% 50% 50% 50% / 55% 55% 45% 45%;display:grid;place-items:center;font:900 34px/1 "Fredoka","PingFang SC",system-ui;color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.15);box-shadow:inset -8px -10px 0 rgba(0,0,0,.08),0 8px 0 rgba(0,0,0,.08);position:relative}
.g-balloon .blob:after{content:"";position:absolute;bottom:-10px;left:50%;width:0;height:0;border:8px solid transparent;border-top-color:inherit;transform:translateX(-50%)}
.g-balloon .str{width:2px;height:28px;background:#8B7355;margin:0 auto}
.g-balloon.popping{animation:gpop .45s ease-out forwards;pointer-events:none}
.g-balloon.wrong{animation:gshake .4s ease}
.g-balloon.hint .blob{box-shadow:0 0 0 5px #FFC93C,0 0 22px 6px rgba(255,201,60,.55)}
@keyframes gfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
@keyframes gpop{0%{transform:scale(1);opacity:1}40%{transform:scale(1.35)}100%{transform:scale(0);opacity:0}}
@keyframes gshake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px) rotate(-4deg)}75%{transform:translateX(8px) rotate(4deg)}}

/* 听音找图 */
.g-opts{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;max-width:420px}
.g-opt{min-height:140px;border-radius:26px;background:var(--paper,#FFF9EE);box-shadow:0 6px 0 var(--line,#E7D9C1),0 0 0 3px var(--line,#E7D9C1) inset;border:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:10px;cursor:pointer;font:inherit;color:var(--ink,#3D3229);-webkit-tap-highlight-color:transparent}
.g-opt img,.g-opt .emo{width:78px;height:78px;object-fit:contain;font-size:64px;line-height:1}
.g-opt .lab{font-weight:800;font-size:15px;color:var(--muted,#6F6253)}
.g-opt.right{background:#E7F7EC;box-shadow:0 6px 0 #2EA868,0 0 0 3px #2EA868 inset}
.g-opt.wrong{background:#FDE8E8;box-shadow:0 6px 0 #E5484D,0 0 0 3px #E5484D inset;animation:gshake .4s ease}
.g-opt.hint{box-shadow:0 0 0 5px #FFC93C,0 0 22px 6px rgba(255,201,60,.55)}
.g-opt.dim{opacity:.35}

/* 翻牌 */
.g-board{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;width:100%;max-width:420px}
.g-tile{aspect-ratio:1;border-radius:18px;border:0;background:transparent;perspective:600px;cursor:pointer;padding:0;-webkit-tap-highlight-color:transparent}
.g-tile .inner{width:100%;height:100%;position:relative;transform-style:preserve-3d;transition:transform .35s}
.g-tile.on .inner,.g-tile.matched .inner{transform:rotateY(180deg)}
.g-tile .face{position:absolute;inset:0;backface-visibility:hidden;border-radius:18px;display:grid;place-items:center;font-weight:900;box-shadow:0 4px 0 var(--line,#E7D9C1)}
.g-tile .back{background:linear-gradient(145deg,#F2643A,#FF8A3D);color:#fff;font-size:28px}
.g-tile .front{background:var(--paper,#FFF9EE);transform:rotateY(180deg);font-size:28px;color:var(--ink,#3D3229);padding:6px}
.g-tile .front img{width:70%;height:70%;object-fit:contain}
.g-tile.matched .front{background:#E7F7EC;box-shadow:0 4px 0 #2EA868}
.g-tile.hint .front{box-shadow:0 0 0 4px #FFC93C}

/* 小火车 */
.g-trainwrap{width:100%;max-width:440px;display:flex;flex-direction:column;align-items:center;gap:14px}
.g-target{display:flex;align-items:center;gap:12px;background:var(--paper,#FFF9EE);border-radius:22px;padding:10px 16px;box-shadow:0 4px 0 var(--line,#E7D9C1)}
.g-target img,.g-target .emo{width:72px;height:72px;object-fit:contain;font-size:56px}
.g-cars{display:flex;gap:8px;align-items:flex-end;justify-content:center;flex-wrap:wrap;min-height:100px;margin-bottom:22px}
.g-slot{width:78px;height:90px;border-radius:16px 16px 10px 10px;background:#FFF3CF;border:3px dashed #E8D6BC;display:grid;place-items:center;font:900 36px/1 "Fredoka",system-ui;color:var(--ink,#3D3229);position:relative;box-shadow:0 6px 0 #E8D6BC}
.g-slot.filled{background:#E7F7EC;border-style:solid;border-color:#2EA868;box-shadow:0 6px 0 #2EA868}
.g-slot.bad{animation:gshake .4s ease;background:#FDE8E8;border-color:#E5484D}
.g-slot:before{content:"";position:absolute;bottom:-14px;left:12px;right:12px;height:12px;background:#8B7355;border-radius:6px}
.g-slot:after{content:"";position:absolute;bottom:-22px;left:18px;width:14px;height:14px;border-radius:50%;background:#3D3229;box-shadow:36px 0 #3D3229}
.g-engine{font-size:48px;margin-right:4px;align-self:center}
.g-pool{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
.g-chip{width:70px;height:70px;border-radius:18px;border:0;background:var(--paper,#FFF9EE);box-shadow:0 5px 0 var(--line,#E7D9C1);font:900 32px/1 "Fredoka",system-ui;color:var(--ink,#3D3229);cursor:pointer;-webkit-tap-highlight-color:transparent}
.g-chip:active{transform:translateY(3px);box-shadow:0 2px 0 var(--line,#E7D9C1)}
.g-chip.used{opacity:.25;pointer-events:none}
.g-chip.dragging{opacity:.5}

/* 打地鼠 */
.g-holes{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;width:100%;max-width:360px}
.g-hole{aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 50% 60%,#C4A574,#8B7355);box-shadow:inset 0 8px 0 rgba(0,0,0,.15);position:relative;overflow:hidden;border:0;cursor:pointer;padding:0;-webkit-tap-highlight-color:transparent}
.g-mole{position:absolute;left:50%;bottom:8%;transform:translate(-50%,60%);width:72%;height:72%;border-radius:50% 50% 40% 40%;display:grid;place-items:center;font:900 32px/1 "Fredoka",system-ui;color:#fff;transition:transform .25s cubic-bezier(.2,1.4,.4,1);box-shadow:inset -6px -8px 0 rgba(0,0,0,.12)}
.g-mole.up{transform:translate(-50%,0)}
.g-mole.boom{animation:gpop .4s ease-out forwards}
.g-hole.hint .g-mole{box-shadow:0 0 0 4px #FFC93C,inset -6px -8px 0 rgba(0,0,0,.12)}

@media (prefers-reduced-motion:reduce){
  .g-balloon,.g-opt.wrong,.g-slot.bad{animation:none}
}
`;

  function ensureCSS() {
    if (D.getElementById('rbg-css')) return;
    const s = D.createElement('style'); s.id = 'rbg-css'; s.textContent = css; D.head.appendChild(s);
  }

  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function pick(a, n) { return shuffle(a).slice(0, n); }
  function ui(k) { return H.ui(k); }
  function say(list) { return H.say([].concat(list).filter(Boolean)); }
  function praise(g) { return H.praise(g); }
  function later(fn, ms) { return H.later(fn, ms); }
  function content() { return H.content(); }
  function topbar(mid) { return H.topbar(mid || ''); }

  function letters() { return (content().letters || []).slice(); }
  function words() { return (content().words || []).filter(w => w.image || w.icon || w.emoji); }
  function blends() { return (content().blends || []).filter(b => (b.letters || []).length >= 2 && (b.letters || []).length <= 4); }
  // 出题顺序：今天学的 + 薄弱词优先，不够再补（预览页没有进度，就全随机）
  function poolOf(type, n, ok) {
    const P0 = H.pool ? H.pool() : null;
    const base = type === 'letter' ? letters() : type === 'blend' ? blends() : words();
    if (!P0) return pick(base.filter(ok || (() => true)), n);
    const src = P0[type] || { mine: [], all: base };
    const good = x => base.includes(x) && (!ok || ok(x));
    const mine = src.mine.filter(good), rest = shuffle(src.all.filter(x => good(x) && !mine.includes(x)));
    return shuffle(mine.slice(0, n).concat(rest).slice(0, n));
  }
  const idOf = (type, d) => type === 'letter' ? 'L-' + d.letter : type === 'blend' ? d.id : 'W-' + d.word;
  function markWrong(id) { if (G && id && !G.wrong.includes(id)) G.wrong.push(id); }
  function markRight(id) { if (G && id && !G.right.includes(id) && !G.wrong.includes(id)) G.right.push(id); }

  function letterAudio(L) { return L.say || L.audio_en || L.audio; }
  function wordAudio(w) { return w.audio_en || w.audio; }
  const A = s => (H && H.asset ? H.asset(s) : s);
  function wordPic(w) {
    if (w.icon) return `<img src="${esc(A(w.icon))}" alt="">`;
    if (w.image && /\.(svg|png|webp|jpg)$/i.test(w.image)) return `<img src="${esc(A(w.image))}" alt="">`;
    return `<span class="emo">${esc(w.emoji || '❓')}</span>`;
  }
  function blendPic(b) {
    if (b.icon) return `<img src="${esc(A(b.icon))}" alt="">`;
    if (b.image && /\.(svg|png|webp|jpg)$/i.test(b.image)) return `<img src="${esc(A(b.image))}" alt="">`;
    return `<span class="emo">${esc(b.emoji || '🧩')}</span>`;
  }
  function keywordOf(L) {
    const kw = L.keyword;
    if (!kw) return null;
    const w = words().find(x => x.word === kw) || blends().find(x => x.word === kw);
    if (w) return { kind: 'word', d: w, pic: w.icon || w.image ? wordPic(w) : `<span class="emo">${esc(w.emoji || L.prop || '❓')}</span>` };
    // fallback: letter's own image / prop
    if (L.image) return { kind: 'img', pic: `<img src="${esc(A(L.image))}" alt="">`, label: kw };
    return { kind: 'emoji', pic: `<span class="emo">${esc(L.prop || '❓')}</span>`, label: kw };
  }

  const BCOLORS = ['#FF8FB1', '#3A8DDE', '#2EA868', '#FF8A3D', '#9C6ADE', '#F2643A', '#FFC93C'];

  function bind(host) { H = host; ensureCSS(); return RBG; }

  function setRoute(k) { if (H.setRoute) H.setRoute(k); }

  function lobby() {
    ensureCSS();
    G = null; locked = false;
    setRoute('games');
    if (H.leaveSession) H.leaveSession();
    const gate = H.gate ? H.gate() : { ok: true };
    if (gate.reason === 'cap') return capScreen(gate);
    const lockedAll = gate.reason === 'locked';
    const cards = CATALOG.map(g => `<button class="g-card ${lockedAll ? 'locked' : ''}" data-act="gstart" data-g="${g.id}" style="outline:3px solid ${g.color}22" aria-label="${esc(g.name)}：${esc(g.tip)}">
      <span class="ge" aria-hidden="true">${g.emoji}</span>
      <span class="gn">${esc(g.name)}</span>
      <span class="gt">${esc(g.tip)}</span>
    </button>`).join('');
    H.show(`${topbar(`<button class="ib" data-act="home" aria-label="回主页">✕</button>`)}
      <div class="g-lobby">
        <div class="g-hello">${H.mascot ? H.mascot() : '🐯'}<div class="say-bub">来玩小游戏！</div></div>
        ${lockedAll ? `<div class="g-lock"><span class="lk" aria-hidden="true">🔒</span><b>先学完今天的内容，就能玩啦！</b><button class="btn primary" data-act="glearn">▶ 去学习</button></div>` : `<p class="g-meta">今天还能玩 <b>${gate.left ?? '∞'}</b> 局 · 每局 1～3 颗⭐ · 攒 ${gate.need || 5} 颗开宝箱${starRow(gate)}</p>`}
        <div class="g-grid">${cards}</div>
        <p class="small" style="margin:4px 0 0;color:#B5651D">小游戏全部待审</p>
      </div>`, 'games lobby');
    later(() => { H.unlockAudio(); say([lockedAll ? ui('g_locked') : (ui('g_hello') || ui('g_pick'))]); }, 350);
  }

  function starRow(g) { const n = g.need || 5, b = g.bank || 0; return `<span class="g-bank" aria-label="宝箱进度 ${b}/${n}">${Array.from({ length: n }, (_, i) => `<i class="${i < b ? 'on' : ''}">★</i>`).join('')}🎁</span>`; }
  function capScreen(gate) {
    H.show(`${topbar(`<button class="ib" data-act="home" aria-label="回主页">✕</button>`)}
      <div class="g-donebox">
        <div class="g-eyes" aria-hidden="true">👀🌳</div>
        <div class="rtitle">今天玩够啦！</div>
        <p class="small" style="font-size:17px">今天已经玩了 ${gate.played} 局。<br>抬头看看窗外远远的地方，让眼睛休息一下，明天再玩！</p>
        <div class="g-btns"><button class="btn primary" data-act="home">回主页</button></div>
      </div>`, 'games cap');
    later(() => say([ui('g_cap')]), 350);
  }
  function start(id) {
    const meta = CATALOG.find(g => g.id === id);
    if (!meta || !H) return;
    const gate = H.gate ? H.gate() : { ok: true };
    if (!gate.ok) return lobby();
    ensureCSS();
    locked = false;
    setRoute('games');
    if (H.leaveSession) H.leaveSession();
    G = { id, meta, round: 0, total: 0, stars: 0, streak: 0, misses: 0, started: Date.now(), data: {}, wrong: [], right: [] };
    H.unlockAudio();
    const boot = {
      balloon: bootBalloon,
      listen: bootListen,
      memory: bootMemory,
      train: bootTrain,
      whack: bootWhack,
    }[id];
    if (!boot) return lobby();
    boot();
  }

  function scorebar() {
    return `<div class="g-score" aria-label="第 ${Math.min(G.round + 1, G.total)} / ${G.total} 题">${Array.from({ length: G.total }, (_, i) => `<i class="dot ${i < G.round ? 'on' : i === G.round ? 'cur' : ''}"></i>`).join('')}</div>`;
  }

  function shell(body, cls) {
    H.show(`${topbar(`<button class="ib" data-act="globby" aria-label="小游戏列表">✕</button>`)}
      <div class="g-stage ${cls || ''}">${scorebar()}${body}</div>`, 'games play');
  }

  async function onRight(extraSay) {
    G.stars++; G.streak++;
    const tier = G.streak >= 5 && G.streak % 5 === 0 ? 'streak5' : G.streak === 3 ? 'streak3' : 'ok';
    const grp = tier === 'streak5' ? 'streak5' : tier === 'streak3' ? 'streak3' : 'first';
    const clip = praise(grp) || ui('great1');
    await Promise.all([
      say([clip].concat(extraSay || [])),
      H.celebrateFx ? H.celebrateFx(tier) : Promise.resolve(),
    ]);
  }

  async function onWrong(replayList) {
    G.streak = 0; G.misses++;
    const enc = praise('encourage') || ui('g_wrong') || ui('again');
    await say([enc, ui('g_wrong')].concat(replayList || []).filter(Boolean));
  }

  async function finish() {
    locked = true;
    const done = G; G = null;
    const r = H.result ? H.result({ game: done.id, misses: done.misses, wrong: done.wrong, right: done.right }) : { stars: done.misses === 0 ? 3 : done.misses <= 2 ? 2 : 1, chests: 0, bank: 0, need: 5 };
    const stars = Array.from({ length: 3 }, (_, i) => `<span class="g-bigstar ${i < r.stars ? 'on' : ''}" style="animation-delay:${0.35 + i * 0.28}s">★</span>`).join('');
    const left = r.need - r.bank;
    H.show(`${topbar()}
      <div class="g-donebox">
        ${H.mascot ? H.mascot('style="width:110px;height:110px"') : ''}
        <div class="rtitle">${r.stars === 3 ? '全对通关！' : '通关啦！'}</div>
        <div class="g-stars3" aria-label="得到 ${r.stars} 颗星">${stars}</div>
        <p class="g-meta">${r.chests ? '🎁 星星攒够啦，开宝箱！' : `再得 <b>${left}</b> 颗⭐ 就能开宝箱`}${starRow(r)}</p>
        <div class="g-btns">
          <button class="btn primary" data-act="gstart" data-g="${done.id}">再玩一次</button>
          <button class="btn ghost" data-act="globby">别的小游戏</button>
          <button class="btn ghost" data-act="home">回主页</button>
        </div>
      </div>`, 'games done');
    const tok = done.started;
    await say([ui('g_done'), praise('round')].filter(Boolean));
    if (H.celebrateFx) await H.celebrateFx(r.stars === 3 ? 'all' : 'streak3', { text: '通关啦！', badge: '⭐'.repeat(r.stars) });
    for (let k = 0; k < r.chests; k++) if (H.giveChest) await H.giveChest('game');   // 星星攒够才开宝箱（通关本身不开）
    locked = false;
    return done;
  }

  /* ---------- 1. 字母气球 ---------- */
  function bootBalloon() {
    const rounds = poolOf('letter', 6, L => letterAudio(L));
    G.total = rounds.length; G.round = 0; G.data.rounds = rounds;
    nextBalloon();
  }
  function nextBalloon() {
    if (G.round >= G.total) return finish();
    locked = false;
    const ans = G.data.rounds[G.round];
    const distract = pick(letters().filter(L => L.letter !== ans.letter), 5);
    const opts = shuffle([ans].concat(distract)).map((L, i) => {
      const upper = Math.random() < 0.5;
      const ch = upper ? L.upper : L.letter;
      return { L, ch, upper, i };
    });
    G.data.cur = ans; G.data.opts = opts;
    const balloons = opts.map((o, i) => {
      const left = 6 + (i % 3) * 31 + (Math.random() * 4 - 2);
      const top = 8 + Math.floor(i / 3) * 42 + (Math.random() * 6);
      const col = BCOLORS[i % BCOLORS.length];
      return `<button class="g-balloon" data-act="gballoon" data-i="${i}" style="left:${left}%;top:${top}%;animation-delay:${(i * 0.18).toFixed(2)}s" aria-label="气球 ${esc(o.ch)}">
        <div class="blob" style="background:${col};border-top-color:${col};color:#fff">${esc(o.ch)}</div>
        <div class="str"></div>
      </button>`;
    }).join('');
    shell(`<div class="g-prompt">听！戳破这个字母的气球
      <button class="speak" data-act="greplay" aria-label="再听一遍">🔊 再听</button></div>
      <div class="g-sky" aria-label="气球天空">${balloons}</div>`, 'balloon');
    later(() => say([ui('g_balloon'), letterAudio(ans)]), 300);
  }
  async function tapBalloon(i, el) {
    if (!G || G.id !== 'balloon' || locked) return;
    const o = G.data.opts[i];
    if (!o) return;
    locked = true;
    if (o.L.letter === G.data.cur.letter) {
      el.classList.add('popping'); markRight(idOf('letter', o.L));
      await onRight([ui('g_pop'), letterAudio(o.L)]);
      G.round++;
      later(nextBalloon, 280);
    } else {
      el.classList.add('wrong');
      const right = [...D.querySelectorAll('.g-balloon')].find(b => G.data.opts[+b.dataset.i].L.letter === G.data.cur.letter);
      if (right) right.classList.add('hint'); markWrong(idOf('letter', G.data.cur));
      await onWrong([letterAudio(G.data.cur)]);
      el.classList.remove('wrong');
      if (right) later(() => right.classList.remove('hint'), 900);
      locked = false;
    }
  }

  /* ---------- 2. 听音找图 ---------- */
  function bootListen() {
    const nb = H.pool ? Math.min(2, (H.pool().blend.mine || []).length) : 2;
    const rounds = shuffle(poolOf('word', 5 - nb, w => wordAudio(w)).map(d => ({ ...d, _t: 'word' })).concat(poolOf('blend', nb, b => wordAudio(b) && (b.icon || b.image)).map(d => ({ ...d, _t: 'blend' }))));
    G.total = rounds.length; G.round = 0; G.data.rounds = rounds;
    nextListen();
  }
  function nextListen() {
    if (G.round >= G.total) return finish();
    locked = false;
    const ans = G.data.rounds[G.round];
    const distract = pick(words().concat(blends().filter(b => b.icon || b.image)).filter(w => w.word !== ans.word && w.meaning !== ans.meaning), 3);
    const opts = shuffle([ans].concat(distract));
    G.data.cur = ans; G.data.opts = opts;
    const btns = opts.map((w, i) => `<button class="g-opt" data-act="glisten" data-i="${i}" aria-label="${esc(w.meaning || w.word)}">
      ${wordPic(w)}<span class="lab">${esc(w.meaning || '')}</span>
    </button>`).join('');
    shell(`<div class="g-prompt">听！哪个是它？
      <button class="speak" data-act="greplay" aria-label="再听一遍">🔊 再听</button></div>
      <div class="g-opts">${btns}</div>`, 'listen');
    later(() => say([ui('g_listen'), wordAudio(ans)]), 300);
  }
  async function tapListen(i, el) {
    if (!G || G.id !== 'listen' || locked) return;
    const w = G.data.opts[i];
    if (!w) return;
    locked = true;
    const btns = [...D.querySelectorAll('.g-opt')];
    if (w.word === G.data.cur.word) {
      el.classList.add('right'); markRight(idOf(G.data.cur._t || 'word', G.data.cur));
      btns.forEach(b => b !== el && b.classList.add('dim'));
      await onRight([wordAudio(w)]);
      G.round++;
      later(nextListen, 280);
    } else {
      el.classList.add('wrong');
      const ri = G.data.opts.findIndex(x => x.word === G.data.cur.word);
      if (ri >= 0) btns[ri].classList.add('hint'); markWrong(idOf(G.data.cur._t || 'word', G.data.cur));
      await onWrong([wordAudio(G.data.cur)]);
      el.classList.remove('wrong');
      if (ri >= 0) later(() => btns[ri].classList.remove('hint'), 900);
      locked = false;
    }
  }

  /* ---------- 3. 翻牌配对 ---------- */
  function bootMemory() {
    // half letter↔keyword, half word picture↔word text
    const Lpairs = [];
    for (const L of poolOf('letter', 26)) {
      const kw = keywordOf(L);
      if (!kw) continue;
      Lpairs.push({
        key: 'L-' + L.letter,
        a: { kind: 'letter', html: `<span style="font-size:36px">${esc(L.upper)}</span>`, label: L.upper },
        b: { kind: 'pic', html: kw.pic, label: L.keyword || '' },
        audio: letterAudio(L), id: idOf('letter', L),
      });
      if (Lpairs.length >= 2) break;
    }
    const Wpairs = [];
    for (const w of poolOf('word', 42)) {
      if (!(w.image || w.icon || w.emoji)) continue;
      Wpairs.push({
        key: 'W-' + w.word,
        a: { kind: 'pic', html: wordPic(w), label: w.meaning || w.word },
        b: { kind: 'text', html: `<span style="font-size:22px">${esc(w.word)}</span>`, label: w.word },
        audio: wordAudio(w), id: idOf('word', w),
      });
      if (Wpairs.length >= 2) break;
    }
    const pairs = Lpairs.concat(Wpairs).slice(0, 4);
    const tiles = [];
    pairs.forEach((p, pi) => {
      tiles.push({ id: pi + 'a', pair: pi, face: p.a, audio: p.audio, item: p.id });
      tiles.push({ id: pi + 'b', pair: pi, face: p.b, audio: p.audio, item: p.id });
    });
    G.total = pairs.length; G.round = 0; // round = matched pairs
    G.data.tiles = shuffle(tiles);
    G.data.open = [];
    G.data.matched = new Set();
    renderMemory(true);
  }
  function renderMemory(first) {
    locked = false;
    const tiles = G.data.tiles.map((t, i) => {
      const on = G.data.open.includes(i) || G.data.matched.has(t.pair);
      const matched = G.data.matched.has(t.pair);
      return `<button class="g-tile ${on ? 'on' : ''} ${matched ? 'matched' : ''}" data-act="gflip" data-i="${i}" aria-label="${on ? esc(t.face.label || '卡片') : '翻牌'}">
        <div class="inner"><div class="face back">?</div><div class="face front">${t.face.html}</div></div>
      </button>`;
    }).join('');
    // scorebar uses matched count
    G.round = G.data.matched.size;
    shell(`<div class="g-prompt">翻开卡片，找出一对！
      ${first ? '' : ''}</div>
      <div class="g-board">${tiles}</div>`, 'memory');
    if (first) later(() => say([ui('g_memory')]), 300);
  }
  async function tapFlip(i) {
    if (!G || G.id !== 'memory' || locked) return;
    if (G.data.open.includes(i) || G.data.matched.has(G.data.tiles[i].pair)) return;
    if (G.data.open.length >= 2) return;
    G.data.open.push(i);
    renderMemory(false);
    const t = G.data.tiles[i];
    say([t.audio]);
    if (G.data.open.length < 2) return;
    locked = true;
    const [i1, i2] = G.data.open;
    const a = G.data.tiles[i1], b = G.data.tiles[i2];
    if (a.pair === b.pair) {
      G.data.matched.add(a.pair); markRight(a.item);
      G.data.open = [];
      G.stars++;
      G.streak++;
      await say([ui('g_match'), praise('first') || ui('great1')]);
      if (H.celebrateFx && G.data.matched.size === G.total) { /* finish handles */ }
      else if (H.celebrateFx) await H.celebrateFx('ok');
      if (G.data.matched.size >= G.total) { G.round = G.total; return finish(); }
      locked = false;
      renderMemory(false);
    } else {
      G.streak = 0; G.misses++;
      // 重教：亮出第一张卡真正的那一对，再念一遍，然后都翻回去重来
      const mate = G.data.tiles.findIndex((x, k) => k !== i1 && x.pair === a.pair);
      const el = D.querySelector(`.g-tile[data-i="${mate}"]`);
      if (el) el.classList.add('on', 'hint');
      await say([praise('encourage') || ui('g_wrong'), a.audio, ui('g_again')]);
      later(() => { if (!G) return; G.data.open = []; locked = false; renderMemory(false); }, 700);
    }
  }

  /* ---------- 4. 拼词小火车 ---------- */
  function bootTrain() {
    const rounds = poolOf('blend', 4, b => b.letters && b.letters.length >= 2 && b.letters.length <= 4);
    G.total = rounds.length; G.round = 0; G.data.rounds = rounds;
    nextTrain();
  }
  function phonSeq(b) {
    // play each letter phoneme then the word
    const seq = [];
    (b.letters || []).forEach(ch => {
      const L = letters().find(x => x.letter === ch);
      if (L && L.phon) seq.push(L.phon);
    });
    seq.push(b.audio_en || b.audio);
    return seq;
  }
  function nextTrain() {
    if (G.round >= G.total) return finish();
    locked = false;
    const b = G.data.rounds[G.round];
    const need = b.letters.slice();
    // pool = correct letters + 2 distractors
    const extra = pick(letters().map(L => L.letter).filter(ch => !need.includes(ch)), 2);
    const pool = shuffle(need.concat(extra));
    G.data.cur = b;
    G.data.need = need;
    G.data.filled = [];
    G.data.pool = pool;
    G.data.used = new Set();
    renderTrain(true);
  }
  function renderTrain(first) {
    const b = G.data.cur;
    const slots = G.data.need.map((ch, i) => {
      const got = G.data.filled[i];
      return `<div class="g-slot ${got ? 'filled' : ''}" data-slot="${i}">${got ? esc(got) : ''}</div>`;
    }).join('');
    const chips = G.data.pool.map((ch, i) => {
      const used = G.data.used.has(i);
      return `<button class="g-chip ${used ? 'used' : ''}" data-act="gchip" data-i="${i}" ${used ? 'disabled' : ''} aria-label="字母 ${esc(ch)}">${esc(ch)}</button>`;
    }).join('');
    shell(`<div class="g-prompt">把字母摆上小火车！
      <button class="speak" data-act="greplay" aria-label="再听一遍">🔊 再听</button></div>
      <div class="g-trainwrap">
        <div class="g-target">${blendPic(b)}<div><b style="font-size:22px">${esc(b.meaning || b.word)}</b></div></div>
        <div class="g-cars"><span class="g-engine" aria-hidden="true">🚂</span>${slots}</div>
        <div class="g-pool">${chips}</div>
      </div>`, 'train');
    if (first) later(() => say([ui('g_train')].concat(phonSeq(b))), 300);
  }
  async function tapChip(i, el) {
    if (!G || G.id !== 'train' || locked) return;
    if (G.data.used.has(i)) return;
    const ch = G.data.pool[i];
    const pos = G.data.filled.length;
    const expect = G.data.need[pos];
    locked = true;
    if (ch === expect) {
      G.data.filled.push(ch);
      G.data.used.add(i);
      // play that phoneme
      const L = letters().find(x => x.letter === ch);
      await say([L && L.phon ? L.phon : null]);
      if (G.data.filled.length >= G.data.need.length) {
        renderTrain(false); markRight(G.data.cur.id);
        await onRight(phonSeq(G.data.cur));
        G.round++;
        later(nextTrain, 400);
        return;
      }
      locked = false;
      renderTrain(false);
    } else {
      el.classList.add('wrong');
      const slot = D.querySelector(`.g-slot[data-slot="${pos}"]`);
      if (slot) slot.classList.add('bad');
      const L = letters().find(x => x.letter === expect); markWrong(G.data.cur.id);
      await onWrong([L && L.phon ? L.phon : null, G.data.cur.audio_en || G.data.cur.audio]);
      el.classList.remove('wrong');
      if (slot) slot.classList.remove('bad');
      // hint: highlight correct chip
      const hi = G.data.pool.findIndex((c, j) => c === expect && !G.data.used.has(j));
      if (hi >= 0) {
        const hb = D.querySelector(`.g-chip[data-i="${hi}"]`);
        if (hb) { hb.classList.add('hint'); later(() => hb.classList.remove('hint'), 1000); }
      }
      locked = false;
    }
  }

  /* ---------- 5. 打地鼠字母 ---------- */
  function bootWhack() {
    const rounds = poolOf('letter', 8, L => letterAudio(L));
    G.total = rounds.length; G.round = 0; G.data.rounds = rounds;
    nextWhack();
  }
  function nextWhack() {
    if (G.round >= G.total) return finish();
    locked = false;
    const ans = G.data.rounds[G.round];
    const distract = pick(letters().filter(L => L.letter !== ans.letter), 5);
    // 6 holes, one is answer
    const holes = shuffle([ans].concat(distract)).slice(0, 6);
    G.data.cur = ans; G.data.holes = holes;
    const cols = BCOLORS.slice();
    const html = holes.map((L, i) => {
      const col = cols[i % cols.length];
      const up = i < 4 || Math.random() < 0.7; // most up
      return `<button class="g-hole" data-act="gwhack" data-i="${i}" aria-label="地鼠 ${esc(L.upper)}">
        <div class="g-mole ${up ? 'up' : ''}" style="background:${col}">${esc(Math.random() < 0.5 ? L.upper : L.letter)}</div>
      </button>`;
    }).join('');
    shell(`<div class="g-prompt">听！点出这个字母
      <button class="speak" data-act="greplay" aria-label="再听一遍">🔊 再听</button></div>
      <div class="g-holes">${html}</div>`, 'whack');
    later(() => {
      // pop remaining moles up
      D.querySelectorAll('.g-mole:not(.up)').forEach((m, k) => later(() => m.classList.add('up'), 80 + k * 60));
      say([ui('g_whack'), letterAudio(ans)]);
    }, 280);
  }
  async function tapWhack(i, el) {
    if (!G || G.id !== 'whack' || locked) return;
    const L = G.data.holes[i];
    if (!L) return;
    locked = true;
    const mole = el.querySelector('.g-mole');
    if (L.letter === G.data.cur.letter) {
      if (mole) mole.classList.add('boom'); markRight(idOf('letter', L));
      await onRight([letterAudio(L)]);
      G.round++;
      later(nextWhack, 300);
    } else {
      el.classList.add('wrong');
      const ri = G.data.holes.findIndex(x => x.letter === G.data.cur.letter);
      const holes = [...D.querySelectorAll('.g-hole')];
      if (ri >= 0) holes[ri].classList.add('hint'); markWrong(idOf('letter', G.data.cur));
      await onWrong([letterAudio(G.data.cur)]);
      el.classList.remove('wrong');
      if (ri >= 0) later(() => holes[ri].classList.remove('hint'), 900);
      locked = false;
    }
  }

  /* ---------- events ---------- */
  function replay() {
    if (!G) return;
    H.unlockAudio();
    if (G.id === 'balloon') say([letterAudio(G.data.cur)]);
    else if (G.id === 'listen') say([wordAudio(G.data.cur)]);
    else if (G.id === 'train') say(phonSeq(G.data.cur));
    else if (G.id === 'whack') say([letterAudio(G.data.cur)]);
    else if (G.id === 'memory') say([ui('g_memory')]);
  }

  function handle(act, el) {
    if (!H) return false;
    switch (act) {
      case 'games': lobby(); return true;
      case 'globby': lobby(); return true;
      case 'gstart': start(el && el.dataset.g); return true;
      case 'glearn': if (H.goLearn) H.goLearn(); return true;
      case 'greplay': replay(); return true;
      case 'gballoon': tapBalloon(+el.dataset.i, el); return true;
      case 'glisten': tapListen(+el.dataset.i, el); return true;
      case 'gflip': tapFlip(+el.dataset.i); return true;
      case 'gchip': tapChip(+el.dataset.i, el); return true;
      case 'gwhack': tapWhack(+el.dataset.i, el); return true;
      default: return false;
    }
  }

  function afterLessonBtn() {
    return `<button class="btn ghost" data-act="games" aria-label="玩个小游戏">🎮 玩个小游戏</button>`;
  }

  const RBG = {
    bind, lobby, start, handle, catalog: CATALOG, afterLessonBtn, ensureCSS,
    get state() { return G; },
    get busy() { return locked; },
  };
  W.RBG = RBG;
})();
