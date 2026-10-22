# 跟读打分方案调研（2026-10-22，待 Phil 选）

现在线上用的是**免费、无需后台**的两层：第一层 = 麦克风音量检测（出声就算）；第二层 = 浏览器自带语音识别（Chrome / Safari 的 Web Speech API，宽松比对）。第二层在国内 Chrome 上通常连不上 Google 服务，会自动退回第一层；iPhone Safari 一般能用。若要「真打分」（音素级准确度），可选下面几种：

| 方案 | 价格（官方页，2026-10 查） | 账号 / 企业 / 备案要求 | 体积 / 部署 | 质量（儿童英语单词） | 链接 |
|---|---|---|---|---|---|
| 腾讯云 智聆口语评测（新版） | 后付费 0.005 元/次（5 元/千次）；资源包 1 万次 9.9 元（限购 1 个）、15 万次 600 元；≤20 个单词算 1 次；并发 50 以内免费 | 腾讯云实名账号即可开通（个人实名可用）；密钥必须放服务器（我们的 Cloudflare Worker 可代签名）；调用 API 不需要 ICP 备案，备案只针对国内服务器建站 | 云端 API，前端只录音上传 | 有单词/句子/音素评分、儿童模式，国内教育产品常用 | https://cloud.tencent.com/document/product/1774/107342 |
| 阿里云 口语评测（智能科教内容生成平台） | 英文评测按并发：4.25 元/并发/天、85 元/并发/月、1020 元/并发/年；也有按量 | 阿里云实名账号；同样需要服务器端鉴权 | 云端 API + SDK（含小程序） | 有「儿童英语单词」题型（10 岁以下）、音素级、phonics | https://help.aliyun.com/document_detail/2996335.html · https://help.aliyun.com/en/document_detail/2996297.html |
| 讯飞 语音评测（流式版 ise） | 创建应用后默认每日 500 次免费；新用户包 10 万次 3 个月；付费套餐 10 万/20 万/100 万次（价格需登录看） | 讯飞开放平台实名（个人/企业都可）；WebSocket 需要服务器签名 | 云端 API | 国内老牌，中小学英语听说考试同源技术 | https://www.xfyun.cn/doc/Ise/IseAPI.html · https://global.xfyun.cn/products/ise |
| Whisper tiny.en（浏览器本地，Transformers.js） | 免费（Apache/MIT） | 无账号、无数据外传 | 下载约 39 MB（WASM uint8）/ 73 MB（WebGPU fp16），首次加载慢，老手机吃力 | 只是识别不是打分；对孩子短单词/字母名不稳（我们给字母音频自测时就不稳定） | https://localmodel.run/browser/whisper-tiny · https://huggingface.co/Xenova/whisper-tiny.en |
| Vosk small en-us 0.15（浏览器 WASM：vosk-browser） | 免费（Apache 2.0） | 无账号、无数据外传；模型要放同域名 | 模型 40 MB，运行内存约 300 MB；可限定词表（只认本课单词）提高命中 | 识别不是打分；限定词表后做「念对没念对」够用，音素级不行 | https://alphacephei.com/vosk/models · https://github.com/ccoreilly/vosk-browser |

建议：先用现在的免费两层收集一段时间家长反馈；如果要「念得准不准」的分数，首选**腾讯智聆**（1 万次 9.9 元试水、个人实名即可、按次便宜），由 Worker 代签名，录音只在评测时上传。本地模型（Whisper/Vosk）体积对小朋友的手机不友好，不建议默认开启。
