/* 右脑记单词 · 庆祝动画引擎（2026-10-22，待审）
 * RBC.celebrate({ tier, routine, text, badge, sfx, sound }) → Promise   答对 / 连对 / 全对 / 颁奖
 * RBC.chest({ sticker, sfx, voice, sound }) → Promise                     礼物宝箱 → 贴纸
 * 纯 SVG + CSS + 一个 canvas 粒子层，无外部依赖。粒子数按设备性能自适应（掉帧就减半）；尊重 prefers-reduced-motion；
 * 护眼：不做全屏闪白 / 高频闪烁，颜色用暖色系。点任意处可跳过。
 */
(function () {
  const W = window, D = document;
  const reduce = () => W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLORS = ['#FF8A3D', '#FFC93C', '#2EA868', '#3A8DDE', '#FF8FB1', '#9C6ADE', '#F2643A'];
  let perf = (() => { const c = navigator.hardwareConcurrency || 4, m = navigator.deviceMemory || 4; return c <= 4 || m <= 2 ? 0.55 : 1; })();
  const css = `
.rbc{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;flex-direction:column;pointer-events:auto;cursor:pointer;-webkit-tap-highlight-color:transparent}
.rbc{background:radial-gradient(circle at 50% 46%,rgba(255,249,238,.94) 0,rgba(255,249,238,.78) 34%,rgba(246,238,220,.35) 70%);animation:rbcfade .2s ease-out}
.rbc.dim{background:radial-gradient(circle at 50% 46%,rgba(255,249,238,.95) 0,rgba(255,244,217,.85) 40%,rgba(61,50,41,.35) 100%)}
.rbc canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.rbc .stage{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none}
.rbc .word{font:900 clamp(44px,13vw,78px)/1 "Fredoka","PingFang SC","Noto Sans SC",system-ui,sans-serif;color:#FF8A3D;-webkit-text-stroke:3px #fff;paint-order:stroke;text-shadow:0 6px 0 rgba(150,80,30,.22);display:flex}
.rbc .word span{display:inline-block;animation:rbcpop .62s cubic-bezier(.2,1.6,.4,1) both}
.rbc .badge{font:900 22px/1 system-ui,"PingFang SC",sans-serif;color:#fff;background:linear-gradient(180deg,#FF8A3D,#F2643A);padding:10px 18px;border-radius:999px;box-shadow:0 4px 0 #C94E2A;animation:rbcbadge .7s .25s cubic-bezier(.2,1.7,.4,1) both}
.rbc .badge.gold{background:linear-gradient(180deg,#FFD45C,#F2A900);box-shadow:0 4px 0 #B87A00;color:#5A3A00}
.rbc .masc{width:170px;height:170px;object-fit:contain;animation:rbcin .5s cubic-bezier(.2,1.5,.4,1) both,rbcjump .52s .1s cubic-bezier(.3,0,.3,1) 3}
.rbc .masc .body{transform-origin:50% 92%;animation:rbcjump .52s .1s cubic-bezier(.3,0,.3,1) 3}
.rbc.r-stars .masc .body{animation:rbcspin .9s .1s cubic-bezier(.4,0,.2,1) 1,rbcjump .5s 1s 2}
.rbc.r-wave .masc .body{animation:rbcsway .6s .1s ease-in-out 3}
.rbc .masc .armL{transform-origin:30px 62px;animation:rbcarmL .26s .1s ease-in-out 6 alternate}
.rbc .masc .armR{transform-origin:70px 62px;animation:rbcarmR .26s .1s ease-in-out 6 alternate}
.rbc .masc .eye{transform-box:fill-box;transform-origin:50% 50%;animation:rbcblink 2.2s .6s infinite}
.rbc .masc .mouth{transform-box:fill-box;transform-origin:50% 0;animation:rbcmouth .26s .1s ease-in-out 6 alternate}
.rbc .trophy{width:130px;height:130px;animation:rbcdrop .8s cubic-bezier(.3,1.5,.5,1) both}
.rbc .rainbow{position:absolute;width:min(560px,120vw);top:-140px;left:50%;transform:translateX(-50%);opacity:0;animation:rbcrain 1.8s .15s ease-out both}
.rbc .skip{position:absolute;bottom:calc(18px + env(safe-area-inset-bottom));left:0;right:0;text-align:center;color:#6F6253;font:600 14px system-ui;opacity:.75}
@keyframes rbcfade{from{opacity:0}}
@keyframes rbcpop{0%{transform:translateY(40px) scale(.3,.3);opacity:0}55%{transform:translateY(-14px) scale(1.18,.86);opacity:1}75%{transform:translateY(4px) scale(.92,1.1)}100%{transform:none}}
@keyframes rbcbadge{0%{transform:scale(0) rotate(-12deg)}70%{transform:scale(1.15) rotate(3deg)}100%{transform:none}}
@keyframes rbcin{0%{transform:translateY(120px) scale(.6,1.3);opacity:0}60%{transform:translateY(-10px) scale(1.08,.92);opacity:1}100%{transform:none}}
@keyframes rbcjump{0%,100%{transform:none}20%{transform:scale(1.12,.86)}50%{transform:translateY(-26px) scale(.92,1.1)}80%{transform:scale(1.06,.94)}}
@keyframes rbcspin{0%{transform:none}50%{transform:translateY(-20px) rotate(180deg) scale(.9,1.1)}100%{transform:rotate(360deg)}}
@keyframes rbcsway{0%,100%{transform:rotate(0)}25%{transform:rotate(-9deg) translateY(-6px)}75%{transform:rotate(9deg) translateY(-6px)}}
@keyframes rbcarmL{from{transform:rotate(20deg)}to{transform:rotate(-150deg)}}
@keyframes rbcarmR{from{transform:rotate(-20deg)}to{transform:rotate(150deg)}}
@keyframes rbcblink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
@keyframes rbcmouth{from{transform:scaleY(.7)}to{transform:scaleY(1.25)}}
@keyframes rbcdrop{0%{transform:translateY(-70vh) rotate(-20deg)}70%{transform:translateY(10px) rotate(6deg) scale(1.1,.9)}100%{transform:none}}
@keyframes rbcrain{0%{opacity:0;transform:translateX(-50%) scale(.6)}30%{opacity:.85}100%{opacity:.7;transform:translateX(-50%) scale(1)}}
/* 宝箱 */
.rbc .chestbox{position:relative;width:220px;height:220px;pointer-events:auto}
.rbc .chestbox svg{width:100%;height:100%;overflow:visible}
.rbc .chestbox.idle svg{animation:rbcidle 1.6s ease-in-out infinite}
.rbc .chestbox.shake svg{animation:rbcshake .12s linear 5}
.rbc .lid{transform-box:fill-box;transform-origin:10% 100%;transition:transform .45s cubic-bezier(.2,1.6,.4,1)}
.rbc .chestbox.open .lid{transform:rotate(-38deg) translateY(-14px)}
.rbc .rays{position:absolute;left:50%;top:44%;width:420px;height:420px;margin:-210px 0 0 -210px;opacity:0;background:repeating-conic-gradient(rgba(255,214,92,.55) 0 10deg,rgba(255,214,92,0) 10deg 24deg);border-radius:50%;-webkit-mask:radial-gradient(circle,#000 25%,transparent 70%);mask:radial-gradient(circle,#000 25%,transparent 70%);transition:opacity .4s}
.rbc .chestbox.open .rays{opacity:1;animation:rbcrot 6s linear infinite}
.rbc .gift{position:absolute;left:50%;top:40%;width:150px;height:150px;margin:-75px 0 0 -75px;opacity:0;transform:translateY(40px) scale(.2)}
.rbc .gift img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 6px 10px rgba(120,70,20,.3))}
.rbc .chestbox.out .gift{animation:rbcgift .9s cubic-bezier(.2,1.5,.4,1) forwards}
.rbc .hint{font:900 22px system-ui,"PingFang SC",sans-serif;color:#3D3229;background:#FFF9EE;padding:10px 18px;border-radius:999px;box-shadow:0 4px 0 #E7D9C1;animation:rbcbadge .6s cubic-bezier(.2,1.7,.4,1) both}
.rbc .gname{font:900 26px system-ui,"PingFang SC",sans-serif;color:#3D3229;background:#FFF9EE;padding:10px 20px;border-radius:18px;box-shadow:0 4px 0 #E7D9C1;opacity:0}
.rbc .gname.on{opacity:1;animation:rbcbadge .6s cubic-bezier(.2,1.7,.4,1) both}
.rbc .gbtn{pointer-events:auto;margin-top:14px;font:900 20px system-ui,"PingFang SC",sans-serif;color:#fff;background:#F2643A;border:0;border-radius:999px;padding:14px 26px;box-shadow:0 5px 0 #C94E2A;opacity:0}
.rbc .gbtn.on{animation:rbcfade .4s both;opacity:1}
@keyframes rbcidle{0%,100%{transform:none}50%{transform:translateY(-6px) rotate(-2deg)}}
@keyframes rbcshake{0%,100%{transform:rotate(0)}25%{transform:rotate(-7deg) translateX(-4px)}75%{transform:rotate(7deg) translateX(4px)}}
@keyframes rbcrot{to{transform:rotate(360deg)}}
@keyframes rbcgift{0%{opacity:0;transform:translateY(40px) scale(.2)}60%{opacity:1;transform:translateY(-120px) scale(1.25,.9)}80%{transform:translateY(-100px) scale(.95,1.06)}100%{opacity:1;transform:translateY(-108px) scale(1)}}
.shiny{position:relative;isolation:isolate}
.shiny::after{content:"";position:absolute;inset:6%;border-radius:22%;background:linear-gradient(115deg,transparent 20%,rgba(255,255,255,.75) 32%,rgba(255,170,220,.45) 40%,rgba(150,220,255,.45) 48%,transparent 60%);background-size:250% 250%;mix-blend-mode:screen;animation:rbcholo 2.6s ease-in-out infinite;pointer-events:none;-webkit-mask:var(--m) center/contain no-repeat;mask:var(--m) center/contain no-repeat}
@keyframes rbcholo{0%{background-position:120% 0}100%{background-position:-60% 0}}
@media (prefers-reduced-motion:reduce){.rbc *{animation-duration:.01s!important;animation-iteration-count:1!important}.shiny::after{animation:none}}
`;
  function ensureCSS() { if (!D.getElementById('rbc-css')) { const s = D.createElement('style'); s.id = 'rbc-css'; s.textContent = css; D.head.appendChild(s); } }
  // 吉祥物（和网站现有小橙同款：黄色圆身子 + 小耳朵），加了手臂、眨眼、张嘴
  const MASCOT_SRC = (() => { try { const v = getComputedStyle(document.documentElement).getPropertyValue('--mascot-src-cheer').trim(); if (v) return v; } catch (e) {} return 'preview/redesign/assets/mascots/cheer.webp'; })();
  const MASCOT = `<img class="masc" data-mascot="cheer" src="${MASCOT_SRC}" alt="罗老师" width="170" height="170"/>`;
  const TROPHY = `<svg class="trophy" viewBox="0 0 100 100" aria-hidden="true"><path d="M30 14h40v18c0 16-9 26-20 26S30 48 30 32z" fill="#FFC93C" stroke="#B87A00" stroke-width="3"/><path d="M30 20H18c0 14 6 20 14 20M70 20h12c0 14-6 20-14 20" fill="none" stroke="#F2A900" stroke-width="5"/><rect x="44" y="58" width="12" height="14" fill="#F2A900"/><rect x="32" y="72" width="36" height="12" rx="4" fill="#9C6ADE" stroke="#6A44A8" stroke-width="3"/><path d="M42 26l4 8 9 1-6 6 2 9-9-5-8 5 2-9-6-6 9-1z" fill="#fff" opacity=".85"/></svg>`;
  const RAINBOW = `<svg class="rainbow" viewBox="0 0 200 100" aria-hidden="true">${['#FF8FB1', '#FF8A3D', '#FFC93C', '#7BD389', '#7BB8F0', '#B79CF0'].map((c, i) => `<path d="M${10 + i * 7} 100a${90 - i * 7} ${90 - i * 7} 0 0 1 ${180 - i * 14} 0" fill="none" stroke="${c}" stroke-width="7"/>`).join('')}</svg>`;
  const CHEST = `<svg viewBox="0 0 120 120" aria-hidden="true"><ellipse cx="60" cy="110" rx="40" ry="6" fill="#000" opacity=".1"/>
<rect x="16" y="54" width="88" height="52" rx="8" fill="#C98A4B" stroke="#7A4A22" stroke-width="3"/><rect x="16" y="66" width="88" height="8" fill="#FFC93C" stroke="#B87A00" stroke-width="2"/><rect x="52" y="60" width="16" height="22" rx="3" fill="#FFC93C" stroke="#B87A00" stroke-width="2"/><circle cx="60" cy="71" r="3" fill="#7A4A22"/>
<g class="lid"><path d="M14 56q0-30 46-30t46 30z" fill="#D99A5B" stroke="#7A4A22" stroke-width="3"/><path d="M14 56h92" stroke="#FFC93C" stroke-width="6"/><path d="M54 27h12v28H54z" fill="#FFC93C" stroke="#B87A00" stroke-width="2"/></g>
<g fill="#FFC93C"><path d="M22 40l2 5 5 1-5 2-2 5-2-5-5-2 5-1z"/><path d="M98 36l2 4 4 1-4 2-2 4-2-4-4-2 4-1z"/></g></svg>`;
  // ---------- 粒子 ----------
  function particles(canvas, kind, n) {
    let ctx = null; try { ctx = canvas && canvas.getContext && canvas.getContext('2d'); } catch (e) {}
    if (!ctx) return () => {};   // 不支持画布（老浏览器 / 测试环境）就只放 CSS 动画
    const dpr = Math.min(2, W.devicePixelRatio || 1);
    const w = canvas.clientWidth, h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; ctx.scale(dpr, dpr);
    const P = [], rnd = (a, b) => a + Math.random() * (b - a);
    const add = (o) => P.push(Object.assign({ x: w / 2, y: h / 2, vx: 0, vy: 0, g: 600, r: rnd(5, 9), rot: rnd(0, 6), vr: rnd(-8, 8), life: rnd(1.4, 2.4), t: 0, c: COLORS[(Math.random() * COLORS.length) | 0], shape: 'rect' }, o));
    const burst = (x, y, m, spread, speed, shape) => { for (let i = 0; i < m; i++) { const a = rnd(-spread, spread) - Math.PI / 2, s = rnd(speed * .5, speed); add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, shape }); } };
    const firework = (x, y, delay, m) => setTimeout(() => { const c = COLORS[(Math.random() * COLORS.length) | 0]; for (let i = 0; i < m; i++) { const a = i / m * Math.PI * 2, s = rnd(180, 300); add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 160, c, shape: 'spark', r: rnd(2.5, 4), life: rnd(.9, 1.3) }); } }, delay);
    const k = Math.max(.25, perf) * (kind.big ? 1.6 : 1);
    if (kind.confetti) { burst(w * .1, h, 60 * k * n, .5, 1100, 'rect'); burst(w * .9, h, 60 * k * n, .5, 1100, 'rect'); }
    if (kind.stars) for (let i = 0; i < 40 * k * n; i++) add({ x: rnd(0, w), y: rnd(-h * .4, 0), vx: rnd(-30, 30), vy: rnd(60, 200), g: 120, shape: 'star', r: rnd(7, 13), c: ['#FFC93C', '#FFD45C', '#FFE08A'][i % 3], life: rnd(1.6, 2.4) });
    if (kind.balloons) for (let i = 0; i < 14 * k * n; i++) add({ x: rnd(w * .05, w * .95), y: h + rnd(20, 200), vx: rnd(-20, 20), vy: rnd(-260, -160), g: -20, shape: 'balloon', r: rnd(16, 24), vr: 0, rot: 0, life: 2.6 });
    if (kind.bubbles) for (let i = 0; i < 26 * k * n; i++) add({ x: rnd(0, w), y: h + rnd(0, 120), vx: rnd(-40, 40), vy: rnd(-260, -120), g: -10, shape: 'bubble', r: rnd(8, 22), life: 2.4 });
    if (kind.fireworks) { const m = Math.round(36 * k); [[.25, .3, 0], [.75, .25, 220], [.5, .18, 440], [.3, .5, 700], [.7, .45, 900]].slice(0, kind.big ? 5 : 3).forEach(([fx, fy, dl]) => firework(w * fx, h * fy, dl, m)); }
    if (kind.rain) for (let i = 0; i < 70 * k; i++) add({ x: rnd(0, w), y: rnd(-h, -10), vx: rnd(-20, 20), vy: rnd(80, 220), g: 60, life: 2.6 });
    let last = performance.now(), frames = 0, slow = 0, raf;
    const star = (r) => { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * .45 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); };
    function frame(now) {
      const dt = Math.min(.05, (now - last) / 1000); last = now; frames++;
      if (dt > .024) slow++; if (frames === 12 && slow > 5) { perf = Math.max(.25, perf * .5); P.splice(0, P.length >> 1); }   // 掉帧：粒子减半，记住这台设备
      ctx.clearRect(0, 0, w, h);
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i]; p.t += dt; if (p.t > p.life) { P.splice(i, 1); continue; }
        p.vy += p.g * dt; p.vx *= .99; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        const fade = Math.min(1, (p.life - p.t) / .5); ctx.globalAlpha = fade; ctx.fillStyle = p.c; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        if (p.shape === 'rect') { ctx.scale(1, Math.cos(p.t * 9)); ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); }
        else if (p.shape === 'star') star(p.r);
        else if (p.shape === 'spark') { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 7); ctx.fill(); }
        else if (p.shape === 'balloon') { ctx.rotate(-p.rot); ctx.beginPath(); ctx.ellipse(0, 0, p.r * .8, p.r, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(80,60,40,.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, p.r); ctx.quadraticCurveTo(5, p.r * 1.8, 0, p.r * 2.6); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(-p.r * .3, -p.r * .35, p.r * .18, p.r * .3, -.5, 0, 7); ctx.fill(); }
        else if (p.shape === 'bubble') { ctx.strokeStyle = 'rgba(122,160,220,.7)'; ctx.lineWidth = 2; ctx.fillStyle = 'rgba(200,230,255,.25)'; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(-p.r * .35, -p.r * .35, p.r * .2, 0, 7); ctx.fill(); }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      if (P.length || frames < 60) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }
  function sound(url, on) { if (!url || on === false) return; try { const a = new Audio(url); a.volume = .8; a.play().catch(() => {}); } catch (e) {} }
  const ROUTINES = ['confetti', 'stars', 'balloons', 'bubbles'];
  let lastR = -1;
  function overlay(cls) { ensureCSS(); const o = D.createElement('div'); o.className = 'rbc ' + cls; o.setAttribute('role', 'status'); D.body.appendChild(o); return o; }
  // tier：'ok' 答对 | 'streak3' 连对 3 | 'streak5' 连对 5 | 'all' 全对 / 颁奖
  function celebrate(o = {}) {
    const tier = o.tier || 'ok';
    let r = o.routine; if (!r) { do { r = ROUTINES[(Math.random() * ROUTINES.length) | 0]; } while (r === ROUTINES[lastR] && ROUTINES.length > 1); }
    lastR = ROUTINES.indexOf(r);
    const ov = overlay('r-' + (r === 'balloons' ? 'wave' : r) + (tier === 'all' ? ' dim' : ''));
    const text = o.text || (tier === 'all' ? '全对啦！' : tier === 'streak5' ? '太厉害了！' : tier === 'streak3' ? '好棒！' : ['太棒了！', '答对啦！', '真厉害！', '好样的！'][(Math.random() * 4) | 0]);
    const badge = o.badge || (tier === 'streak3' ? '🔥 连对 3 题！' : tier === 'streak5' ? '🌈 连对 5 题！' : tier === 'all' ? '🏆 全部答对！' : '');
    ov.innerHTML = `<canvas></canvas>${tier === 'streak5' || tier === 'all' ? RAINBOW : ''}<div class="stage">${tier === 'all' ? TROPHY : MASCOT}<div class="word">${[...text].map((c, i) => `<span style="animation-delay:${.08 + i * .06}s">${c}</span>`).join('')}</div>${badge ? `<div class="badge ${tier === 'all' ? 'gold' : ''}">${badge}</div>` : ''}${tier === 'all' ? MASCOT.replace('class="masc"', 'class="masc" style="width:96px;height:96px;margin-top:4px"') : ''}</div><div class="skip">点一下继续</div>`;
    const kinds = { [r]: true, fireworks: tier !== 'ok', big: tier === 'streak5' || tier === 'all', rain: tier === 'all', confetti: r === 'confetti' || tier === 'all' };
    const stop = reduce() ? () => {} : particles(ov.querySelector('canvas'), kinds, tier === 'ok' ? 1 : 1.4);
    sound(o.sfx, o.sound);
    const dur = o.duration || (tier === 'ok' ? 1300 : tier === 'all' ? 2600 : 2200);
    return new Promise(res => {
      let done = false; const end = () => { if (done) return; done = true; stop(); ov.style.transition = 'opacity .25s'; ov.style.opacity = '0'; setTimeout(() => { ov.remove(); res(); }, 250); };
      ov.addEventListener('click', end); setTimeout(end, reduce() ? 900 : dur);
    });
  }
  // 礼物宝箱：点一下 → 摇晃 → 开盖 → 光芒 → 贴纸飞出（闪光款带全息闪光）→「收进贴纸册」
  function chest(o = {}) {
    const s = o.sticker || {}, ov = overlay('dim');
    ov.style.cursor = 'default';
    const chestLuo = (() => { try { const v = getComputedStyle(document.documentElement).getPropertyValue('--mascot-src-chest').trim(); if (v) return v; } catch (e) {} return 'preview/redesign/assets/mascots/chest.webp'; })();
    ov.innerHTML = `<canvas></canvas><div class="stage"><img class="masc" data-mascot="chest" src="${chestLuo}" alt="罗老师" style="width:140px;height:140px;margin-bottom:4px"/><div class="hint">🎁 点一下宝箱！</div><div class="chestbox idle"><div class="rays"></div>${CHEST}<div class="gift ${s.shiny ? 'shiny' : ''}" style="--m:url('${s.img || ''}')"><img src="${s.img || ''}" alt=""></div></div>
      <div class="gname">${s.shiny ? '✨ 闪光稀有款：' : '新贴纸：'}${s.name || ''}</div><button class="gbtn" type="button">收进贴纸册 📒</button></div>`;
    const box = ov.querySelector('.chestbox'), btn = ov.querySelector('.gbtn');
    return new Promise(res => {
      let opened = false;
      const open = () => {
        if (opened) return; opened = true; ov.querySelector('.hint').style.visibility = 'hidden';
        box.classList.remove('idle'); box.classList.add('shake'); sound(o.sfx, o.sound);
        setTimeout(() => { box.classList.remove('shake'); box.classList.add('open'); if (!reduce()) particles(ov.querySelector('canvas'), { stars: true, fireworks: !!s.shiny, big: !!s.shiny }, s.shiny ? 1.3 : .8); }, reduce() ? 50 : 650);
        setTimeout(() => { box.classList.add('out'); ov.querySelector('.gname').classList.add('on'); if (o.onOpen) o.onOpen(); }, reduce() ? 100 : 950);
        setTimeout(() => btn.classList.add('on'), reduce() ? 200 : 1700);
      };
      box.addEventListener('click', open);
      if (o.autoOpen) setTimeout(open, o.autoOpen);
      btn.addEventListener('click', () => { ov.remove(); res(); });
    });
  }
  W.RBC = { celebrate, chest, routines: ROUTINES, MASCOT, ensureCSS, get perf() { return perf; } };
})();
