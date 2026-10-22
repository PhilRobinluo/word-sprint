# 右脑记单词 · 一年级入门版（starter-42-20261011）

在线：https://philrobinluo.github.io/word-sprint/rightbrain/ （家长/老师页：长按「家长」1.2 秒，或加 `?parent=1`）

## 访问地址与部署（2026-10-16）

- 正式地址（国内优先用这个）：https://word.luolaoshi.club/ —— Cloudflare Worker `rightbrain-api` 的自定义域名，同一个 Worker 托管网站静态文件和 API（`/api/*`），管理后台 https://word.luolaoshi.club/admin
- 备用地址：https://philrobinluo.github.io/word-sprint/rightbrain/ （API 走 https://rightbrain-api.philrobin-cloud-mail.workers.dev）；另有 Pages 副本 https://rightbrain.pages.dev/
- 前端自动选 API：在 word.luolaoshi.club 上用同域 `/api`，其他地方用 workers.dev（`?api=home` 可强制走 word.luolaoshi.club）。
- 更新网站：把本目录（不含 README）放到 Mac `~/rightbrain-api/site/`，在 `~/rightbrain-api` 里运行 `npx wrangler deploy`；GitHub Pages 照常 push。
- 账号：家长先注册/登录，再输入兑换码（码绑定到账号，最多 2 台设备）；进度跟着账号同步。学习流程：每组新内容 3 轮（第1轮学+考 → 第2轮换玩法 → 综合测试，错的重考到对）。

## 2026-10-22 更新（标「待审」的请 Phil 过目）

- **凭码开通账号**：不再开放自由注册。新家长先输兑换码 → 同一页设登录名、密码、孩子昵称、年级，一步开通（服务器端原子操作：失败不消耗兑换码，同一个码并发只能开通一个账号）。老用户直接登录，兑换码只在到期续期时用。
- **找 Phil 老师领兑换码**：入口页 / 输码页 / 到期页都有按钮，弹出微信二维码（`assets/wechat-qr.png` 目前是占位图，**待 Phil 换成真二维码**）。
- **试看**：没登录也能试看前 6 个字母（只看不记录）。
- **手机快速发码**：https://word.luolaoshi.club/admin/quick （用管理密钥登录，一键生成 365 天 / 2 台设备的码，一键复制发微信的话术，下面列出最近发的码和使用情况）。
- **播放器小步快进**：学习卡、速览、动画都有「⏮ 上一步」「下一步 ⏭」（按旁白句子分段跳）和 1× / 1.5× / 2× 倍速（不变调，记在本机）。
- **护眼**：默认护眼浅色（暖纸色底、深褐字）；家长页可选「护眼浅色 / 夜间暗色 / 跟随系统」；用眼休息提醒（累计学 10/15/20 分钟提醒看远处 20 秒，可关）；每日学习时长（15/20/30/45 分钟 / 不限，到点温和收工，家长算一道加法题可延长 15 分钟）。设置跟账号同步。新旁白（休息 / 收工）**待审**。
- **一键开始**：主页正中「▶ 开始学习」，按钮上小字写这一轮要做什么（如「复习 5 个 + 新学 3 个」）。一轮 = 先复习到期 / 没考完的，再接着路线学新的一组（3 轮 + 综合测试规则不变），全程自动往下走，最后是小结页（复习几个、新学几个、星星），可「再来一轮」。模块入口留在下方自选。一轮的编排规则和过渡 / 小结旁白**待审**。
- **PWA 秒开**：manifest + 图标 + service worker。页面先走网络（3 秒没回用缓存），常用声音 / 图标预缓存，学过的音频 / 动画 / 图片边用边存；新版本上线自动刷新（正在学时等回到主页再刷新）。`/api`、`/admin`、报告页、跨域请求一律不经过缓存。家长页有「添加到手机桌面」图文指引（iPhone Safari / 安卓 / 微信内）。
- **后台 App**：https://word.luolaoshi.club/admin/ （手机竖屏、底部标签：概览 / 发码 / 码 / 用户 / 更多；可「添加到主屏幕」；独立 manifest「右脑后台」+ service worker 只缓存界面壳）。管理密钥输一次记在本机；同一 IP 15 分钟内输错 8 次锁 15 分钟。新接口：`stats`、`user`、`renew-user`（给账号直接加天数）；删除账号会同时停用它用过的码。旧的电脑版表格后台移到 /admin/classic，/admin/quick 保留。
- **安卓 App**：https://word.luolaoshi.club/admin/rightbrain-admin.apk （WebView 外壳，内容远程加载；源码和签名说明在 rightbrain-api/android，不在本仓库）。
- 部署：照旧把本目录拷到 Mac `~/rightbrain-api/site/` 再 `npx wrangler deploy`。本目录的 `sw.js` 已盖好版本号（源码里是模板，用 `tools/stamp_sw.py` 按页面和媒体文件内容生成），每次改页面都要重新盖，否则老用户不会自动更新。

