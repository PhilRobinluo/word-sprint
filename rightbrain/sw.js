// 右脑记单词 · 离线秒开（service worker）
// 页面：先走网络（3 秒没回就用缓存），保证总是新版；音频 / 动画 / 图片：先用缓存，没有再下载并存起来。
// 不碰 /api、/admin、报告页、跨域请求 —— 登录状态和学习记录永远直接走服务器。
const VERSION = '3d060be3e5';          // tools/stamp_sw.py 按页面内容自动生成
const MEDIA_VERSION = '7728d8fe2c';      // 按音视频/图片文件清单生成：文件不变，缓存就一直留着
const CORE = 'rb-core-' + VERSION, MEDIA = 'rb-media-' + MEDIA_VERSION;
const PRECACHE = {"core": ["./", "manifest.webmanifest"], "media": ["assets/wechat-qr.png", "audio/ui/again.mp3", "audio/ui/allright.mp3", "audio/ui/close.mp3", "audio/ui/done.mp3", "audio/ui/great1.mp3", "audio/ui/great2.mp3", "audio/ui/great3.mp3", "audio/ui/hello.mp3", "audio/ui/letterq.mp3", "audio/ui/limit.mp3", "audio/ui/next.mp3", "audio/ui/notyet.mp3", "audio/ui/p2case.mp3", "audio/ui/p2miss.mp3", "audio/ui/p2pic.mp3", "audio/ui/p3again.mp3", "audio/ui/p3done.mp3", "audio/ui/pass.mp3", "audio/ui/pass2.mp3", "audio/ui/pass3.mp3", "audio/ui/rest.mp3", "audio/ui/rest_done.mp3", "audio/ui/retry.mp3", "audio/ui/review.mp3", "audio/ui/reviewdone.mp3", "audio/ui/rounddone.mp3", "audio/ui/roundnext.mp3", "audio/ui/soundq.mp3", "audio/ui/start.mp3", "audio/ui/sticker.mp3", "audio/ui/tryok.mp3", "audio/ui/which.mp3", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png"]};
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CORE).then(c => c.addAll(PRECACHE.core)).then(() => caches.open(MEDIA)).then(c => Promise.all(PRECACHE.media.map(u => c.match(u).then(hit => hit || c.add(u).catch(() => {}))))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('rb-') && k !== CORE && k !== MEDIA).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const skip = u => u.origin !== location.origin || /\/(api|admin)(\/|$)/.test(u.pathname) || /report/.test(u.pathname) || u.pathname.endsWith('/sw.js');
const isMedia = u => /\.(mp3|m4a|mp4|webm|png|jpe?g|webp|gif|svg)$/i.test(u.pathname);
async function slice(req, res){
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  if (!m) return res;
  const buf = await res.arrayBuffer(), size = buf.byteLength;
  let start = m[1] === '' ? Math.max(0, size - +m[2]) : +m[1], end = m[1] !== '' && m[2] !== '' ? Math.min(+m[2], size - 1) : size - 1;
  if (start >= size) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  return new Response(buf.slice(start, end + 1), { status: 206, headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/octet-stream', 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' } });
}
async function media(req, url){
  const c = await caches.open(MEDIA), key = url.origin + url.pathname, hit = await c.match(key);
  if (hit) return slice(req, hit);
  if (req.headers.has('range')) {   // 边播边下：这次直接走网络，后台把整个文件存起来，下次秒开
    fetch(key).then(r => { if (r.ok && r.status === 200) c.put(key, r); }).catch(() => {});
    return fetch(req);
  }
  const r = await fetch(key);
  if (r.ok && r.status === 200) c.put(key, r.clone());
  return r;
}
async function page(req){
  const c = await caches.open(CORE);
  const net = fetch(req).then(r => { if (r.ok && r.status === 200 && !r.redirected) c.put(req.mode === 'navigate' ? './' : req, r.clone()); return r; });
  const timeout = new Promise(res => setTimeout(res, 3000));
  try { const r = await Promise.race([net, timeout]); if (r) return r; } catch (e) {}
  const hit = await c.match(req.mode === 'navigate' ? './' : req, { ignoreSearch: true });
  return hit || net;
}
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (skip(url)) return;
  if (isMedia(url)) { e.respondWith(media(req, url)); return; }
  if (req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname) || /\.(json|webmanifest)$/.test(url.pathname)) { e.respondWith(page(req)); return; }
});
