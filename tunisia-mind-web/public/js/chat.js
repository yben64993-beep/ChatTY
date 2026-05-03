// ========== chat.js - النسخة النهائية المستقرة والاحترافية 💎 ==========

const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendMessageBtn');
const messagesWrapper = document.getElementById('messagesWrapper');
const welcomeScreen = document.getElementById('welcomeScreen');
const chatContainer = document.getElementById('chatContainer');

let isProcessing = false;
let attachedImage = null;
let attachedVideoFrames = null;
let attachedFileContent = null;
let attachedFileName = null;
let chatAbortController = null;

const API_BASE_URL = window.location.origin;

// ========== الدوال المساعدة ==========
window.showToast = (msg, type = 'info') => {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = `toast show ${type}`;
    setTimeout(() => t.className = 'toast', 3000);
};

window.showFutureUpdate = () => {
    const lang = localStorage.getItem('mindtyLang') || 'ar';
    const msg = window.translations?.[lang]?.future_update || window.translations?.['ar']?.future_update;
    window.showToast(msg, 'info');
};


function hideWelcome() {
    if (welcomeScreen) welcomeScreen.style.display = 'none';
    if (messagesWrapper) messagesWrapper.style.display = 'flex';
}

function scrollToBottom() {
    if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
}

function formatMarkdown(text) {
    if (!text) return "";

    // أولا نستخرج الأكواد البرمجية لنحميها من استبدال المسافات والأسطر
    const codeBlocks = [];
    let processedText = text.replace(/```([\w]*)\n([\s\S]*?)```/gi, (match, lang, code) => {
        const id = codeBlocks.length;
        codeBlocks.push({ lang: lang || 'code', code: code.trim() });
        return `__CODE_BLOCK_${id}__`;
    });

    processedText = processedText
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>');

    // تفعيل دعم الجداول (Tables Support)
    if (processedText.includes('|')) {
        processedText = processedText.replace(/(?:^|<br>\|)(.*?\|.*?)(?=<br>|$)/g, (match, tableRow) => {
            const cells = tableRow.split('|').filter(c => c.trim() !== '');
            if (cells.length < 2) return match;
            const isHeader = match.includes('---');
            const tag = isHeader ? 'th' : 'td';
            return `<tr style="border-bottom:1px solid var(--border-color);">${cells.map(c => `<${tag} style="padding:10px; border:1px solid var(--border-color); text-align:center;">${c.trim()}</${tag}>`).join('')}</tr>`;
        });
        processedText = processedText.replace(/(<tr.*?>.*?<\/tr>)+/g, '<div class="table-wrap" style="overflow-x:auto; margin:15px 0;"><table style="width:100%; border-collapse:collapse; border:2px solid var(--border-color); border-radius:12px; overflow:hidden;">$1</table></div>');
    }

    // نعيد الأكواد مع الواجهة الجديدة للأزرار
    codeBlocks.forEach((block, index) => {
        const safeCode = encodeURIComponent(block.code);
        const cleanLang = block.lang.toLowerCase();

        if (cleanLang === 'chart' || cleanLang === 'chart:json') {
            const chartId = `chart-${Date.now()}-${index}`;
            const chartHTML = `
            <div class="chart-block-wrap" style="margin:20px 0; background:var(--bg-secondary); padding:20px; border-radius:15px; border:1px solid var(--border-color);">
                <canvas id="${chartId}" style="max-width:100%;"></canvas>
                <script>
                    setTimeout(() => {
                        try {
                            const config = JSON.parse(decodeURIComponent('${safeCode}'));
                            new Chart(document.getElementById('${chartId}'), config);
                        } catch(e) { console.error('Chart Error:', e); }
                    }, 500);
                </script>
            </div>`;
            processedText = processedText.replace(`__CODE_BLOCK_${index}__`, chartHTML);
            return;
        }

        const codeHTML = `
        <div class="code-block-wrap" style="position:relative; border-radius:8px; overflow:hidden; border: 1px solid var(--border-color); margin: 15px 0; background: var(--bg-primary);">
            <div class="code-header" style="background:var(--bg-secondary); color:var(--text-secondary); padding:8px 15px; font-size:0.85rem; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-family:monospace; font-weight:bold; text-transform:uppercase;">${cleanLang}</span>
                <div style="display:flex; gap:15px;">
                    <button onclick="window.runCode('${cleanLang}', decodeURIComponent('${safeCode}'))" style="background:none; border:none; color:#10b981; cursor:pointer; font-family:inherit; font-size: 0.9rem; display:flex; gap:6px; align-items:center; transition: opacity 0.2s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1"><i class="fa-solid fa-play"></i> تشغيل</button>
                    <button onclick="navigator.clipboard.writeText(decodeURIComponent('${safeCode}')); const t=document.getElementById('toast'); if(t){t.textContent='تم نسخ الكود!'; t.className='toast show success'; setTimeout(()=>t.className='toast',3000);} else alert('تم النسخ');" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; font-family:inherit; font-size: 0.9rem; display:flex; gap:6px; align-items:center; transition: opacity 0.2s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1"><i class="fa-solid fa-copy"></i> نسخ</button>
                </div>
            </div>
            <pre style="margin:0; padding:15px; border-radius:0; overflow-x:auto;"><code class="language-${cleanLang}">${block.code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
        </div>`;
        processedText = processedText.replace(`__CODE_BLOCK_${index}__`, codeHTML);
    });

    return processedText;
}

function applyPlugins(container) {
    if (typeof renderMathInElement === 'function') {
        renderMathInElement(container, {
            delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
            throwOnError: false
        });
    }
    if (typeof hljs !== 'undefined') {
        container.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
    }
}

// ========== نظام الرسائل ==========