## 2026-10-22 第二批（标「待审」的请 Phil 过目）

- **字母只读字母名**：A /eɪ/、B /biː/ … W /ˈdʌbəl.juː/、Z /ziː/，不再读拼读音。点字母听发音 / 字母卡 / 测验题干 / 字母动画旁白都改了；组合改成「字母名 + 关键词」（如 “A, apple”）；拼读音只留在「拼读小词」。生成：`tools/make_letter_names.py`（en-US-AnaNeural，按英文拼写 "bee" "see" … 念；A / H / I 改用 "A." "H!" "I!"，因为 "ay" 会被念成 /aɪ/），去首尾静音、-16 LUFS；本地 faster-whisper 回听结果在 `content/letter_names_check.json`。26 个字母动画按新旁白重做。试听页：`/preview/letters.html`（免登录）。**待审**。
- **字母 p 新插图**：`img/letters/p.webp`（36 KB，去掉奶油底色）。来源：box 上的 AI 生图，Phil 已选定第 3 版（原图 `content/art-candidates/p-bubble-3.jpg`）。p 的动画重做：大泡泡从圈里慢慢吹出来、变大、飘走。**待审**。
- **错了就重教**：任何一轮（第1/2轮、综合测试、复习、一键开始）答错 → 温和鼓励 →「这个我们再学一遍」重看卡片和讲解 → 换题型再考，答对才算过；一轮结束时错过的词整体再考一遍（「还差 N 个要再练一下」），全对才进下一轮（最多补考 2 次）；一轮错一半以上整轮重学；同一个词连错 3 次给提示（只剩 2 个选项、正确答案发光），记为薄弱词（家长页可见，当天和下次复习优先），靠提示答对不算「记住」。新语音 relearn / hintme / redo / redook / passrelearn **待审**。

## 内容
- 字母小乐园：26 个字母，按 phonics 顺序分 4 组（s a t p i n / c k e h r m d / g o u l f b / j z w v y x q）。每个字母有名称、真实拼读音（可点 🔊 再听）、形状故事、中文发音提示和一个看动画按钮。
- 拼读小词：40 个 CVC 词，5 个短元音都覆盖。学完相应字母组后才解锁。每个词有插图、拼读播报（c · a · t → cat）和拼读动画。
- 记忆单词：42 个（一年级 33 个，三四年级 9 个），都有插图、播报和动画。只有 Phil 认可过的 5 个标「已认可」，其余一律「待审」。
- 测验选项用统一风格的简笔图标（img/icons），和学习卡上的完整场景图不同。
- 复习：答对的按 1/3/7/14/30 天的间隔自动安排复习，答错的第二天复习。错题先看卡再考，其余直接考。每天只做一次例行复习，不挡住学新内容；错题始终优先。
- 家长页：本周小结（天数、轮数、新学数、一次答对率、易错项）、选内容、10 秒测试、内容审稿和声音来源与许可。

