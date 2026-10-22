// 右脑记单词 · 离线秒开（service worker）
// 页面：先走网络（3 秒没回就用缓存），保证总是新版；音频 / 动画 / 图片：先用缓存，没有再下载并存起来。
// 不碰 /api、/admin、/preview、报告页 —— preview 页永不进离线首页缓存、跨域请求 —— 登录状态和学习记录永远直接走服务器。
const VERSION = '971986ea88';          // tools/stamp_sw.py 按页面内容自动生成
const MEDIA_VERSION = 'cde656817d';      // 按音视频/图片文件清单生成：文件不变，缓存就一直留着
const CORE = 'rb-core-' + VERSION, MEDIA = 'rb-media-' + MEDIA_VERSION;
const PRECACHE = {"core": ["./", "manifest.webmanifest"], "media": ["assets/wechat-qr.png", "audio/praise/all01.mp3", "audio/praise/all02.mp3", "audio/praise/all03.mp3", "audio/praise/all04.mp3", "audio/praise/all05.mp3", "audio/praise/all06.mp3", "audio/praise/comeback01.mp3", "audio/praise/comeback02.mp3", "audio/praise/comeback03.mp3", "audio/praise/comeback04.mp3", "audio/praise/comeback05.mp3", "audio/praise/comeback06.mp3", "audio/praise/comeback07.mp3", "audio/praise/encourage01.mp3", "audio/praise/encourage02.mp3", "audio/praise/encourage03.mp3", "audio/praise/encourage04.mp3", "audio/praise/encourage05.mp3", "audio/praise/encourage06.mp3", "audio/praise/fast01.mp3", "audio/praise/fast02.mp3", "audio/praise/fast03.mp3", "audio/praise/fast04.mp3", "audio/praise/fast05.mp3", "audio/praise/fast06.mp3", "audio/praise/first01.mp3", "audio/praise/first02.mp3", "audio/praise/first03.mp3", "audio/praise/first04.mp3", "audio/praise/first05.mp3", "audio/praise/first06.mp3", "audio/praise/first07.mp3", "audio/praise/first08.mp3", "audio/praise/gift01.mp3", "audio/praise/gift02.mp3", "audio/praise/gift03.mp3", "audio/praise/repeat01.mp3", "audio/praise/repeat02.mp3", "audio/praise/repeat03.mp3", "audio/praise/repeat04.mp3", "audio/praise/repeat05.mp3", "audio/praise/repeat06.mp3", "audio/praise/round01.mp3", "audio/praise/round02.mp3", "audio/praise/round03.mp3", "audio/praise/round04.mp3", "audio/praise/round05.mp3", "audio/praise/round06.mp3", "audio/praise/shiny01.mp3", "audio/praise/shiny02.mp3", "audio/praise/streak301.mp3", "audio/praise/streak302.mp3", "audio/praise/streak303.mp3", "audio/praise/streak304.mp3", "audio/praise/streak305.mp3", "audio/praise/streak306.mp3", "audio/praise/streak501.mp3", "audio/praise/streak502.mp3", "audio/praise/streak503.mp3", "audio/praise/streak504.mp3", "audio/praise/streak505.mp3", "audio/praise/streak506.mp3", "audio/repeat/rp_again1.mp3", "audio/repeat/rp_again2.mp3", "audio/repeat/rp_exact1.mp3", "audio/repeat/rp_exact2.mp3", "audio/repeat/rp_intro1.mp3", "audio/repeat/rp_intro2.mp3", "audio/repeat/rp_intro3.mp3", "audio/repeat/rp_louder1.mp3", "audio/repeat/rp_louder2.mp3", "audio/repeat/rp_mic1.mp3", "audio/repeat/rp_skip1.mp3", "audio/repeat/rp_tap1.mp3", "audio/sfx/big.mp3", "audio/sfx/cheer.mp3", "audio/sfx/chest.mp3", "audio/sfx/sparkle.mp3", "audio/ui/again.mp3", "audio/ui/allright.mp3", "audio/ui/close.mp3", "audio/ui/done.mp3", "audio/ui/g_again.mp3", "audio/ui/g_balloon.mp3", "audio/ui/g_cap.mp3", "audio/ui/g_done.mp3", "audio/ui/g_hello.mp3", "audio/ui/g_hint.mp3", "audio/ui/g_listen.mp3", "audio/ui/g_locked.mp3", "audio/ui/g_match.mp3", "audio/ui/g_memory.mp3", "audio/ui/g_next.mp3", "audio/ui/g_pick.mp3", "audio/ui/g_pop.mp3", "audio/ui/g_train.mp3", "audio/ui/g_whack.mp3", "audio/ui/g_wrong.mp3", "audio/ui/great1.mp3", "audio/ui/great2.mp3", "audio/ui/great3.mp3", "audio/ui/hello.mp3", "audio/ui/hintme.mp3", "audio/ui/letterq.mp3", "audio/ui/limit.mp3", "audio/ui/next.mp3", "audio/ui/notyet.mp3", "audio/ui/p2case.mp3", "audio/ui/p2miss.mp3", "audio/ui/p2pic.mp3", "audio/ui/p3again.mp3", "audio/ui/p3done.mp3", "audio/ui/pass.mp3", "audio/ui/pass2.mp3", "audio/ui/pass3.mp3", "audio/ui/passrelearn.mp3", "audio/ui/redo.mp3", "audio/ui/redook.mp3", "audio/ui/relearn.mp3", "audio/ui/rest.mp3", "audio/ui/rest_done.mp3", "audio/ui/retry.mp3", "audio/ui/review.mp3", "audio/ui/reviewdone.mp3", "audio/ui/rounddone.mp3", "audio/ui/roundnext.mp3", "audio/ui/soundq.mp3", "audio/ui/start.mp3", "audio/ui/sticker.mp3", "audio/ui/tryok.mp3", "audio/ui/which.mp3", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "img/stickers/apple.webp", "img/stickers/balloon.webp", "img/stickers/banana.webp", "img/stickers/bear.webp", "img/stickers/bunny.webp", "img/stickers/carrot.webp", "img/stickers/cat.webp", "img/stickers/cloud.webp", "img/stickers/crown.webp", "img/stickers/cupcake.webp", "img/stickers/donut.webp", "img/stickers/duck.webp", "img/stickers/elephant.webp", "img/stickers/fox.webp", "img/stickers/frog.webp", "img/stickers/icecream.webp", "img/stickers/koala.webp", "img/stickers/lion.webp", "img/stickers/monkey.webp", "img/stickers/moon.webp", "img/stickers/owl.webp", "img/stickers/panda.webp", "img/stickers/penguin.webp", "img/stickers/puppy.webp", "img/stickers/rainbow.webp", "img/stickers/rocket.webp", "img/stickers/star.webp", "img/stickers/strawberry.webp", "img/stickers/sun.webp", "img/stickers/tiger.webp", "img/stickers/watermelon.webp", "img/stickers/whale.webp"]};
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CORE).then(c => c.addAll(PRECACHE.core)).then(() => caches.open(MEDIA)).then(c => Promise.all(PRECACHE.media.map(u => c.match(u).then(hit => hit || c.add(u).catch(() => {}))))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('rb-') && k !== CORE && k !== MEDIA).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const skip = u => u.origin !== location.origin || /\/(api|admin)(\/|$)/.test(u.pathname) || /\/preview(\/|$)/.test(u.pathname) || /report/.test(u.pathname) || u.pathname.endsWith('/sw.js');
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
