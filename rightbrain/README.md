# 右脑记单词 · 一年级入门版（starter-42-20261011）

在线：https://philrobinluo.github.io/word-sprint/rightbrain/ （家长/老师页：长按「家长」1.2 秒，或加 `?parent=1`）

## 内容
- 字母小乐园：26 个字母，按 phonics 顺序分 4 组（s a t p i n / c k e h r m d / g o u l f b / j z w v y x q）。每个字母有名称、真实拼读音（可点 🔊 再听）、形状故事、中文发音提示和一个看动画按钮。
- 拼读小词：40 个 CVC 词，5 个短元音都覆盖。学完相应字母组后才解锁。每个词有插图、拼读播报（c · a · t → cat）和拼读动画。
- 记忆单词：42 个（一年级 33 个，三四年级 9 个），都有插图、播报和动画。只有 Phil 认可过的 5 个标「已认可」，其余一律「待审」。
- 测验选项用统一风格的简笔图标（img/icons），和学习卡上的完整场景图不同。
- 复习：答对的按 1/3/7/14/30 天的间隔自动安排复习，答错的第二天复习。错题先看卡再考，其余直接考。每天只做一次例行复习，不挡住学新内容；错题始终优先。
- 家长页：本周小结（天数、轮数、新学数、一次答对率、易错项）、选内容、10 秒测试、内容审稿和声音来源与许可。