function appendMessage(content, sender, isHtml = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;

    const avatarDiv = document.createElement('div');
    avatarDiv.className = `msg-avatar ${sender === 'ai' ? 'ai-avatar' : 'user-avatar'}`;
    if (sender === 'ai') {
        avatarDiv.innerHTML = '<img src="assets/tunisia-brain-new.jpg" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" alt="AI">';
    } else {
        avatarDiv.innerHTML = '<i class="fa-solid fa-user"></i>';
    }

    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'msg-body';
    const contentDiv = document.createElement('div');
    contentDiv.className = 'msg-content';
    contentDiv.setAttribute('dir', 'auto');

    if (isHtml) contentDiv.innerHTML = content;
    else contentDiv.innerHTML = formatMarkdown(content);

    bodyDiv.appendChild(contentDiv);

    // إضافة أزرار الأكشن في رسائل الذكاء الاصطناعي
    if (sender === 'ai') {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'msg-actions';
        actionsDiv.innerHTML = `
            <button class="msg-action-btn copy-msg-btn" onclick="navigator.clipboard.writeText(this.closest('.msg-body').querySelector('.msg-content').innerText); window.showToast?.('تم النسخ!', 'success');"><i class="fa-regular fa-copy"></i> نسخ</button>
        `;
        bodyDiv.appendChild(actionsDiv);
    }

    msgDiv.appendChild(avatarDiv);
    msgDiv.appendChild(bodyDiv);
    messagesWrapper.appendChild(msgDiv);

    applyPlugins(contentDiv);
    scrollToBottom();
    if (window.updateQuotaDisplay) window.updateQuotaDisplay();
    return msgDiv;
}

function appendTypingIndicator() {
    const id = 'typing-' + Date.now();
    const msgDiv = document.createElement('div');
    msgDiv.id = id;
    msgDiv.className = 'message ai';
    const lang = window.currentLang || localStorage.getItem('tunisiaLang') || 'ar';
    const thinkingText = window.translations?.[lang]?.thinking || "يفكر...";
    msgDiv.innerHTML = `
        <div class="msg-avatar ai-avatar"><img src="assets/tunisia-brain-new.jpg" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" alt="AI"></div>
        <div class="msg-body">
            <div style="display:flex; align-items:center; gap:10px; color:var(--text-secondary); font-size:0.9rem; font-weight:500;">
                <span>${thinkingText}</span><div class="typing-indicator"><span></span><span></span><span></span></div>
            </div>
        </div>
    `;
    messagesWrapper.appendChild(msgDiv);
    scrollToBottom();
    return id;
}

async function startAsyncImageGeneration(prompt) {
    const jobIdBox = 'img-job-' + Date.now();
    
    // Append loading box independently from the main chat flow
    const msgDiv = document.createElement('div');
    msgDiv.id = jobIdBox;
    msgDiv.className = 'message ai';
    msgDiv.innerHTML = `
        <div class="msg-avatar ai-avatar"><img src="assets/tunisia-brain-new.jpg" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" alt="AI"></div>
        <div class="msg-body">
            <div class="msg-content">
                <div class="image-generation-loader">
                    <div class="loader-spinner-wrap">
                        <div class="loader-spinner"></div>
                        <i class="fa-solid fa-wand-magic-sparkles loader-icon"></i>
                    </div>
                    <div class="loader-text">
                        <span class="loader-title">جاري إبداع صورتك...</span>
                        <span class="loader-prompt">"${prompt}"</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    messagesWrapper.appendChild(msgDiv);
    scrollToBottom();

    try {
        const res = await fetch(`${API_BASE_URL}/api/generate-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt }),
            signal: AbortSignal.timeout(65000) // 65 seconds timeout
        });
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error || "تعذر بدء عملية توليد الصورة.");
        }

        const earlyImgUrl = data.image_url || data.imageUrl || data.url;
        
        // Helper function to render image
        const renderImage = (imgUrl) => {
            const containerBox = document.getElementById(jobIdBox);
            if (containerBox) {
                const contentArea = containerBox.querySelector('.msg-content');
                if (contentArea) {
                    contentArea.innerHTML = `
                        <div class="generated-image-wrap" id="img-${Date.now()}">
                            <img src="${imgUrl}" alt="الصورة المولدة: ${prompt.replace(/"/g, '&quot;')}" style="cursor: zoom-in;" onclick="window.openLightbox('${imgUrl}')" onload="window.scrollToBottom?.()">
                            <a href="${imgUrl}" download="TunisiaMindAI_${Date.now()}.jpg" class="image-download-btn" title="تحميل الصورة">
                                <i class="fa-solid fa-download"></i>
                            </a>
                        </div>
                    `;
                    window.saveMessageToCurrentChat?.(contentArea.innerHTML, 'ai', true);
                    window.saveImageLocally?.(imgUrl);
                    scrollToBottom();
                }
            }
        };

        if (earlyImgUrl) {
            renderImage(earlyImgUrl);
            return;
        }

        if (!data.job_id) {
            throw new Error(data.error || "تعذر بدء عملية توليد الصورة (الخادم لم يرجع رابطاً او Job ID).");
        }
        
        const jobId = data.job_id;
        
        // Polling interval for status
        const poll = setInterval(async () => {
            const containerBox = document.getElementById(jobIdBox);
            if (!containerBox) {
                clearInterval(poll);
                return;
            }

            try {
                let sRes = await fetch(`${API_BASE_URL}/api/image-status/${jobId}`, {
                    signal: AbortSignal.timeout(10000) // 10 seconds for status check
                });
                if (!sRes.ok) throw new Error("فشل الاتصال بالخادم للتحقق من الحالة.");
                let sData = await sRes.json();
                
                const isDone = sData.status === "done" || sData.stats === "done" || sData.status === "succeeded";
                const imgUrl = sData.image_url || sData.imageUrl || sData.url;

                if (isDone || imgUrl) {
                    clearInterval(poll);
                    if (imgUrl) {
                        renderImage(imgUrl);
                    } else {
                        throw new Error("الصورة جاهزة ولكن لم نجد الرابط.");
                    }
                } else if (sData.status === "failed" || sData.stats === "failed" || sData.status === "error") {
                    clearInterval(poll);
                    throw new Error("فشلت عملية توليد الصورة في الخادم.");
                }
            } catch(e) {
                console.error("Polling error:", e);
                // Handle UI update if it fails during polling loop
                if(e.message.includes("جاهزة ولكن") || e.message.includes("فشل الاتصال") || e.message.includes("فشلت عملية")) {
                    clearInterval(poll);
                    if (containerBox) {
                        containerBox.querySelector('.msg-content').innerHTML = `<span style="color:var(--danger-color);"><i class="fa-solid fa-triangle-exclamation"></i> خطأ: ${e.message}</span>`;
                    }
                }
            }
        }, 3000);
        
    } catch(err) {
        document.getElementById(jobIdBox).querySelector('.msg-content').innerHTML = `<span style="color:var(--danger-color);"><i class="fa-solid fa-triangle-exclamation"></i> خطأ: ${err.message}</span>`;
    }
}

