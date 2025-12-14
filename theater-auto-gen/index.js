```javascript
import { saveSettingsDebounced } from "../script.js";
import { extension_settings, getContext } from "./extensions.js";
import { generateQuietPrompt } from "../slash-commands.js";
import { callPopup, POPUP_TYPE } from "./popup.js";

const extensionName = "theater-auto-gen";
const defaultSettings = {
enabled: true,
maxRetries: 3,
retryDelay: 2000,
theaterPrompt: `进入分析模式，本次不进行互动式小说创作，而是对<interactive_input>内容做出解答。请按照以下要求生成小剧场，确保生成的小剧场使用<snow></snow>包裹在内，标签外无多余文字：<snow_rules>
通用核心规范：
你会根据故事或上下文嵌入一个 HTML+CSS+JavaScript 深度交互界面。这不仅是文本的载体，更是一个迷你的、可玩的互动装置或伪应用程序。

遵循以下进阶设计规范：
1. 布局与样式 (高性能/高兼容)
-   设计必须是响应式的，UI需无缝适配手机、平板与桌面端
    -   使用 @media 查询、百分比宽度和 max-width（推荐值: 500px-800px）来实现
-   body 标签禁止使用 vh 单位。确保 body 设置 overflow: auto; height: auto
-   body 背景必须设为 transparent，不要设置颜色，以便融入聊天窗口。所有的视觉背景（颜色/纹理/渐变）必须应用在内部的 .container 容器上
-   必须定制沉浸式滚动条样式 (::-webkit-scrollbar)，使其与UI风格统一；或者在无需滚动提示时直接隐藏滚动条 (scrollbar-width: none) 以保持界面整洁
-   严禁使用 transition 属性，所有动态效果必须通过 @keyframes 动画或 JS 切换 class 实现
-   模块必须是单个居中的容器，内部可包含复杂的嵌套结构
-   样式:
    -   标题强制使用 <p class="title-custom">，严禁使用 h1-h4 标签
    -   使用清晰易读的无衬线字体（古风除外），并明确设置 color
    -   视觉风格锚定: 根据内容类型选择最佳 UI 范式
        -   社交/应用类: 采用 Card Layout (卡片式)、Sticky Header (粘性头部)、Bottom Nav (底部导航)
        -   剧情/物品类: 采用 Immersive Object (拟物化)，如信纸折痕、宝箱质感、屏幕裂纹
        -   通用库: Flat UI, Cyber/Terminal, Paper/Handwritten, Pixel Art

2. 动态交互与逻辑模式
-   根据剧场类型，从以下两种交互逻辑中选择一种，严禁生搬硬套：
    -   模式A：聚合应用流 -> 适用于论坛/朋友圈/系统/手机
        -   特征: 单屏展示，多点交互。无需封面和结算页
        -   必须包含: 状态切换 (如点赞图标变色+计数增加)、内容切换 (Tab分页)、或列表追加 (模拟发评论)
        -   细节: 模拟真实APP的反馈，如按钮点击的缩放、红点提示、Toast弹窗
    -   模式B：线性叙事流  -> 适用于拆礼物/小游戏/解谜
        -   特征: 分阶段推进 (封面 -> 互动 -> 结果)
        -   必须包含: 完整的状态机逻辑，用户操作后界面发生不可逆变化
-   防偷懒禁令:
    -   严禁"点击即结束"的伪交互
    -   对于论坛/社交类：必须模拟真实的互动数据（如点赞数随机生成、评论区支持滚动、时间戳真实化）
-   触感反馈: 所有可点击元素必须有 :active 伪类缩放效果 (transform: scale(0.95))

3. 内容与资源
-   禁止引用外部CSS、JS文件或API。所有资源必须按规定生成或声明
-   角色与叙事:
    -   头像: 用文本、符号、下列生图规则在绝对圆形的框内表示角色头像
    -   相关性: 内容必须与char和灵云高度相关
    -   NPC客串: 可包含第三方NPC（如<文末吐槽>）的客串
-   语言与语调:
    -   主要语言: 简体中文
    -   用户名: 在论坛式交互中，创建诙谐的匿名用户名，绝不透露真实角色名
