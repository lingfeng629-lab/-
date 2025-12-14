```javascript
import { saveSettingsDebounced } from "../../../../script.js";
import { extension_settings, getContext } from "../../../extensions.js";
import { generateQuietPrompt } from "../../../slash-commands.js";

const extensionName = "theater-auto-gen";
const defaultSettings = {
  enabled: true,
  maxRetries: 3,
  retryDelay: 2000,
  theaterPrompt: `你的超长提示词...`
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

  if (!settings.enabled) {
    console.log(`[${extensionName}] 扩展未启用，跳过生成`);
    return;
  }

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

  // 监听角色回复完成事件
  const context = getContext();

  // 使用 MutationObserver 监听新消息
  const chatObserver = new MutationObserver(async (mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        const settings = extension_settings[extensionName];
        if (!settings.enabled) continue;

        // 等待消息渲染完成
        await new Promise(resolve => setTimeout(resolve, 800));

        const lastMessage = context.chat[context.chat.length - 1];
        if (lastMessage && !lastMessage.is_user) {
          await generateTheaterWithRetry(context.chat.length - 1);
        }
      }
    }
  });

  const chatContainer = document.getElementById('chat');
  if (chatContainer) {
    chatObserver.observe(chatContainer, {
      childList: true,
      subtree: false
    });
  }

  console.log(`[${extensionName}] 扩展已加载`);
});
```