async function handleSend() {
    try {
        if (isProcessing) return;

        const text = messageInput.value.trim();
        if (!text && !attachedFileContent && !attachedImage) return;

        // التحقق من حدود المحادثات والرسائل
        const lang = localStorage.getItem('mindtyLang') || 'ar';
        const trans = window.translations?.[lang] || window.translations?.['ar'];

        // 1. الحد اليومي للمحادثات (5 محادثات في اليوم)
        const today = new Date().toLocaleDateString();
        const chatLimitKey = `mindty_daily_chats_${today}`;
        const dailyChats = parseInt(localStorage.getItem(chatLimitKey) || "0");

        if (!window.currentChatId && dailyChats >= 5) {
            // إظهار نافذة منبثقة للحد اليومي
            const modal = document.createElement('div');
            modal.className = 'modal-overlay active';
            modal.style.display = 'flex';
            modal.innerHTML = `
                <div class="settings-card" style="text-align:center; padding:30px;">
                    <i class="fa-solid fa-calendar-day" style="font-size:4rem; color:var(--accent-color); margin-bottom:20px;"></i>
                    <h2 style="margin-bottom:15px;">${trans.daily_limit_reached}</h2>
                    <p style="opacity:0.8; margin-bottom:25px;">لقد استمتعت بـ 5 محادثات ذكية اليوم. يمكنك العودة غداً للمزيد من الإبداع!</p>
                    <button class="btn-primary" onclick="this.closest('.modal-overlay').remove()">فهمت ذلك</button>
                </div>
            `;
            document.body.appendChild(modal);
            isProcessing = false;
            return;
        }

        // 2. حد الرسائل في المحادثة الواحدة (100 رسالة)
        if (window.currentChatId) {
            const msgCount = document.querySelectorAll('#messagesWrapper .message.user').length;
            if (msgCount >= 100) {
                appendMessage(trans.chat_limit_reached, 'ai');
                isProcessing = false;
                return;
            }
        }


        const drawRegex = /^\s*(?:لو\s+سمحت\s*|من\s+فضلك\s*|ممكن\s*|هل\s+بإمكانك\s*|هل\s+تستطيع\s*|please\s+|can\s+you\s+)?(?:ارسم|إرسم|تخيل|صمم|اصنع|أنشئ|ولد|توليد|draw|imagine|create|generate|make)(?:\s+لي|\s+لنا|me|for me)?(?:\s*صورة|\s*رسمة|\s*لـ|\s*ل|image|picture)?(?:(.*))?$/i;
        let match = text.trim().match(drawRegex);
        
        if (match || /^(?:صورة|صورة لـ|image of|picture of)\s*(.*)/i.test(text.trim())) {
            let promptContent = (match && match[1]) ? match[1] : text;
            if(!promptContent && !match) {
                promptContent = text.replace(/^(?:صورة|صورة لـ|image of|picture of)\s*/i, '').trim();
            }
            if(!promptContent || promptContent.trim() === '') promptContent = text; // safety fallback

            messageInput.value = ''; 
            messageInput.style.height = 'auto'; 
            hideWelcome();
            appendMessage(text, 'user');
            window.saveMessageToCurrentChat?.(text, 'user', false);
            
            // Clean common Arabic prepositions at the start e.g. "لموزة" -> "موزة"
            if (promptContent.startsWith('ل') && promptContent.length > 2 && /[\u0600-\u06FF]/.test(promptContent)) {
                promptContent = promptContent.substring(1).trim();
            } else if (promptContent.startsWith('لـ') && promptContent.length > 3 && /[\u0600-\u06FF]/.test(promptContent)) {
                promptContent = promptContent.substring(2).trim();
            }
            
            // إطلاق معاملة غير متزامنة لا توقف الدردشة
            startAsyncImageGeneration(promptContent);
            return;
        }

        if (/(تصدير|حمل|نزل|تحميل|صدر|قم بتصدير|قم بتحميل|تنزيل|احفظ|حفظ).*(المحادثة|الدردشة|الشات)/.test(text.trim()) || text.toLowerCase().includes('export chat')) {
            isProcessing = true;
            sendBtn.disabled = true; messageInput.disabled = true; sendBtn.classList.add('loading');
            messageInput.value = ''; messageInput.style.height = 'auto'; hideWelcome();
            appendMessage(text, 'user');

            if (window.currentChatId && window.exportChatFromMenu) {
                const exportId = 'export-res-' + Date.now();
                appendMessage(`
                <div id="${exportId}">
                    <p>بالتأكيد! كيف ترغب في تصدير هذه المحادثة؟ اختر الصيغة المناسبة لك: 📥</p>
                    <div style="display:flex; gap:10px; margin-top:10px; flex-wrap:wrap;">
                        <button class="context-menu-item" style="background:var(--bg-tertiary); padding:8px 15px; border-radius:8px;" onclick="window.exportChatFromMenu(window.currentChatId, 'pdf'); this.disabled=true;">
                            <i class="fa-solid fa-file-pdf"></i> PDF
                        </button>
                        <button class="context-menu-item" style="background:var(--bg-tertiary); padding:8px 15px; border-radius:8px;" onclick="window.exportChatFromMenu(window.currentChatId, 'text'); this.disabled=true;">
                            <i class="fa-solid fa-file-lines"></i> Text
                        </button>
                        <button class="context-menu-item" style="background:var(--bg-tertiary); padding:8px 15px; border-radius:8px;" onclick="window.exportChatFromMenu(window.currentChatId, 'image'); this.disabled=true;">
                            <i class="fa-solid fa-image"></i> Image
                        </button>
                    </div>
                </div>
            `, 'ai', true);
            } else {
                appendMessage('لا توجد محادثة مفتوحة حالياً لتصديرها. من فضلك ابدأ محادثة أولاً.', 'ai');
            }

            isProcessing = false;
            sendBtn.disabled = false; messageInput.disabled = false; sendBtn.classList.remove('loading');
            return;
        }

        if (isProcessing) {
            if (chatAbortController) chatAbortController.abort();
            return;
        }

        isProcessing = true;
        chatAbortController = new AbortController();
        sendBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
        sendBtn.classList.add('generating');

        // Disable input but keep sendBtn enabled for STOP click
        messageInput.disabled = true;

        messageInput.value = '';
        messageInput.style.height = 'auto';
        hideWelcome();

        let saveContentForHistory = text;
        let isHtmlForHistory = false;

        if (attachedFileContent) {
            saveContentForHistory = `<div class="file-tag"><i class="fa-solid fa-file-code"></i> ${attachedFileName}</div>${text}`;
            isHtmlForHistory = true;
            appendMessage(saveContentForHistory, 'user', true);
        } else if (attachedImage || attachedVideoFrames) {
            const visual = attachedImage || (attachedVideoFrames && attachedVideoFrames[0]);
            saveContentForHistory = `<div class="img-preview-msg"><img src="${visual}"></div>${text}`;
            if (attachedVideoFrames) saveContentForHistory = `<div class="file-tag"><i class="fa-solid fa-video"></i> مقطع فيديو للتحليل (${attachedVideoFrames.length} إطارات)</div>` + saveContentForHistory;
            isHtmlForHistory = true;
            appendMessage(saveContentForHistory, 'user', true);
        } else {
            appendMessage(text, 'user');
        }
        // حفظ رسالة المستخدم
        window.saveMessageToCurrentChat?.(saveContentForHistory, 'user', isHtmlForHistory);

        const mainIndicatorId = appendTypingIndicator();
        let fullAiResponse = "";

        try {
            const history = Array.from(document.querySelectorAll('#messagesWrapper .message:not([id^="typing-"])')).slice(-11, -1).map(msg => ({
                role: msg.classList.contains('user') ? 'user' : 'assistant',
                content: msg.querySelector('.msg-content')?.innerText || ''
            }));

            let finalPrompt = text;
            if (attachedFileContent) {
                 finalPrompt = text.trim() 
                    ? `[تم إرفاق ملف للتحليل: ${attachedFileName}]\n${text}\n\nمحتوى الملف:\n${attachedFileContent}` 
                    : `مرحباً، لقد قمت بإرفاق ملف بعنوان (${attachedFileName}). الرجاء تحليله بعناية، شرح فكرته الأساسية، استخراج أهم المعلومات منه، وتقديم ملخص مفصل باللغة العربية. إذا كان كوداً برمجياً، فقم بشرح وظيفته وكيفية عمله.`;
            }

            // Removed Persona Memory

            const currentResponseLen = localStorage.getItem('tm-response-len') || 'medium';

            let uc = null;
            if (window.currentUserProfile) {
                uc = {
                    name: window.currentUserProfile.firstName || window.currentUserProfile.displayName || window.currentUser?.displayName,
                    age: window.currentUserProfile.age
                };
            }

            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: finalPrompt,
                    history: history,
                    stream: true,
                    userContext: uc,
                    image: attachedVideoFrames || attachedImage,
                    responseLen: currentResponseLen
                }),
                signal: chatAbortController.signal
            });

            const indicator = document.getElementById(mainIndicatorId);
            if (indicator) indicator.remove();

            const aiMsgDiv = appendMessage("", 'ai');
            const aiContentDiv = aiMsgDiv.querySelector('.msg-content');

            if (!response.ok) {
                fullAiResponse = "⚠️ عذراً، الخادم مشغُول أو غير متاح حالياً. يرجى المحاولة بعد قليل.";
                aiContentDiv.innerHTML = formatMarkdown(fullAiResponse);
                return;
            } else {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let streamBuffer = '';
                let displayQueue = [];
                let isDisplaying = false;

                async function processQueue() {
                    if (isDisplaying) return;
                    isDisplaying = true;
                    while (displayQueue.length > 0) {
                        const word = displayQueue.shift();
                        fullAiResponse += word;
                        aiContentDiv.innerHTML = formatMarkdown(fullAiResponse);
                        scrollToBottom();
                        // Small delay for 'word-by-word' effect
                        await new Promise(r => setTimeout(r, 10));
                    }
                    isDisplaying = false;
                }

                    // Push to queue is done inside processQueue below; we just start the reading process
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    streamBuffer += chunk;
                    const lines = streamBuffer.split('\n\n');
                    streamBuffer = lines.pop(); // Keep the last incomplete part in the buffer

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const dataLine = line.slice(6).trim();
                            if (dataLine === '[DONE]') break;
                            try {
                                const parsed = JSON.parse(dataLine);
                                if (parsed.content) {
                                    // Push content to queue instead of immediate display
                                    displayQueue.push(parsed.content);
                                    processQueue();
                                }
                            } catch (e) { }
                        }
                    }
                }

                // Final wait for queue to empty
                while (isDisplaying) await new Promise(r => setTimeout(r, 50));
            } // Close else block

            if (!fullAiResponse) {
                fullAiResponse = "⚠️ عذراً، لم أتمكن من توليد رد صالح.";
                aiContentDiv.innerHTML = formatMarkdown(fullAiResponse);
            }

            // إذا لم تكن هناك محادثة مفتوحة، ننشئ واحدة جديدة
            if (!window.currentChatId) {
                const chatsRef = collection(window.firebaseDb, 'users', window.currentUser.uid, 'chats');
                const chatDoc = await addDoc(chatsRef, {
                    title: text.replace(/<[^>]*>?/gm, '').slice(0, 50) || "محادثة جديدة",
                    updatedAt: Date.now(),
                    isPinned: false,
                    isArchived: false,
                    createdAt: serverTimestamp()
                });
                window.currentChatId = chatDoc.id;

                // تحديث عداد المحادثات اليومية
                const today = new Date().toLocaleDateString();
                const chatLimitKey = `mindty_daily_chats_${today}`;
                const currentDaily = parseInt(localStorage.getItem(chatLimitKey) || "0");
                localStorage.setItem(chatLimitKey, currentDaily + 1);
            }

            applyPlugins(aiContentDiv);

            // Re-verify action buttons are tied to the FINAL content
            const finalActions = aiMsgDiv.querySelector('.msg-actions');
            if (!finalActions && aiMsgDiv.classList.contains('ai')) {
                const newActions = document.createElement('div');
                newActions.className = 'msg-actions';
                newActions.innerHTML = `
                    <button class="msg-action-btn copy-msg-btn" onclick="navigator.clipboard.writeText(this.closest('.msg-body').querySelector('.msg-content').innerText); window.showToast?.('تم النسخ!', 'success');"><i class="fa-regular fa-copy"></i> نسخ</button>
                `;
                aiMsgDiv.querySelector('.msg-body').appendChild(newActions);
            }

            // حفظ رد الذكاء الاصطناعي
            if (fullAiResponse) window.saveMessageToCurrentChat?.(fullAiResponse.trim(), 'ai');

            // Deduct points
            if (window.currentUserProfile && window.fsCore) {
                if (window.currentUserProfile.isGuest) {
                    // Guest quota deduction in localStorage
                    window.currentUserProfile.bonusMessages = Math.max(0, (window.currentUserProfile.bonusMessages || 0) - 1);
                    localStorage.setItem('tm-guest-bonus', window.currentUserProfile.bonusMessages);
                    if(window.updateQuotaDisplay) window.updateQuotaDisplay();
                } else {
                    try {
                        const { doc, updateDoc, increment } = window.fsCore;
                        const userRef = doc(window.firebaseDb, 'users', window.currentUser.uid);
                        await updateDoc(userRef, {
                            msgCount: increment(1),
                            bonusMessages: increment(-1)
                        });
                        window.currentUserProfile.msgCount = (window.currentUserProfile.msgCount || 0) + 1;
                        window.currentUserProfile.bonusMessages = Math.max(0, (window.currentUserProfile.bonusMessages || 0) - 1);
                        if(window.updateQuotaDisplay) window.updateQuotaDisplay();
                    } catch(err) {
                        console.error('Error updating quota:', err);
                    }
                }
            }

        } catch (error) {
            if (error.name === 'AbortError') return;
            if (fullAiResponse) {
                console.warn('Minor stream error after successful response:', error);
                return;
            }
            console.error('Chat Error:', error);
            appendMessage('⚠️ خطأ في الاتصال.', 'ai');
        } finally {
            isProcessing = false;
            sendBtn.disabled = false;
            messageInput.disabled = false;
            sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
            sendBtn.classList.remove('generating');
            sendBtn.classList.remove('loading');
            messageInput.focus();
            attachedFileContent = null; attachedImage = null;
            const preview = document.getElementById('imagePreviewContainer');
            if (preview) preview.style.display = 'none';
        }
    } catch (globalError) {
        console.error("CRITICAL FATAL ERROR IN HANDLESEND:", globalError);
        isProcessing = false;
        sendBtn.disabled = false;
        messageInput.disabled = false;
        sendBtn.classList.remove('loading');
        appendMessage('⚠️ حدث خطأ: ' + globalError.message, 'ai');
    }
}