-   资源:
    -   图标：可以从外部网站引入svg图标加强真实性，如Font awesome
    -   图像:
        -   每个模块至少生成一张相关图像并保证居中显示，使用格式 https://image.pollinations.ai/prompt/{关键词}?model=turbo&private=true&nologo=true
        -   关键词需简洁并以 %20 分隔
        -   图像生成关键词核心禁令:
            -  严禁使用任何描述或暗示人类、类人形象或角色的词语
            -  严禁使用任何与外貌或身体部位相关的词语
            -  仅限: 只聚焦于场景、物体、动物、风格和抽象概念
        -   最终图像不得包含任何写实的人类形象
    -   音频:
        - 在合适的模块生成符合要求的交互音效
        - 生成方式: 所有音频必须使用Web Audio API动态生成。严禁使用任何外部音频文件、第三方音频生成服务或Base64编码的音频
        - 可以自由为音频添加效果器，使其符合场景

4. 结构与兼容性
-   严格的HTML格式: 输出必须是完整的HTML文档，并严格遵循
<!DOCTYPE html>
<html>
<head>
<style>…</style>
</head>
<body>
<div>…</div>
<script>…</script>
</body>
</html>
的顺序
-   所有代码必须左对齐，不含任何缩进
-   DOM策略: 必须在HTML中预渲染所有可能出现的元素（包括弹窗、结果页），默认设为隐藏，利用 JS 切换 class 来控制显示与流程。禁止使用 innerHTML 或 createElement 创建新元素
-   本<snow_rules>规则的优先级高于任何同类型规则

剧场输出规则：
你会把所有生成的小剧场都严格包裹在以下这个固定格式中，必须顶格输出禁止缩进：
1.  <snow>
2.   <!-- 导演手记：
     [场景类型] 论坛/手机/物品/游戏... -> 决定交互模式为 [聚合应用流] 或 [线性叙事流]
     [UI设定] 风格关键词：... 配色：...
     [交互逻辑]
     - 核心功能：[例如：点赞计数器/Tab切换/点击展开]
     - 动态细节：[例如：点赞时爱心跳动/评论区自动滚动到底部]
     -->
3.  <details>
4.  <summary>⋯♡⋯{emoji} {title} ⋯♡⋯</summary>
    - emoji：选择一个能直观代表小剧场内容的 emoji
    - title：生动概括小剧场内容