## 生成流程（tools/）
`build_content.py` → `make_audio.py`（edge-tts 旁白 + audio/phon 拼读音 → 时间轴 cues）→ `node test/raster.mjs`（场景栅格化）→ `make_video.py`（720x1280 动画）→ `node tools/embed-content.mjs`（把内容内置进 index.html）。
`make_phonics.py` 负责生成 audio/phon/*.mp3、audio/lsay/*.mp3 和 content/phonics_credits.json；`icons.py` 生成测验图标；`scenes.py` / `scenes2.py` 生成场景插图。
测试：`cd test && npm i && node syntax.mjs && node smoke.mjs && node shots.mjs`。

## 字母音（audio/phon、audio/lsay）——2026-10-15 重做
全部用同一个声音：Microsoft Edge 在线语音 en-US-AnaNeural（和讲解里的英文同一个声音），由 `tools/make_phonics.py` 生成。旧的 Wikimedia Commons IPA 录音已全部弃用。
- `audio/lsay/<字母>.mp3`：字母名 … 音 … 音 … 关键词（例：B … b … b … bus）。字母卡上的 🔊、答题后的反馈用它。
- `audio/lsay/<字母>-q.mp3`：音 … 音 … 关键词（不说字母名），字母测验「听声音，是哪个字母？」用它。
- `audio/phon/<字母>.mp3`：单独的音，拼读小词的字母块和拼读讲解用。每个音都从放慢（-40%）读的完整单词里截出来：不循环、不拉长，爆破音不做淡入，元音最长 220 ms。
- r、v、w、q、z 单独截出来太短或不带声（z 听着像 s），字母卡、测验和讲解里改成「字母名 + 关键词」，只有拼读字母块还用截出的短音。
- 响度：组合音频统一到 -16 LUFS（实测 -16.4 ～ -17.4），单音按有声部分 RMS -20 dBFS 对齐，峰值不超过 -1.5 dB。
- 检查：`python3 tools/phonics_check.py`（whisper 转写 + 响度 + 基频）。许可：本项目生成的 TTS 输出。

| 字母 | 音 | 关键词 | 播放方式 | 单音来源 |
|---|---|---|---|---|
| a | /æ/ | apple | 字母名 … 音 … 关键词 | “at” 截 220 ms |
| b | /b/ | bus | 字母名 … 音 … 关键词 | “bus” 截 70 ms |
| c | /k/ | cat | 字母名 … 音 … 关键词 | “cat” 截 160 ms |
| d | /d/ | dog | 字母名 … 音 … 关键词 | “dog” 截 70 ms |
| e | /ɛ/ | egg | 字母名 … 音 … 关键词 | “egg” 截 220 ms |
| f | /f/ | fish | 字母名 … 音 … 关键词 | “fan” 截 110 ms |
| g | /ɡ/ | go | 字母名 … 音 … 关键词 | “go” 截 70 ms |
| h | /h/ | hat | 字母名 … 音 … 关键词 | “hat” 截 220 ms |
| i | /ɪ/ | insect | 字母名 … 音 … 关键词 | “it” 截 160 ms |
| j | /dʒ/ | jet | 字母名 … 音 … 关键词 | “jet” 截 120 ms |
| k | /k/ | kite | 字母名 … 音 … 关键词 | “kite” 截 190 ms |
| l | /l/ | leg | 字母名 … 音 … 关键词 | “leg” 截 100 ms |
| m | /m/ | monkey | 字母名 … 音 … 关键词 | “man” 截 130 ms |
| n | /n/ | nose | 字母名 … 音 … 关键词 | “nap” 截 130 ms |
| o | /ɑ/ | octopus | 字母名 … 音 … 关键词 | “octopus” 截 140 ms |
| p | /p/ | panda | 字母名 … 音 … 关键词 | “pan” 截 150 ms |
| q | /kw/ | queen | 字母名 + 关键词（单音不够干净） | “queen” 截 60 ms |
| r | /ɹ/ | red | 字母名 + 关键词（单音不够干净） | “red” 截 60 ms |
| s | /s/ | snake | 字母名 … 音 … 关键词 | “sun” 截 230 ms |
| t | /t/ | tiger | 字母名 … 音 … 关键词 | “top” 截 160 ms |
| u | /ʌ/ | umbrella | 字母名 … 音 … 关键词 | “up” 截 160 ms |
| v | /v/ | van | 字母名 + 关键词（单音不够干净） | “van” 截 60 ms |
| w | /w/ | window | 字母名 + 关键词（单音不够干净） | “wet” 截 70 ms |
| x | /ks/ | box | 字母名 … 音 … 关键词 | “box” 截 300 ms |
| y | /j/ | yellow | 字母名 … 音 … 关键词 | “yes” 截 130 ms |
| z | /z/ | zip | 字母名 + 关键词（单音不够干净） | “zip” 截 180 ms |

中文旁白和英文单词播报：Microsoft Edge 在线语音合成（edge-tts；zh-CN-XiaoxiaoNeural、en-US-AnaNeural）。
插图、图标和动画都是本项目自己画、自己渲染的；英文字体 Fredoka（OFL），中文字体 Noto Sans CJK（OFL），音标字体 DejaVu Sans。

## 2026-10-22 第三批：夸奖庆祝 + 礼物宝箱贴纸册 + 跟读（全部新素材待审）
- **夸奖**：`content/praise.json` 62 句，按场景分组（一下子答对 / 答得快 / 之前错这次对 / 连对 3 / 连对 5 / 全对 / 跟读响亮 / 完成挑战 / 鼓励 / 礼物 / 闪光），每组洗牌不重复。语音由 `tools/make_voice.py` 生成，全站语音清单 `content/voice_manifest.json`（换 Phil 克隆声音照表重生成）。预览：`/preview/praise.html`。
- **庆祝动画**：`celebrate.js`（4 套轮换 + 小黄怪眨眼跳跃 + 连对 3/5/全对升级烟花、彩虹、金杯），点一下可跳过，尊重减少动态效果；家长页可切「简洁」、关音效。
- **礼物宝箱 + 贴纸册**：完成挑战必得 1 张，先给没有的，每集 5 张普通款解锁 1 张闪光款（共 32 张，6 张闪光），不抽卡；随账号同步；主页「我的贴纸册」，家长页显示收集情况。贴纸图为 box 上 AI 生成。
- **跟读**：学习卡（含答错后的重教卡）讲完后，老师念 → 大麦克风 → 孩子念；出声就夸 +「听听我自己」（录音只在内存）；5 秒没声音提示「大声一点」，两次没声音温和继续；第一次有麦克风引导；不允许 / 没麦克风 →「念完点一下」。家长页：跟读开关、「出声就算 / 听清才算」。打分服务调研见 `docs/repeat-scoring-research.md`。