// Suggestions logic removed as requested.

function initChat() {
    if (sendBtn) sendBtn.onclick = handleSend;
    if (messageInput) {
        // إنشاء قائمة الـ Slash Commands مرة واحدة
        const slashMenu = document.createElement('div');
        slashMenu.id = 'slashMenu';
        slashMenu.style.cssText = 'display:none; position:absolute; bottom:60px; right:10px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:8px; padding:5px; z-index:100; min-width:180px; box-shadow:0 4px 10px rgba(0,0,0,0.3);';

        const cmds = [
            { id: '/ترجم', text: 'ترجم النص إلى العربية: ' },
            { id: '/لخص', text: 'قم بتلخيص هذا النص بشكل نقاط: ' },
            { id: '/كود', text: 'اكتب كوداً برمجياً لـ: ' },
            { id: '/اشرح', text: 'اشرح هذا المفهوم ببساطة: ' }
        ];

        cmds.forEach(c => {
            const btn = document.createElement('div');
            btn.innerHTML = `<strong style="color:#10b981">${c.id}</strong> <span style="font-size:0.8rem;color:var(--text-secondary)">${c.text.split(' ')[0]}</span>`;
            btn.style.cssText = 'padding:8px; cursor:pointer; border-radius:5px; margin-bottom:2px; transition:0.2s;';
            btn.onmouseover = () => btn.style.background = 'var(--bg-tertiary)';
            btn.onmouseout = () => btn.style.background = 'transparent';
            btn.onclick = () => {
                messageInput.value = c.text;
                slashMenu.style.display = 'none';
                messageInput.focus();
            };
            slashMenu.appendChild(btn);
        });
        document.getElementById('inputContainer').appendChild(slashMenu);

        messageInput.addEventListener('input', (e) => {
            const val = e.target.value;
            if (val === '/') {
                slashMenu.style.display = 'block';
            } else if (!val.startsWith('/')) {
                slashMenu.style.display = 'none';
            }
        });

        messageInput.onkeypress = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                slashMenu.style.display = 'none';
                e.preventDefault();
                handleSend();
            }
        };
    }
    // attachBtnAlpha no longer directly clicks fileIn, it opens the menu via inline onclick in index.html
    const fileIn = document.getElementById('fileInputAlpha');
    const imageIn = document.getElementById('imageInput');
    const videoIn = document.getElementById('videoInput');

    if (fileIn) {
        fileIn.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Increase limit to 20MB for most files
            const limit = 20 * 1024 * 1024;
            if (file.size > limit) {
                window.showToast?.(`حجم الملف كبير جداً (الحد الأقصى ${limit / (1024 * 1024)}MB)`, 'error');
                fileIn.value = '';
                return;
            }

            attachedFileName = file.name;
            const ext = file.name.split('.').pop().toLowerCase();

            const lang = window.currentLang || localStorage.getItem('mindtyLang') || 'ar';
            const t = window.translations?.[lang] || window.translations?.['ar'];

            try {
                if (ext === 'pdf') {
                    window.showToast?.(t.processing_pdf, 'info');
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    let text = `[محتوى ملف PDF: ${file.name}]\n\n`;
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        const strings = content.items.map(item => item.str);
                        text += `--- الصفحة ${i} ---\n` + strings.join(' ') + '\n\n';
                    }
                    attachedFileContent = text;
                    updateFilePreview('pdf');
                    window.showToast?.(t.ready_for_analysis, 'success');
                } 
                else if (ext === 'docx') {
                    window.showToast?.(t.processing_word, 'info');
                    const arrayBuffer = await file.arrayBuffer();
                    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                    attachedFileContent = `[محتوى مستند Word: ${file.name}]\n\n${result.value}`;
                    updateFilePreview('word');
                    window.showToast?.(t.ready_for_analysis, 'success');
                }
                else if (['xlsx', 'xls', 'csv'].includes(ext)) {
                    window.showToast?.(t.processing_excel, 'info');
                    const arrayBuffer = await file.arrayBuffer();
                    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                    let text = `[محتوى ملف بيانات: ${file.name}]\n\n`;
                    workbook.SheetNames.forEach(sheetName => {
                        text += `--- ورقة: ${sheetName} ---\n`;
                        const sheet = workbook.Sheets[sheetName];
                        text += XLSX.utils.sheet_to_csv(sheet) + '\n\n';
                    });
                    attachedFileContent = text;
                    updateFilePreview('excel');
                    window.showToast?.(t.ready_for_analysis, 'success');
                }
                else if (['js', 'py', 'html', 'css', 'json', 'txt', 'c', 'cpp', 'java', 'php', 'rb', 'go', 'rs', 'ts'].includes(ext)) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        attachedFileContent = `[محتوى ملف برمجى/نصي: ${file.name}]\n\n\`\`\`${ext}\n${ev.target.result}\n\`\`\``;
                        updateFilePreview('code');
                        window.showToast?.(`${t.processing_code}: ${file.name}`, 'success');
                    };
                    reader.readAsText(file, 'UTF-8');
                }
                else if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        attachedImage = ev.target.result;
                        updateFilePreview('image', ev.target.result);
                        window.showToast?.(`✅ ${file.name}`, 'success');
                    };
                    reader.readAsDataURL(file);
                }
                else {
                    // Generic text reader for unknown types
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        attachedFileContent = `[محتوى ملف (${file.name})]:\n\n${ev.target.result}`;
                        updateFilePreview('file');
                        window.showToast?.(`✅ ${file.name}`, 'success');
                    };
                    reader.readAsText(file, 'UTF-8');
                }
            } catch (err) {
                console.error('File Processing Error:', err);
                window.showToast?.('Error analyzing file.', 'error');
            }
        };
    }

    function updateFilePreview(type, src = null) {
        const preview = document.getElementById('imagePreviewContainer');
        const imgPre = document.getElementById('imagePreviewImg');
        if (!preview || !imgPre) return;

        preview.style.display = 'flex';
        if (type === 'image' && src) {
            imgPre.src = src;
        } else if (type === 'pdf') {
            imgPre.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24"><path fill="%23ef4444" d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3.5h-1.25V13H17.75V7h2v1.5z"/></svg>';
        } else if (type === 'word') {
            imgPre.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24"><path fill="%232b579a" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-2 13h-2v-2h2v2zm0-4h-2V9h2v2zm3-5.5V9h-5.5L12 3.5z"/></svg>';
        } else if (type === 'excel') {
            imgPre.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24"><path fill="%23217346" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>';
        } else if (type === 'code') {
            imgPre.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24"><path fill="%2310b981" d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>';
        } else {
            imgPre.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24"><path fill="%236b7280" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/></svg>';
        }
    }

    if (imageIn) {
        imageIn.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 10 * 1024 * 1024) {
                window.showToast?.('Image too large (Max 10MB)', 'error');
                imageIn.value = '';
                return;
            }
            attachedFileName = file.name;
            const reader = new FileReader();
            reader.onload = (ev) => {
                attachedImage = ev.target.result;
                updateFilePreview('image', ev.target.result);
                window.showToast?.(`✅ ${file.name}`, 'success');
            };
            reader.readAsDataURL(file);
        };
    }

    if (videoIn) {
        videoIn.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 50 * 1024 * 1024) {
                window.showToast?.('Video too large (Max 50MB)', 'error');
                videoIn.value = '';
                return;
            }

            const lang = window.currentLang || localStorage.getItem('mindtyLang') || 'ar';
            const t = window.translations?.[lang] || window.translations?.['ar'];

            const videoUrl = URL.createObjectURL(file);
            const tempVid = document.createElement('video');
            tempVid.src = videoUrl;
            tempVid.muted = true;
            tempVid.play();

            tempVid.onloadedmetadata = async () => {
                if (tempVid.duration > 60) { 
                    window.showToast?.('Max video duration is 60s.', 'error');
                    videoIn.value = '';
                    return;
                }
                window.showToast?.(t.processing_video, 'info');
                const frames = await extractFrames(tempVid);
                attachedVideoFrames = frames;
                attachedFileName = file.name;
                updateFilePreview('image', frames[0]);
                window.showToast?.(t.ready_for_analysis, 'success');
                tempVid.pause();
                URL.revokeObjectURL(videoUrl);
            };
        };
    }

    async function extractFrames(videoElem) {
        return new Promise(async (resolve) => {
            const canvas = document.getElementById('hiddenCanvas') || document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const frames = [];
            const duration = videoElem.duration;
            
            // Extract exactly 10 frames distributed across the video
            const frameCount = 10;
            const interval = duration / (frameCount - 1);
            
            for (let i = 0; i < frameCount; i++) {
                videoElem.currentTime = i * interval;
                await new Promise(r => videoElem.onseeked = r);
                
                // Scale down for faster API processing
                const scale = Math.min(1, 512 / Math.max(videoElem.videoWidth, videoElem.videoHeight));
                canvas.width = videoElem.videoWidth * scale;
                canvas.height = videoElem.videoHeight * scale;
                
                ctx.drawImage(videoElem, 0, 0, canvas.width, canvas.height);
                frames.push(canvas.toDataURL('image/jpeg', 0.7));
            }
            resolve(frames);
        });
    }


    // Cancel image/file preview
    const cancelPreviewBtn = document.getElementById('cancelImagePreviewBtn');
    if (cancelPreviewBtn) {
        cancelPreviewBtn.onclick = () => {
            attachedImage = null;
            attachedVideoFrames = null;
            attachedFileContent = null;
            attachedFileName = null;
            const preview = document.getElementById('imagePreviewContainer');
            if (preview) preview.style.display = 'none';
            const fileIn = document.getElementById('fileInputAlpha');
            const imageIn = document.getElementById('imageInput');
            const videoIn = document.getElementById('videoInput');
            if (fileIn) fileIn.value = '';
            if (imageIn) imageIn.value = '';
            if (videoIn) videoIn.value = '';
        };
    }

    // Auto-resize textarea
    if (messageInput) {
        messageInput.addEventListener('input', () => {
            messageInput.style.height = 'auto';
            messageInput.style.height = Math.min(messageInput.scrollHeight, 180) + 'px';
        });
    }

    // Hide attach menu on background click
    document.addEventListener('click', (e) => {
        const attachMenu = document.getElementById('attachMenu');
        const attachBtn = document.getElementById('attachBtnAlpha');
        if (attachMenu && attachBtn && !attachBtn.contains(e.target) && !attachMenu.contains(e.target)) {
            attachMenu.style.display = 'none';
        }
    });

    // Setup STT features
    setupSpeechServices();
}

