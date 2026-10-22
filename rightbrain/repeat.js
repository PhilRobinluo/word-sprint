/* 跟读引擎（2026-10-22）：第一层 = 麦克风音量检测（出声就算），第二层 = 浏览器语音识别（有就用，宽松比对）。
   录音只放在内存里给「听听我自己」用，不上传、不保存；每次跟读完立刻关麦克风。 */
(() => {
  const W = window, N = navigator;
  const SR = W.SpeechRecognition || W.webkitSpeechRecognition;
  let AC = null;
  const ctx = () => { if (!AC) { const C = W.AudioContext || W.webkitAudioContext; if (!C) return null; AC = new C(); } if (AC.state === 'suspended') AC.resume().catch(() => {}); return AC; };
  const supported = () => !!(N.mediaDevices && N.mediaDevices.getUserMedia) && !!(W.AudioContext || W.webkitAudioContext);
  async function permission() { try { const r = await N.permissions.query({ name: 'microphone' }); return r.state; } catch (e) { return 'unknown'; } }

  async function open() {
    if (!supported()) { const e = new Error('no mic api'); e.name = 'NotSupportedError'; throw e; }
    const stream = await N.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    const ac = ctx(), src = ac.createMediaStreamSource(stream), an = ac.createAnalyser();
    an.fftSize = 1024; src.connect(an);
    const buf = new Float32Array(an.fftSize);
    const rms = () => { an.getFloatTimeDomainData(buf); let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i]; return Math.sqrt(s / buf.length); };
    let closed = false, stopFn = null, noise = 0.01;
    const mic = {
      stream,
      level: rms,
      // 环境噪音校准：静静听一会儿，取平均音量当底噪
      calibrate(ms = 450) {
        return new Promise(res => { const v = []; const t = setInterval(() => { v.push(rms()); }, 30); setTimeout(() => { clearInterval(t); v.sort((a, b) => a - b); noise = v.length ? v[Math.floor(v.length * 0.6)] : 0.01; res(noise); }, ms); });
      },
      get threshold() { return Math.min(0.05, Math.max(0.012, noise * 3)); },
      // 听孩子念：o.silenceMs 内一直没出声 → silent；出声累计 ≥ o.voiceMs 后，安静 o.tailMs 或到 o.maxMs 就算念完
      listen(o = {}) {
        const silenceMs = o.silenceMs || 5000, voiceMs = o.voiceMs || 200, tailMs = o.tailMs || 800, maxMs = o.maxMs || 4000, ignoreMs = o.ignoreMs || 250;
        const thr = mic.threshold;
        let rec = null, chunks = [], asr = null, asrRes = null, asrErr = null;
        try { if (W.MediaRecorder && o.record !== false) { rec = new MediaRecorder(stream); rec.ondataavailable = e => e.data && e.data.size && chunks.push(e.data); rec.start(); } } catch (e) { rec = null; }
        if (o.asr && SR) {
          try {
            asr = new SR(); asr.lang = o.asr.lang || 'en-US'; asr.interimResults = false; asr.maxAlternatives = 5; asr.continuous = false;
            asr.onresult = e => { const alts = []; for (const r of e.results) for (let i = 0; i < r.length; i++) alts.push(r[i].transcript); asrRes = alts; };
            asr.onerror = e => { asrErr = e.error || 'error'; };
            asr.start();
          } catch (e) { asrErr = 'start-failed'; asr = null; }
        }
        return new Promise(res => {
          const t0 = Date.now(); let voiced = 0, startAt = 0, lastVoice = 0, peak = 0, done = false;
          const finish = heard => {
            if (done) return; done = true; clearInterval(iv); stopFn = null;
            const stopRec = () => new Promise(r => { if (!rec || rec.state === 'inactive') return r(null); rec.onstop = () => r(chunks.length ? new Blob(chunks, { type: rec.mimeType || 'audio/webm' }) : null); try { rec.stop(); } catch (e) { r(null); } });
            const waitAsr = () => new Promise(r => { if (!asr || !heard) { try { asr && asr.abort(); } catch (e) {} return r(); } try { asr.stop(); } catch (e) {} const t1 = Date.now(); const k = setInterval(() => { if (asrRes || asrErr || Date.now() - t1 > 2200) { clearInterval(k); r(); } }, 60); });
            Promise.all([stopRec(), waitAsr()]).then(([blob]) => res({ heard, cancelled: heard === null, ms: startAt ? (lastVoice || Date.now()) - startAt : 0, peak, thr, blob, asr: asr ? { alts: asrRes, error: asrErr } : null }));
          };
          stopFn = () => finish(null);
          const iv = setInterval(() => {
            const now = Date.now(), el = now - t0, v = rms(); peak = Math.max(peak, v);
            if (o.onLevel) o.onLevel(Math.min(1, v / (thr * 3)), v > thr);
            if (el < ignoreMs) return;
            if (v > thr) { voiced += 50; lastVoice = now; if (!startAt && voiced >= voiceMs) startAt = now; if (o.onVoice && voiced === 50) o.onVoice(); }
            else if (!startAt && voiced > 0) voiced = Math.max(0, voiced - 25);
            if (startAt && (now - lastVoice > tailMs || now - startAt > maxMs)) finish(true);
            else if (!startAt && el > silenceMs) finish(false);
          }, 50);
        });
      },
      cancel() { if (stopFn) stopFn(); },
      close() { if (closed) return; closed = true; mic.cancel(); try { src.disconnect(); } catch (e) {} stream.getTracks().forEach(t => t.stop()); }
    };
    return mic;
  }

  // ---------- 第二层：宽松比对 ----------
  const NAMES = { a: 'a ay eh hey hay', b: 'b be bee bea', c: 'c see sea she si', d: 'd dee the', e: 'e ee he', f: 'f ef eff if', g: 'g gee ji jee', h: 'h aitch age each edge eight', i: 'i eye aye hi', j: 'j jay jade', k: 'k kay ok okay cake ca', l: 'l el elle all ell', m: 'm em am um', n: 'n en in and an', o: 'o oh owe', p: 'p pee pea pe', q: 'q queue cue cute kew', r: 'r are our ar or', s: 's es ess yes', t: 't tea tee ti', u: 'u you yu ew', v: 'v vee we be', w: 'w double doubleu doubleyou', x: 'x ex eggs ax', y: 'y why wi wai', z: 'z zee zed ze see' };
  const lev = (a, b) => { const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i]); for (let j = 1; j <= n; j++) d[0][j] = j; for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; };
  const toks = s => String(s || '').toLowerCase().replace(/[^a-z' ]+/g, ' ').split(/\s+/).filter(Boolean);
  function match(target, type, alts) {
    const t = String(target || '').toLowerCase().trim(); if (!t || !alts || !alts.length) return false;
    for (const alt of alts) {
      const ws = toks(alt); if (!ws.length) continue;
      if (type === 'letter') { const ok = (NAMES[t] || t).split(' '); if (ws.some(w => ok.includes(w)) || ws.join('') === t) return true; continue; }
      const tol = t.length <= 3 ? 1 : 2;
      if (ws.some(w => w === t || lev(w, t) <= tol || (w.length > 3 && w.startsWith(t)))) return true;
      if (lev(ws.join(''), t) <= tol) return true;
    }
    return false;
  }
  W.RBR = { supported, permission, open, match, asrAvailable: () => !!SR, ctx };
})();