## 生成流程（tools/）
`build_content.py` → `make_audio.py`（edge-tts 旁白 + audio/phon 拼读音 → 时间轴 cues）→ `node test/raster.mjs`（场景栅格化）→ `make_video.py`（720x1280 动画）→ `node tools/embed-content.mjs`（把内容内置进 index.html）。
`make_phonics.py` 负责生成 audio/phon/*.mp3 和 content/phonics_credits.json；`icons.py` 生成测验图标；`scenes.py` / `scenes2.py` 生成场景插图。
测试：`cd test && npm i && node syntax.mjs && node smoke.mjs && node shots.mjs`。

## 拼读音的来源与许可（audio/phon）
大部分是 Wikimedia Commons 上的 IPA 示例录音，许可 CC BY-SA 3.0。辅音原录音多是「[Ca aCa]」，这里只截取第一个音节里的辅音。
所有声音都做过截取、去静音和音量归一。持续音（如 s、m）用交叉淡化拼接延长到约 0.45 秒以上。改动后的音频按同样的 CC BY-SA 3.0 授权。
p / f / r / v 在 Commons 上没找到能干净截出来的录音，改用 Microsoft Edge 在线语音（en-US-AnaNeural）读真实单词后截取：p 和 f 取词首，r 取词首，v 取 five 的词尾。c 和 k 用同一段音。x 由 k＋s 拼接，q 由 k＋w 拼接。
每个音都做过时长、起音、浊音比例和过零率检查，数据见 content/phonics_credits.json。

| 字母 | 音 | 来源 | 许可 | 作者 |
|---|---|---|---|---|
| a | /æ/ | [Wikimedia Commons “File:Near-open front unrounded vowel.ogg”](https://commons.wikimedia.org/wiki/File:Near-open_front_unrounded_vowel.ogg) | CC BY-SA 3.0 | No machine-readable author provided. Denelson83 assumed (based on copyright claims). |
| b | /b/ | [Wikimedia Commons “File:Voiced bilabial plosive.ogg”](https://commons.wikimedia.org/wiki/File:Voiced_bilabial_plosive.ogg) | CC BY-SA 3.0 | 见文件页（Commons 未提供机器可读作者） |
| c | /k/ | [Wikimedia Commons “File:Voiceless velar plosive.ogg”](https://commons.wikimedia.org/wiki/File:Voiceless_velar_plosive.ogg) | CC BY-SA 3.0 | 见文件页（Commons 未提供机器可读作者） |
| d | /d/ | [Wikimedia Commons “File:Voiced alveolar plosive.ogg”](https://commons.wikimedia.org/wiki/File:Voiced_alveolar_plosive.ogg) | CC BY-SA 3.0 | 见文件页（Commons 未提供机器可读作者） |
| e | /ɛ/ | [Wikimedia Commons “File:Open-mid front unrounded vowel.ogg”](https://commons.wikimedia.org/wiki/File:Open-mid_front_unrounded_vowel.ogg) | CC BY-SA 3.0 | No machine-readable author provided. Denelson83 assumed (based on copyright claims). |
| f | /f/ | Microsoft Edge TTS en-US-AnaNeural 读 “fan”，截取词首辅音 | 本项目生成（TTS 输出） | — |
| g | /ɡ/ | [Wikimedia Commons “File:Voiced velar plosive.ogg”](https://commons.wikimedia.org/wiki/File:Voiced_velar_plosive.ogg) | CC BY-SA 3.0 | 见文件页（Commons 未提供机器可读作者） |
| h | /h/ | [Wikimedia Commons “File:Voiceless glottal fricative.ogg”](https://commons.wikimedia.org/wiki/File:Voiceless_glottal_fricative.ogg) | CC BY-SA 3.0 | 见文件页（Commons 未提供机器可读作者） |
| i | /ɪ/ | [Wikimedia Commons “File:Near-close near-front unrounded vowel.ogg”](https://commons.wikimedia.org/wiki/File:Near-close_near-front_unrounded_vowel.ogg) | CC BY-SA 3.0 | No machine-readable author provided. Denelson83 assumed (based on copyright claims). |
| j | /dʒ/ | [Wikimedia Commons “File:Voiced palato-alveolar affricate.ogg”](https://commons.wikimedia.org/wiki/File:Voiced_palato-alveolar_affricate.ogg) | Public domain | The original uploader was Octane at English Wikipedia. |
| k | /k/ | [Wikimedia Commons “File:Voiceless velar plosive.ogg”](https://commons.wikimedia.org/wiki/File:Voiceless_velar_plosive.ogg) | CC BY-SA 3.0 | 见文件页（Commons 未提供机器可读作者） |
| l | /l/ | [Wikimedia Commons “File:Alveolar lateral approximant.ogg”](https://commons.wikimedia.org/wiki/File:Alveolar_lateral_approximant.ogg) | CC BY-SA 3.0 | 见文件页（Commons 未提供机器可读作者） |
| m | /m/ | [Wikimedia Commons “File:Bilabial nasal.ogg”](https://commons.wikimedia.org/wiki/File:Bilabial_nasal.ogg) | CC BY-SA 3.0 | 见文件页（Commons 未提供机器可读作者） |
| n | /n/ | [Wikimedia Commons “File:Alveolar nasal.ogg”](https://commons.wikimedia.org/wiki/File:Alveolar_nasal.ogg) | CC BY-SA 3.0 | 见文件页（Commons 未提供机器可读作者） |
| o | /ɑ/ | [Wikimedia Commons “File:Open back unrounded vowel.ogg”](https://commons.wikimedia.org/wiki/File:Open_back_unrounded_vowel.ogg) | CC BY-SA 3.0 | No machine-readable author provided. Denelson83 assumed (based on copyright claims). |
| p | /p/ | Microsoft Edge TTS en-US-AnaNeural 读 “pan”，截取词首辅音 | 本项目生成（TTS 输出） | — |
| q | /kw/ | 由 k ＋ w 两段拼接 | 同 k、w | — |
| r | /ɹ/ | Microsoft Edge TTS en-US-AnaNeural 读 “red”，截取词首辅音 | 本项目生成（TTS 输出） | — |
| s | /s/ | [Wikimedia Commons “File:Voiceless alveolar sibilant.ogg”](https://commons.wikimedia.org/wiki/File:Voiceless_alveolar_sibilant.ogg) | CC BY-SA 3.0 | Peter Isotalo |
| t | /t/ | [Wikimedia Commons “File:Voiceless alveolar plosive.ogg”](https://commons.wikimedia.org/wiki/File:Voiceless_alveolar_plosive.ogg) | CC BY-SA 3.0 | 见文件页（Commons 未提供机器可读作者） |
| u | /ʌ/ | [Wikimedia Commons “File:Open-mid back unrounded vowel.ogg”](https://commons.wikimedia.org/wiki/File:Open-mid_back_unrounded_vowel.ogg) | CC BY-SA 3.0 | No machine-readable author provided. Denelson83 assumed (based on copyright claims). |
| v | /v/ | Microsoft Edge TTS en-US-AnaNeural 读 “five”，截取词尾辅音 | 本项目生成（TTS 输出） | — |
| w | /w/ | [Wikimedia Commons “File:Voiced labio-velar approximant.ogg”](https://commons.wikimedia.org/wiki/File:Voiced_labio-velar_approximant.ogg) | CC BY-SA 3.0 | 见文件页（Commons 未提供机器可读作者） |
| x | /ks/ | 由 k ＋ s 两段拼接 | 同 k、s | — |
| y | /j/ | [Wikimedia Commons “File:Palatal approximant.ogg”](https://commons.wikimedia.org/wiki/File:Palatal_approximant.ogg) | CC BY-SA 3.0 | 见文件页（Commons 未提供机器可读作者） |
| z | /z/ | [Wikimedia Commons “File:Voiced alveolar sibilant.ogg”](https://commons.wikimedia.org/wiki/File:Voiced_alveolar_sibilant.ogg) | CC BY-SA 3.0 | 见文件页（Commons 未提供机器可读作者） |

中文旁白和英文单词播报：Microsoft Edge 在线语音合成（edge-tts；zh-CN-XiaoxiaoNeural、en-US-AnaNeural）。
插图、图标和动画都是本项目自己画、自己渲染的；英文字体 Fredoka（OFL），中文字体 Noto Sans CJK（OFL），音标字体 DejaVu Sans。