// ========== محاكي تشغيل الأكواد (Code Runner Modal/Page) ==========

window.runCode = (lang, code) => {
    const runWindow = window.open('', '_blank');
    if (!runWindow) {
        alert("انتبه: المتصفح قام بمنع فتح النوافذ المنبثقة (Pop-ups). يرجى السماح بها.");
        return;
    }

    runWindow.document.write('<html><head><title>تشغيل الكود - MindTY 🚀</title><meta charset="utf-8">');
    runWindow.document.write('<style>body{margin:0; font-family:"Segoe UI", Tahoma, Geneva, Verdana, sans-serif; background:#1e1e1e; color:#ccc;} .app-header {background:#2d2d2d; padding:10px 20px; font-weight:bold; color:white; border-bottom:1px solid #444; display:flex; justify-content:space-between; align-items:center;}</style>');
    runWindow.document.write('</head><body>');

    // Header for the mock IDE window
    runWindow.document.write('<div class="app-header"><span>بيئة التشغيل 💻</span><span style="color:#10b981; font-size:0.9rem;">يدعم ' + lang + '</span></div>');

    if (lang === 'html' || lang === 'htm' || lang === 'xml') {
        runWindow.document.write('<div style="padding:20px; background:white; color:black; height:calc(100vh - 40px); overflow:auto;">' + code + '</div>');
    } else if (lang === 'css') {
        runWindow.document.write(`<style>${code}</style><div style="padding:20px; text-align:center; padding-top:100px;"><h2>تم تطبيق الـ CSS! ✨</h2><p>هذه صفحة فارغة تم حقنها بالكود الخاص بك. أضف بعض الـ HTML لترى النتيجة النهائية.</p></div>`);
    } else if (lang === 'js' || lang === 'javascript') {
        runWindow.document.write(`<div id="consoleOut" style="padding:20px; font-family:monospace; white-space:pre-wrap; line-height:1.5;"></div>`);
        runWindow.document.write(`<script>
            const cOut = document.getElementById('consoleOut');
            console.log = (...args) => { cOut.innerHTML += args.map(a => typeof a === 'object' ? JSON.stringify(a,null,2) : a).join(' ') + "\\n"; };
            console.error = (...args) => { cOut.innerHTML += "<span style='color:#ef4444'>" + args.join(' ') + "</span>\\n"; };
            try {
                ${code}
            } catch(e) {
                console.error(e.toString());
            }
        </script>`);
    } else if (lang === 'python' || lang === 'py') {
        runWindow.document.write(`
            <div id="output" style="padding:20px; font-family:monospace; white-space:pre-wrap; font-size:1.1rem;">جاري تحميل بيئة بايثون (Pyodide)... يرجى الانتظار ⏳</div>
            <script src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"></script>
            <script>
                async function main() {
                    try {
                        let pyodide = await loadPyodide();
                        
                        // Support for input() via window.prompt
                        pyodide.setStdout({ batched: (msg) => { document.getElementById('output').innerHTML += "<span style='color:#3b82f6'>[مخرجات]:</span> " + msg + "\\n"; } });
                        pyodide.setStdin({
                            stdin: () => {
                              const val = prompt("⌨️ يرجى إدخال مدخلات (input) للكود:");
                              return val === null ? "" : val;
                            }
                        });

                        document.getElementById('output').innerHTML = "<div style='color:#10b981; margin-bottom:15px;'>✅ بيئة جاهزة. جاري تشغيل الكود...</div>";
                        
                        await pyodide.runPythonAsync(\`${code.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`);
                    } catch (err) {
                        document.getElementById('output').innerHTML += "\\n\\n<b style='color:#ef4444'>خطأ في الكود:</b>\\n<span style='color:#ef4444'>" + err.toString() + "</span>";
                    }
                }
                main();
            </script>
        `);
    } else {
        runWindow.document.write(`<div style="padding:20px;">عذراً، محاكي الأكواد لا يدعم تشغيل لغة <strong style="color:#f59e0b">${lang}</strong> حالياً بداخل المتصفح.</div>`);
    }

    runWindow.document.write('</body></html>');
    runWindow.document.close();
};

// ========== Voice Integration (TTS & STT) ==========

window.playTTS = (text, btn) => {
    if (!window.speechSynthesis) {
        window.showToast?.("متصفحك لا يدعم القراءة الصوتية.", "error");
        return;
    }
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }

    // Clean text from markdown/html
    const cleanText = text.replace(/<[^>]*>?/gm, '').replace(/[*_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ar-SA';

    utterance.pitch = 1.0;
    utterance.rate = 1.0;

    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-volume-up fa-fade"></i> يتحدث...';

    utterance.onend = () => { btn.innerHTML = originalHtml; };
    utterance.onerror = () => { btn.innerHTML = originalHtml; };

    window.speechSynthesis.speak(utterance);
};

function setupSpeechServices() {
    const micBtn = document.getElementById('micBtn');
    if (!micBtn) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        micBtn.style.display = 'none';
        return;
    }

    const recognition = new SpeechRecognition();
    // Defaulting to Arabic tuning
    recognition.lang = 'ar-SA';
    recognition.interimResults = true;
    recognition.continuous = true;

    let isRecording = false;

    recognition.onresult = (e) => {
        let final_transcript = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) {
                final_transcript += e.results[i][0].transcript;
            }
        }
        if (messageInput && final_transcript) {
            // Append instead of overwrite
            const currentVal = messageInput.value.trim();
            messageInput.value = currentVal ? currentVal + ' ' + final_transcript : final_transcript;
            messageInput.style.height = 'auto';
            messageInput.style.height = Math.min(messageInput.scrollHeight, 180) + 'px';
        }
    };

    recognition.onend = () => {
        isRecording = false;
        micBtn.classList.remove('recording');
        micBtn.style.color = 'var(--text-primary)';
        micBtn.style.background = 'var(--bg-tertiary)';
        micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
    };

    micBtn.onclick = (e) => {
        e.preventDefault();
        if (isRecording) {
            recognition.stop();
        } else {
            // Set dynamic language based on UI or default to AR/EN hybrid support if browser allows
            const currentLang = localStorage.getItem('tunisiaLang') || 'ar';
            recognition.lang = (currentLang === 'en') ? 'en-US' : 'ar-SA';

            recognition.start();
            isRecording = true;
            micBtn.classList.add('recording');
            micBtn.style.color = 'white';
            micBtn.style.background = '#ef4444';
            micBtn.innerHTML = '<i class="fa-solid fa-microphone-slash fa-beat"></i>';
        }
    };
}


// ========== PDF Export ==========
window.exportToPDF = () => {
    const chatContainer = document.getElementById('messagesWrapper');
    if (!chatContainer || chatContainer.children.length === 0) {
        return alert("لا توجد محادثة لتصديرها.");
    }

    const toast = document.getElementById('toast');
    if (toast) { toast.textContent = '📄 جاري تجهيز ملف PDF...'; toast.className = 'toast show'; }

    // إنشاء نسخة مؤقتة وتنسيقها للطباعة
    const printArea = document.createElement('div');
    printArea.innerHTML = chatContainer.innerHTML;
    printArea.style.padding = '20px';
    printArea.style.background = '#ffffff';
    printArea.style.color = '#000000';
    printArea.querySelectorAll('.msg-actions').forEach(el => el.remove());
    printArea.querySelectorAll('.suggestion-card').forEach(el => el.remove());
    printArea.querySelectorAll('.confidence-score').forEach(el => el.remove());

    // Add header
    const header = document.createElement('h2');
    header.style.textAlign = 'center';
    header.style.color = '#10b981';
    header.innerText = 'محادثة ذكية - MindTY AI';
    printArea.prepend(header);

    const opt = {
        margin: 10,
        filename: `chat-${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(printArea).save().then(() => {
        if (toast) { toast.textContent = '✅ تم التصدير بنجاح!'; toast.className = 'toast show success'; setTimeout(() => toast.className = 'toast', 3000); }
    });
};