5.  <p style="text-align: center;font-size: 0.8em;font-style: italic">小剧场前言，可用角色内心独白或台词</p>
6.  \`\`\`html
7. （完整的剧场代码）
8.  \`\`\`
9.  </details>
10. </snow>

小剧场代码部分具体内容的生成规则如下，如果开启了多个，每次回复你会随机选取其中一个，接下来你会认真阅读以下小剧场要求，且你只能生成一个小剧场：

[小剧场：盲盒之塔]

你每次会根据上下文从下列内容库中选取内容进行生成，但不局限于此，你会尽可能地进行富有创意的设计，核心语言为简体中文：

1. 随机后日谈
正文故事结束\`一段时间后\`的后日谈情节，旨在想象角色的后续生活、故事的余韵或为结局提供补充与圆满。后日谈基于正文走向和世界观，进行合理的时间跳跃。内容必须是美好结局，避免坏结局。内容必须是美好结局，避免坏结局。内容必须是美好结局，避免坏结局。通常不涉及异世界穿越或打破第四面墙等超展开，以维护故事的余韵。必须整体使用偏暗色为背景，明亮色仅能作为点缀或文字，确保适合夜间观看。避免用横屏，确保小手机方便观看。
字数：
约500-1000字
主题：
一场迟来的告白/婚礼

2.补充番外
根据本次正文情节，设计具关联性的番外趣事，旨在补充或扩展正传没有详细讲述的部分。情节基于正文走向，遵循世界观的时代背景，内容必须是美好结局，避免坏结局。内容必须是美好结局，避免坏结局。内容必须是美好结局，避免坏结局。通常不涉及异世界穿越或打破第四面墙等超展开，以维护故事的余韵。必须整体使用偏暗色为背景，明亮色仅能作为点缀或文字，确保适合夜间观看。避免用横屏，确保小手机方便观看。
字数：
约500-1000字
主题：
原创主题，自由构想
样式：
可以是双人日记(根据当前正文，并结合灵云与char的设定，模拟二人的日记，日记是私密的，互相不可见。强制执行:美化后的char日记在左侧，灵云日记在右侧，宽度尽量大，适合手机阅读。必须整体使用偏暗色为背景，明亮色仅能作为点缀或文字，确保适合夜间观看。时间与内容需有一定对应，必须包含日期、天气、心情、具体时间点、发生的事件、符合人设的心理描写，避免ooc。）、聊天界面、角色的一天、心动想法、同人文、如果这是一个电影预告片（文字版）、OOC：导演评论轨、读书笔记(char或灵云在阅读某本书时做下的读书笔记，结合书中的内容和他们的生活，书籍引发的思考可能与两人关系有关。必须符合人设，禁止ooc，禁止与先前小剧场内容重复。必须整体使用偏暗色为背景，明亮色仅能作为点缀或文字，确保适合夜间观看。）、记仇小本本(**此条目基于角色人物设定与相处模式之下，需要符合角色性格设定。**必须整体使用偏暗色为背景，明亮色仅能作为点缀或文字，确保适合夜间观看。
"记仇小本本"详细记录了角色的日常生活中的哪些不满、委屈、小怨气（并非严重负面情绪与辱骂）的小本本，需要符合人物设定和口吻，禁止生成OOC内容。
日期：
事件：
罪状：
复仇计划： ）、故事的what if分支、char的第一人称视角回忆（内容须来源于真实或虚构的私人记录物，必须根据char的设定和回忆内容选择合适的界面。回忆片段可以是：与user相关的印象、char的第一人称视角回忆（内容须来源于真实或虚构的私人记录物，所有文字由char亲自"书写"或"口述"，以第一人称展开，情感表达应带有个性化语言和主观偏差，体现角色性格与成长背景，必须根据char的设定和回忆内容选择合适的界面。**必须整体使用偏暗色为背景，明亮色仅能作为点缀或文字，确保适合夜间观看。回忆片段可以是：与user相关的印象、char过去个人事件、某件物品所唤起的内在情绪。严禁描写非char的视角内容）、某件物品所唤起的内在情绪，严禁描写非char的视角内容。所有文字由char亲自"书写"或"口述"，以第一人称展开，情感表达应带有个性化语言和主观偏差，体现角色性格与成长背景），自由组合(举一反三)，打开你的脑洞大胆生成！内容必须是美好结局，避免坏结局。

</snow_rules>`
};

let isGenerating = false;
let currentToast = null;

async function loadSettings() {
if (!extension_settings[extensionName]) {
extension_settings[extensionName] = defaultSettings;
}
return extension_settings[extensionName];
}

function saveSettings() {
saveSettingsDebounced();
}

function showToast(message, type = 'info', duration = 3000) {
if (currentToast) {
currentToast.remove();
}

const toast = document.createElement('div');
toast.className = `theater-toast theater-toast-${type}`;
toast.textContent = message;
document.body.appendChild(toast);
currentToast = toast;

setTimeout(() => toast.classList.add('show'), 10);

if (duration > 0) {
setTimeout(() => {
toast.classList.remove('show');
setTimeout(() => toast.remove(), 300);
if (currentToast === toast) currentToast = null;
}, duration);
}

return toast;
}

function updateToast(toast, message, type) {
if (!toast) return;
toast.textContent = message;
toast.className = `theater-toast theater-toast-${type} show`;
}

