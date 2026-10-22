/* 3 套视觉样板的共用交互（待审）：换页过渡、按压回弹、彩纸、答题、轮播、语速、跟读演示。 */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]rm\b/.test(location.search);
  const SHOT = /[?&]shot\b/.test(location.search);
  const root = document.documentElement;
  if (SHOT) root.classList.add('shot');
  if (RM) root.classList.add('rm');
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const AUD = '../../../audio/';
  const SPRING = 'cubic-bezier(.34,1.56,.64,1)', EASE = 'cubic-bezier(.2,.8,.2,1)';
  let cur = null, rate = 1, au = null, wi = 0, gestured = false;
  addEventListener('pointerdown', () => { gestured = true; }, { once: true, capture: true });

  function play(src) {
    if (!gestured) return;
    try { au && au.pause(); au = new Audio(AUD + src); au.playbackRate = rate; au.play().catch(() => {}); } catch (e) {}
  }
  const anim = (el, kf, o) => (RM || !el || !el.animate) ? null : el.animate(kf, o);

  function enter(scr) {
    $$('[data-in]', scr).forEach((el, i) => anim(el, [{ opacity: 0, transform: 'translateY(14px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: 40 + i * 55, easing: SPRING, fill: 'backwards' }));
    if (scr.id === 'quiz') {
      $$('.opt', scr).forEach((el, i) => { el.classList.remove('right', 'wrong', 'hint'); anim(el, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'none' }], { duration: 560, delay: 140 + i * 80, easing: SPRING, fill: 'backwards' }); });
      setTimeout(() => play('en/cat.mp3'), 350);
    }
    if (scr.id === 'win') celebrate(scr);
  }

  function show(id, back) {
    const next = document.getElementById(id); if (!next || next === cur) return;
    const prev = cur; cur = next;
    $$('.review .tabs a').forEach(a => a.classList.toggle('on', a.hash === '#' + id));
    if (location.hash !== '#' + id) history.replaceState(null, '', location.pathname + location.search + '#' + id);
    const swap = () => { prev && prev.classList.remove('on'); next.classList.add('on'); next.scrollTop = 0; };
    if (RM || SHOT || !prev) { swap(); enter(next); return; }
    root.dataset.dir = back ? 'b' : 'f';
    if (document.startViewTransition) { const t = document.startViewTransition(swap); t.ready.then(() => enter(next)).catch(() => enter(next)); }
    else { swap(); anim(next, [{ opacity: 0, transform: `translateX(${back ? -28 : 28}px)` }, { opacity: 1, transform: 'none' }], { duration: 420, easing: EASE }); enter(next); }
  }

  /* 彩纸：颜色和形状来自 CSS 变量 --cf-colors / --cf-shapes */
  function confetti(host, x, y, n, spread = 1) {
    if (RM) return;
    const cs = getComputedStyle(root), cols = cs.getPropertyValue('--cf-colors').split(',').map(s => s.trim()).filter(Boolean);
    const shapes = (cs.getPropertyValue('--cf-shapes').trim() || 'rect circle').split(/\s+/);
    const box = host.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i'); p.className = 'cf ' + shapes[i % shapes.length];
      p.style.background = cols[i % cols.length]; p.style.color = cols[i % cols.length];
      p.style.left = (x - box.left) + 'px'; p.style.top = (y - box.top) + 'px';
      host.appendChild(p);
      const a = Math.random() * Math.PI * 2, v = (60 + Math.random() * 170) * spread;
      const dx = Math.cos(a) * v, dy = Math.sin(a) * v - 90 * spread, r = (Math.random() - .5) * 900;
      const d = 1300 + Math.random() * 1100;
      p.animate([
        { transform: 'translate(0,0) rotate(0) scale(.4)', opacity: 1 },
        { transform: `translate(${dx}px,${dy}px) rotate(${r / 2}deg) scale(1)`, opacity: 1, offset: .35 },
        { transform: `translate(${dx * 1.25}px,${dy + 260 * spread}px) rotate(${r}deg) scale(.9)`, opacity: 0 }
      ], { duration: d, easing: 'cubic-bezier(.15,.7,.35,1)' }).onfinish = () => p.remove();
    }
  }

  function celebrate(scr) {
    const app = $('#app'), b = app.getBoundingClientRect();
    const m = $('.mascot-big', scr), praise = $$('.praise span', scr), stars = $$('.earned i', scr);
    confetti($('.burst', scr), b.left + b.width / 2, b.top + b.height * .3, SHOT ? 110 : 80, 1.3);
    if (!SHOT) setTimeout(() => confetti($('.burst', scr), b.left + b.width * .2, b.top + b.height * .45, 30, .8), 380);
    if (!SHOT) setTimeout(() => confetti($('.burst', scr), b.left + b.width * .8, b.top + b.height * .45, 30, .8), 620);
    anim(m, [{ transform: 'translateY(40px) scale(.5)', opacity: 0 }, { transform: 'translateY(-26px) scale(1.08)', opacity: 1, offset: .55 }, { transform: 'translateY(4px) scale(.97)', offset: .8 }, { transform: 'none' }], { duration: 900, easing: EASE });
    praise.forEach((el, i) => anim(el, [{ transform: 'scale(.3) rotate(-6deg)', opacity: 0 }, { transform: 'scale(1.12) rotate(2deg)', opacity: 1, offset: .6 }, { transform: 'none' }], { duration: 700, delay: 260 + i * 160, easing: EASE, fill: 'backwards' }));
    stars.forEach((el, i) => anim(el, [{ transform: 'scale(0) rotate(-120deg)' }, { transform: 'scale(1.35) rotate(12deg)', offset: .6 }, { transform: 'none' }], { duration: 650, delay: 620 + i * 170, easing: EASE, fill: 'backwards' }));
    setTimeout(() => play(window.RB_PRAISE), 200);
  }

  function toast(msg) {
    const t = $('.toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2200);
  }

  function setWord(i, dir) {
    const w = window.RB_WORDS[i], body = $('[data-word]'); if (!w) return;
    const fill = () => {
      $('.pic img', body).src = `../../../img/${w.img}.svg`; $('.pic img', body).alt = w.zh;
      $('.word', body).textContent = w.w; $('.say', body).dataset.audio = `en/${w.w}.mp3`;
      $('.ipa', body).innerHTML = `<span lang="en">${w.ipa}</span><b>${w.zh}</b>`;
      $('.tag', body).textContent = w.tag; $('.slogan', body).textContent = w.slogan; $('.hook-txt', body).textContent = w.hook;
      $$('#card .count b').forEach(b => b.textContent = 2 + i); $('#card .prog i').style.setProperty('--p', (2 + i) * 20 + '%');
    };
    if (RM) { fill(); return; }
    const out = body.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-40 * dir}px) rotate(${-2 * dir}deg)` }], { duration: 170, easing: 'ease-in' });
    out.onfinish = () => { fill(); body.animate([{ opacity: 0, transform: `translateX(${50 * dir}px) rotate(${3 * dir}deg)` }, { opacity: 1, transform: 'none' }], { duration: 520, easing: SPRING }); play(`en/${w.w}.mp3`); };
  }

  document.addEventListener('click', e => {
    const t = e.target.closest('button,a'); if (!t) return;
    if (t.matches('[data-spring]') || t.matches('.chip')) anim(t, [{ transform: 'scale(1)' }, { transform: 'scale(1.18) rotate(-6deg)' }, { transform: 'scale(.94)' }, { transform: 'none' }], { duration: 520, easing: EASE });
    if (t.dataset.go) { e.preventDefault(); if (t.dataset.go === 'card' && cur && cur.id === 'win') { wi = 0; setWord(0, 1); } show(t.dataset.go, 'back' in t.dataset); return; }
    if (t.matches('.review .tabs a')) { e.preventDefault(); show(t.hash.slice(1)); return; }
    if (t.dataset.audio) { play(t.dataset.audio); anim(t, [{ transform: 'scale(1)' }, { transform: 'scale(1.15)' }, { transform: 'none' }], { duration: 420, easing: SPRING }); }
    if (t.dataset.toast) toast(t.dataset.toast);
    if ('speed' in t.dataset) {
      const R = [1, 1.25, 0.75], L = { 1: '1×', 1.25: '快', 0.75: '慢' };
      rate = R[(R.indexOf(rate) + 1) % R.length]; $$('[data-speed] b').forEach(b => b.textContent = L[rate]); if (au) au.playbackRate = rate;
      toast(rate === 1 ? '正常语速' : rate > 1 ? '快一点' : '慢一点，听清楚');
    }
    if ('next' in t.dataset) { if (wi < window.RB_WORDS.length - 1) setWord(++wi, 1); else show('quiz'); }
    if ('prev' in t.dataset) { if (wi > 0) setWord(--wi, -1); else anim($('[data-word]'), [{ transform: 'translateX(0)' }, { transform: 'translateX(14px)' }, { transform: 'translateX(-6px)' }, { transform: 'none' }], { duration: 380, easing: EASE }); }
    if ('mic' in t.dataset) {
      if (t.classList.contains('listen')) return;
      t.classList.add('listen'); play(`en/${window.RB_WORDS[wi].w}.mp3`);
      setTimeout(() => { t.classList.remove('listen'); toast('念得好响亮！老师听见啦'); const r = t.getBoundingClientRect(); confetti($('#app'), r.left + r.width / 2, r.top, 18, .6); }, 2200);
    }
    if (t.classList.contains('opt')) {
      const box = t.closest('.opts'); if (box.dataset.done) return;
      if (t.dataset.ans === box.dataset.answer) {
        box.dataset.done = 1; t.classList.add('right');
        anim(t, [{ transform: 'scale(1)' }, { transform: 'scale(1.12) rotate(-3deg)' }, { transform: 'scale(.97)' }, { transform: 'none' }], { duration: 600, easing: EASE });
        const r = t.getBoundingClientRect(); confetti($('#app'), r.left + r.width / 2, r.top + r.height / 2, 26, .7);
        setTimeout(() => { delete box.dataset.done; show('win'); }, RM ? 300 : 750);
      } else {
        t.classList.add('wrong'); $(`.opt[data-ans="${box.dataset.answer}"]`, box).classList.add('hint');
        anim(t, [{ transform: 'translateX(0)' }, { transform: 'translateX(-10px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(-4px)' }, { transform: 'none' }], { duration: 420, easing: 'ease-out' });
        play('en/cat.mp3'); setTimeout(() => t.classList.remove('wrong'), 900);
      }
    }
  });

  const first = (location.hash || '#home').slice(1);
  show(document.getElementById(first) ? first : 'home');
  addEventListener('hashchange', () => show(location.hash.slice(1)));
})();