// ========== Text Export ==========
window.exportToText = () => {
    const chatContainer = document.getElementById('messagesWrapper');
    if (!chatContainer || chatContainer.children.length === 0) {
        return alert("لا توجد محادثة لتصديرها.");
    }

    let textContent = "محادثة ذكية - MindTY AI\n\n";
    const messages = chatContainer.querySelectorAll('.message');
    messages.forEach(msg => {
        const isUser = msg.classList.contains('user');
        const sender = isUser ? "أنت" : "MindTY AI";
        const contentNode = msg.querySelector('.msg-content');
        if(contentNode) {
            let text = contentNode.innerText.trim();
            textContent += `${sender}:\n${text}\n\n------------------------\n\n`;
        }
    });

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    const toast = document.getElementById('toast');
    if (toast) { toast.textContent = '✅ تم التصدير النصي بنجاح!'; toast.className = 'toast show success'; setTimeout(() => toast.className = 'toast', 3000); }
};

// ========== Image Export ==========
window.exportToImage = () => {
    const chatContainer = document.getElementById('messagesWrapper');
    if (!chatContainer || chatContainer.children.length === 0) {
        return alert("لا توجد محادثة لتصديرها.");
    }

    const toast = document.getElementById('toast');
    if (toast) { toast.textContent = '🖼️ جاري تجهيز الصورة...'; toast.className = 'toast show'; }

    // Use html2canvas via html2pdf library bundle or native html2canvas if available
    // html2pdf bundle usually includes html2canvas globally
    if (typeof html2canvas === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = () => doImageExport();
        document.head.appendChild(script);
    } else {
        doImageExport();
    }

    function doImageExport() {
        const printArea = document.createElement('div');
        printArea.innerHTML = chatContainer.innerHTML;
        printArea.style.padding = '20px';
        printArea.style.background = '#1e1e1e'; // dark theme background
        printArea.style.color = '#ffffff';
        printArea.querySelectorAll('.msg-actions').forEach(el => el.remove());
        printArea.querySelectorAll('.suggestion-card').forEach(el => el.remove());

        const header = document.createElement('h2');
        header.style.textAlign = 'center';
        header.style.color = '#10b981';
        header.innerText = 'محادثة ذكية - MindTY AI';
        printArea.prepend(header);

        document.body.appendChild(printArea);
        printArea.style.position = 'absolute';
        printArea.style.left = '-9999px';

        html2canvas(printArea, { scale: 2, backgroundColor: '#1e1e1e', useCORS: true }).then(canvas => {
            const a = document.createElement('a');
            a.href = canvas.toDataURL('image/jpeg', 0.9);
            a.download = `chat-${Date.now()}.jpg`;
            a.click();
            document.body.removeChild(printArea);
            if (toast) { toast.textContent = '✅ تم تصدير الصورة بنجاح!'; toast.className = 'toast show success'; setTimeout(() => toast.className = 'toast', 3000); }
        }).catch(err => {
            document.body.removeChild(printArea);
            console.error('Image Export Error:', err);
            if (toast) { toast.textContent = '⚠️ فشل تصدير الصورة.'; toast.className = 'toast show error'; setTimeout(() => toast.className = 'toast', 3000); }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initChat();
    setupSpeechServices();
});