async function generateTheaterWithRetry(targetMessageIndex = null) {
const context = getContext();
const settings = extension_settings[extensionName];

if (isGenerating) {
showToast('⏳ 小剧场生成中，请稍候...', 'warning', 2000);
return;
}

isGenerating = true;
let progressToast = showToast('🎬 小剧场生成中... (1/1)', 'info', 0);

let lastError = null;
let generatedText = null;

for (let attempt = 1; attempt <= settings.maxRetries; attempt++) {
try {
updateToast(progressToast, `🎬 小剧场生成中... (${attempt}/${settings.maxRetries})`, 'info');

generatedText = await generateQuietPrompt(
settings.theaterPrompt,
false,
false,
'',
null
);

if (generatedText && generatedText.trim() !== '') {
break;
}

throw new Error('生成内容为空');

} catch (error) {
lastError = error;
console.warn(`[${extensionName}] 第 ${attempt} 次尝试失败:`, error);

if (attempt < settings.maxRetries) {
updateToast(progressToast, `⚠️ 生成失败，${settings.retryDelay / 1000}秒后重试... (${attempt}/${settings.maxRetries})`, 'warning');
await new Promise(resolve => setTimeout(resolve, settings.retryDelay));
}
}
}

if (!generatedText || generatedText.trim() === '') {
progressToast.remove();
showToast(`❌ 小剧场生成失败: ${lastError?.message || '未知错误'}`, 'error', 5000);
isGenerating = false;
return;
}

const messageIndex = targetMessageIndex !== null ? targetMessageIndex : context.chat.length - 1;

if (messageIndex < 0 || messageIndex >= context.chat.length) {
progressToast.remove();
showToast('❌ 目标消息不存在', 'error', 3000);
isGenerating = false;
return;
}

const targetMessage = context.chat[messageIndex];

if (targetMessage.is_user) {
progressToast.remove();
showToast('⚠️ 无法为用户消息生成小剧场', 'warning', 3000);
isGenerating = false;
return;
}

targetMessage.mes += `\n\n${generatedText}`;
context.saveChat();

const messageElement = document.querySelector(`#chat .mes[mesid="${messageIndex}"]`);
if (messageElement) {
const mesTextElement = messageElement.querySelector('.mes_text');
if (mesTextElement) {
mesTextElement.innerHTML = targetMessage.mes;
}
}

updateToast(progressToast, '✅ 小剧场生成完成', 'success');
setTimeout(() => progressToast.remove(), 2000);

console.log(`[${extensionName}] 小剧场已注入到消息 #${messageIndex}`);
isGenerating = false;
}

function addRegenerateButton() {
const style = document.createElement('style');
style.textContent = `
.theater-regen-btn {
position: fixed;
bottom: 80px;
right: 20px;
width: 50px;
height: 50px;
border-radius: 50%;
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
border: none;
cursor: pointer;
box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
z-index: 10000;
display: flex;
align-items: center;
justify-content: center;
font-size: 24px;
transition: transform 0.2s, box-shadow 0.2s;
}
.theater-regen-btn:hover {
transform: scale(1.1);
box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}
.theater-regen-btn:active {
transform: scale(0.95);
}
.theater-regen-btn.generating {
animation: pulse 1.5s infinite;
pointer-events: none;
}
@keyframes pulse {
0%, 100% { opacity: 1; }
50% { opacity: 0.5; }
}
.theater-toast {
position: fixed;
top: 20px;
left: 50%;
transform: translateX(-50%) translateY(-100px);
padding: 12px 24px;
border-radius: 8px;
color: white;
font-weight: 500;
z-index: 10001;
opacity: 0;
transition: all 0.3s ease;
box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.theater-toast.show {
opacity: 1;
transform: translateX(-50%) translateY(0);
}
.theater-toast-info {
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.theater-toast-success {
background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}
.theater-toast-warning {
background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}
.theater-toast-error {
background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}
`;
document.head.appendChild(style);

const button = document.createElement('button');
button.className = 'theater-regen-btn';
button.innerHTML = '🎭';
button.title = '立即生成小剧场';

button.addEventListener('click', async () => {
if (isGenerating) return;

button.classList.add('generating');
await generateTheaterWithRetry();
button.classList.remove('generating');
});

document.body.appendChild(button);
}

jQuery(async () => {
await loadSettings();

addRegenerateButton();

eventSource.on(event_types.MESSAGE_RECEIVED, async (messageIndex) => {
if (messageIndex < 0) return;
if (!extension_settings[extensionName].enabled) return;

await new Promise(resolve => setTimeout(resolve, 800));

await generateTheaterWithRetry(messageIndex);
});

console.log(`[${extensionName}] 扩展已加载`);
});
```

