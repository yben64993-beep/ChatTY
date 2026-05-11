// ui.js — Sidebar, History, Chat Management
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay') || createSidebarOverlay();
    sidebar.classList.toggle('active');
    overlay.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
}

window.openLightbox = (url) => {
    const lBox = document.getElementById('imageLightbox');
    const lImg = document.getElementById('lightboxImg');
    if (lBox && lImg) {
        lImg.src = url;
        lBox.style.display = 'flex';
        setTimeout(() => lBox.classList.add('active'), 10);
    }
};

window.closeLightbox = () => {
    const lBox = document.getElementById('imageLightbox');
    if (lBox) {
        lBox.classList.remove('active');
        setTimeout(() => lBox.style.display = 'none', 300);
    }
};

window.closeSidebarIfMobile = () => {
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            const overlay = document.getElementById('sidebarOverlay');
            if (overlay) overlay.style.display = 'none';
        }
    }
};

function createSidebarOverlay() {
    const div = document.createElement('div');
    div.id = 'sidebarOverlay';
    div.className = 'sidebar-overlay';
    div.addEventListener('click', toggleSidebar);
    document.body.appendChild(div);
    return div;
}

window.showSettings = () => {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');

        // Populate profile fields
        if (window.currentUserProfile) {
            const p = window.currentUserProfile;
            const email = p.email || window.currentUser?.email || '';
            const elFirst = document.getElementById('profileFirstName');
            const elLast = document.getElementById('profileLastName');
            const elAge = document.getElementById('profileAge');
            const elEmail = document.getElementById('profileEmail');
            const elAccountEmail = document.getElementById('accountEmail');

            if (elFirst) elFirst.value = p.firstName || '';
            if (elLast) elLast.value = p.lastName || '';
            if (elAge) elAge.value = p.age || '';
            if (elEmail) elEmail.value = email;
            if (elAccountEmail) elAccountEmail.value = email;

            // Updated Streak Display
            const streakCountEl = document.getElementById('streakCount');
            if (streakCountEl) streakCountEl.textContent = p.streak || localStorage.getItem('tm-streak') || '0';
        }
    }
};

window.closeModals = () => {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    // Also specifically hide if display:flex was used
    document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
};

window.updateQuotaDisplay = () => {
    const countEl = document.getElementById('quotaCount');
    const fillEl = document.getElementById('quotaProgressFill');
    const labelEl = document.getElementById('quotaLabel');
    if (!countEl) return;

    const userMsgs = document.querySelectorAll('#messagesWrapper .message.user').length;
    let remaining = 0;
    let max = 50;
    let label = "نقطة";

    // If there are messages in the wrapper OR a chat is active, show the 100-msg countdown
    if (userMsgs > 0 || window.currentChatId) {
        remaining = Math.max(0, 100 - userMsgs);
        max = 100;
        label = "رسالة";
    } else {
        // Show daily points if no chat is started
        remaining = (window.currentUserProfile?.bonusMessages) || 0;
        max = (window.currentUserProfile?.isGuest) ? 100 : 50;
        label = (window.currentUserProfile?.isGuest) ? "رسالة" : "نقطة";
    }

    countEl.textContent = remaining;
    if (labelEl) labelEl.textContent = label;

    if (fillEl) {
        const p = Math.min(100, Math.max(0, (remaining / max) * 100));
        fillEl.style.width = p + '%';
        fillEl.style.background = p < 20 ? '#ef4444' : '#10b981';
    }
};


// Remove updateBackgroundsUI and applyBackground// نظام إدارة تاريخ الدردشة
window.loadChatHistory = async () => {
    if (!window.currentUser) return;
    if (window.currentUser.isGuest) {
        const historyContainer = document.getElementById('historyList');
        if (historyContainer) historyContainer.innerHTML = '<div style="text-align:center; padding:15px; font-size:0.8rem; opacity:0.5;">وضع الضيف (سجل مؤقت)</div>';
        return;
    }
    if (!window.firebaseDb || !window.fsCore) return;
    const historyContainer = document.getElementById('historyList');
    const pinnedContainer = document.getElementById('pinnedChatsList');
    const archivedContainer = document.getElementById('archivedChatsList');

    if (historyContainer) historyContainer.innerHTML = '';
    if (pinnedContainer) pinnedContainer.innerHTML = '';
    if (archivedContainer) archivedContainer.innerHTML = '';

    try {
        const { collection, query, orderBy, getDocs } = window.fsCore;
        const chatsRef = collection(window.firebaseDb, 'users', window.currentUser.uid, 'chats');
        const q = query(chatsRef, orderBy('updatedAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const lang = localStorage.getItem('tunisiaLang') || 'ar';
        const trans = window.translations?.[lang] || window.translations?.['ar'];

        let hasPinned = false;
        let hasArchived = false;

        const now = Date.now();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

        querySnapshot.forEach((doc) => {
            const chat = doc.data();
            const chatId = doc.id;

            // Auto-archive maintenance 🧹
            // If chat is older than 7 days, not pinned, and not already archived
            if (now - (chat.updatedAt || 0) > sevenDaysMs && !chat.isPinned && !chat.isArchived) {
                window.archiveChat(chatId, true);
                return; // Skip rendering in history as it moved to archive
            }

            const chatItem = renderHistoryItem(chatId, chat, trans);

            if (chat.isPinned) {
                pinnedContainer?.appendChild(chatItem);
                hasPinned = true;
            } else if (chat.isArchived) {
                archivedContainer?.appendChild(chatItem);
                hasArchived = true;
            } else {
                historyContainer?.appendChild(chatItem);
            }
        });

        if (document.getElementById('pinnedSection')) {
            document.getElementById('pinnedSection').style.display = hasPinned ? 'block' : 'none';
        }
        // Update archive modal state if open
        const archiveModal = document.getElementById('archiveModal');
        if (archiveModal && archiveModal.style.display === 'flex') {
            const list = document.getElementById('archivedChatsList');
            if (list && list.children.length === 0) {
                list.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-secondary); opacity:0.6;">${lang === 'en' ? 'No archived chats' : 'لا توجد محادثات مؤرشفة'}</div>`;
            }
        }
    } catch (error) {
        console.error('Error loading history:', error);
    }
};

function renderHistoryItem(chatId, chat, trans) {
    const container = document.createElement('div');
    container.className = 'history-item-container';
    container.dataset.id = chatId;

    container.innerHTML = `
        <div class="swipe-bg delete" style="opacity:0; transition: opacity 0.2s;"><i class="fa-solid fa-trash"></i></div>
        <div class="swipe-bg archive" style="opacity:0; transition: opacity 0.2s;"><i class="fa-solid fa-box-archive"></i></div>
        <div class="history-item ${window.currentChatId === chatId ? 'active' : ''}" id="item-${chatId}" style="transform: translateX(0);">
            <i class="fa-regular fa-message"></i>
            <span>${chat.title || trans.new_chat || 'New Chat'}</span>
        </div>
    `;

    const item = container.querySelector('.history-item');
    const delBg = container.querySelector('.swipe-bg.delete');
    const arcBg = container.querySelector('.swipe-bg.archive');

    item.onclick = (e) => {
        if (item.dataset.swiping === 'true') {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        window.openChat(chatId);
        window.closeSidebarIfMobile();
    };

    // Swipe logic
    let startX = 0;
    let currentX = 0;
    let isSwiping = false;

    item.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isSwiping = true;
        item.dataset.swiping = 'false';
        item.style.transition = 'none';
    }, { passive: true });

    item.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        currentX = e.touches[0].clientX - startX;

        if (Math.abs(currentX) > 10) item.dataset.swiping = 'true';

        // Limit movement
        if (currentX > 120) currentX = 120;
        if (currentX < -120) currentX = -120;

        item.style.transform = `translateX(${currentX}px)`;

        // Show backgrounds
        if (currentX > 30) {
            delBg.style.opacity = '1';
            arcBg.style.opacity = '0';
        } else if (currentX < -30) {
            arcBg.style.opacity = '1';
            delBg.style.opacity = '0';
        } else {
            delBg.style.opacity = '0';
            arcBg.style.opacity = '0';
        }
    }, { passive: true });

    const handleSwipeEnd = () => {
        if (!isSwiping) return;
        isSwiping = false;
        item.style.transition = 'transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)';

        if (currentX > 80) {
            item.style.transform = 'translateX(100%)';
            setTimeout(() => window.deleteChatFromMenu(chatId), 300);
        } else if (currentX < -80) {
            item.style.transform = 'translateX(-100%)';
            setTimeout(() => window.archiveChat(chatId, !chat.isArchived), 300);
        } else {
            item.style.transform = 'translateX(0)';
            setTimeout(() => { item.dataset.swiping = 'false'; }, 50);
        }
        currentX = 0;
        setTimeout(() => {
            delBg.style.opacity = '0';
            arcBg.style.opacity = '0';
        }, 300);
    };

    item.addEventListener('touchend', handleSwipeEnd);

    // Mouse events for desktop drag
    item.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        isSwiping = true;
        item.dataset.swiping = 'false';
        item.style.transition = 'none';
    });

    item.addEventListener('mousemove', (e) => {
        if (!isSwiping) return;
        currentX = e.clientX - startX;

        if (Math.abs(currentX) > 10) item.dataset.swiping = 'true';

        if (currentX > 120) currentX = 120;
        if (currentX < -120) currentX = -120;

        item.style.transform = `translateX(${currentX}px)`;

        if (currentX > 30) {
            delBg.style.opacity = '1';
            arcBg.style.opacity = '0';
        } else if (currentX < -30) {
            arcBg.style.opacity = '1';
            delBg.style.opacity = '0';
        } else {
            delBg.style.opacity = '0';
            arcBg.style.opacity = '0';
        }
    });

    item.addEventListener('mouseup', handleSwipeEnd);
    item.addEventListener('mouseleave', handleSwipeEnd);

    return container;
}

window.archiveChat = async (chatId, state = true) => {
    if (!chatId || !window.currentUser || !window.fsCore) return;
    try {
        const { doc, updateDoc } = window.fsCore;
        const chatRef = doc(window.firebaseDb, 'users', window.currentUser.uid, 'chats', chatId);
        await updateDoc(chatRef, { isArchived: state, updatedAt: Date.now() });
        window.showToast?.(state ? '✅ تمت الأرشفة' : '✅ تمت الإعادة من الأرشيف', 'success');
        window.loadChatHistory();
    } catch (e) {
        console.error('Archive error:', e);
        window.showToast?.('فشل تنفيذ العملية', 'error');
    }
};


window.openChat = async (chatId) => {
    if (!chatId || window.currentChatId === chatId) return;

    window.currentChatId = chatId;

    // إخفاء شاشة الترحيب وإظهار منطقة الرسائل
    document.getElementById('welcomeScreen').style.display = 'none';
    const wrapper = document.getElementById('messagesWrapper');
    wrapper.innerHTML = '<div class="loading-chats"><i class="fa-solid fa-spinner fa-spin"></i> جاري التحميل...</div>';

    try {
        const { collection, query, orderBy, getDocs } = window.fsCore;
        const messagesRef = collection(window.firebaseDb, 'users', window.currentUser.uid, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        const querySnapshot = await getDocs(q);

        wrapper.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const msg = doc.data();
            const isHtml = msg.isHtml === true;
            window.appendMessage?.(msg.content, msg.sender, isHtml);
        });

        // إظهار أزرار التحكم في المحادثة العلوية
        ['shareChatBtn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.style.display = 'block';
        });

        // إغلاق السايد بار في الموبايل
        window.closeSidebarIfMobile();
        window.loadChatHistory(); // لتحديث الحالة النشطة

    } catch (error) {
        console.error('خطأ في فتح المحادثة:', error);
        window.showToast?.('فشل تحميل المحادثة', 'error');
    }
};

window.deleteChat = async (chatId) => {
    if (!chatId) { window.showToast?.('معرّف المحادثة غير متوفر', 'error'); return; }
    if (!window.currentUser) { window.showToast?.('يجب تسجيل الدخول أولاً', 'error'); return; }
    if (!window.fsCore?.deleteDoc) { window.showToast?.('خدمة قاعدة البيانات غير جاهزة', 'error'); return; }

    const uiItemContainer = document.querySelector(`.history-item-container[data-id="${chatId}"]`);
    if (uiItemContainer) uiItemContainer.style.display = 'none';

    if (window.currentChatId === chatId) {
        const mw = document.getElementById('messagesWrapper');
        if (mw) mw.innerHTML = '';
        const ws = document.getElementById('welcomeScreen');
        if (ws) ws.style.display = 'flex';
    }

    const deleteBtnInSidebar = document.querySelector(`.history-item .chat-action-btn[onclick*="'${chatId}'"]`);
    if (deleteBtnInSidebar) {
        deleteBtnInSidebar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        deleteBtnInSidebar.disabled = true;
    }

    try {
        const { doc, deleteDoc, collection, query, getDocs } = window.fsCore;
        const messagesRef = collection(window.firebaseDb, 'users', window.currentUser.uid, 'chats', chatId, 'messages');
        const messagesSnapshot = await getDocs(query(messagesRef));

        // Delete all messages in the subcollection
        const deletePromises = [];
        messagesSnapshot.forEach((messageDoc) => {
            deletePromises.push(deleteDoc(messageDoc.ref));
        });
        await Promise.all(deletePromises);

        // Now delete the chat document itself
        await deleteDoc(doc(window.firebaseDb, 'users', window.currentUser.uid, 'chats', chatId));

        if (window.currentChatId === chatId) {
            window.currentChatId = null;
            document.getElementById('messagesWrapper').innerHTML = '';
            document.getElementById('welcomeScreen').style.display = 'flex';
            ['shareChatBtn'].forEach(id => {
                const btn = document.getElementById(id);
                if (btn) btn.style.display = 'none';
            });
        }

        window.loadChatHistory();
        window.showToast?.('تم حذف المحادثة ✓', 'success');
    } catch (error) {
        console.error('خطأ في حذف المحادثة:', error.code, error.message);
        if (error.code === 'permission-denied') {
            window.showToast?.('لا تملك صلاحية حذف هذه المحادثة', 'error');
        } else {
            window.showToast?.(`فشل الحذف: ${error.message}`, 'error');
        }
        // Restore button if it failed
        if (deleteBtnInSidebar) {
            deleteBtnInSidebar.innerHTML = '<i class="fa-solid fa-ellipsis-vertical"></i>';
            deleteBtnInSidebar.disabled = false;
        }
    }
};

window.toggleChatMenu = (event, chatId) => {
    const allMenus = document.querySelectorAll('.history-context-menu');
    allMenus.forEach(m => {
        if (m.id !== `chat-menu-${chatId}`) m.style.display = 'none';
    });
    const menu = document.getElementById(`chat-menu-${chatId}`);
    if (menu) {
        menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
    }
};

window.deleteChatFromMenu = (chatId) => {
    const menu = document.getElementById(`chat-menu-${chatId}`);
    if (menu) menu.style.display = 'none';
    window.deleteChat(chatId);
};

window.exportChatFromMenu = (chatId, type) => {
    const menu = document.getElementById(`chat-menu-${chatId}`);
    if (menu) menu.style.display = 'none';
    if (type === 'pdf') window.exportToPDF?.(chatId);
    else if (type === 'text') window.exportToText?.(chatId);
    else if (type === 'image') window.exportToImage?.(chatId);
};

window.saveMessageToCurrentChat = async (content, sender, isHtml = false) => {
    if (!window.currentUser || !content) return;
    if (window.currentUser.isGuest) return; // Guests don't save to cloud
    if (!window.firebaseDb || !window.fsCore) return;
    try {
        const { collection, addDoc, doc, updateDoc, serverTimestamp } = window.fsCore;

        // إذا لم تكن هناك محادثة مفتوحة، ننشئ واحدة جديدة
        if (!window.currentChatId) {
            const chatsRef = collection(window.firebaseDb, 'users', window.currentUser.uid, 'chats');
            const chatDoc = await addDoc(chatsRef, {
                title: content.replace(/<[^>]*>?/gm, '').slice(0, 50) || "محادثة جديدة",
                updatedAt: Date.now(),
                isPinned: false,
                isArchived: false,
                createdAt: serverTimestamp()
            });
            window.currentChatId = chatDoc.id;
        }

        // إضافة الرسالة إلى المحادثة
        const messagesRef = collection(window.firebaseDb, 'users', window.currentUser.uid, 'chats', window.currentChatId, 'messages');
        await addDoc(messagesRef, {
            content,
            sender,
            isHtml,
            timestamp: serverTimestamp()
        });

        // تحديث وقت آخر نشاط للمحادثة لتصعد للأعلى في القائمة
        const chatRef = doc(window.firebaseDb, 'users', window.currentUser.uid, 'chats', window.currentChatId);
        await updateDoc(chatRef, { updatedAt: Date.now() });

        window.loadChatHistory();
    } catch (e) {
        console.error('Error saving message:', e);
    }
};

document.addEventListener('click', (e) => {
    if (!e.target.closest('.chat-actions')) {
        document.querySelectorAll('.history-context-menu').forEach(m => m.style.display = 'none');
    }
    const attachMenu = document.getElementById('attachMenu');
    const attachBtn = document.getElementById('attachBtnAlpha');
    if (attachMenu && attachBtn && !attachBtn.contains(e.target) && !attachMenu.contains(e.target)) {
        attachMenu.classList.remove('active');
    }
});

// initUI function
function initUI() {
    const toggleBtn = document.getElementById('toggleSidebarBtn');
    if (toggleBtn) toggleBtn.onclick = toggleSidebar;

    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) settingsBtn.onclick = (e) => { e.preventDefault(); window.showSettings(); window.closeSidebarIfMobile(); };

    document.querySelectorAll('.modal-close, .modal-close-icon').forEach(btn => {
        btn.onclick = window.closeModals;
    });

    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) {
        newChatBtn.onclick = () => {
            window.currentChatId = null;
            const mw = document.getElementById('messagesWrapper');
            if (mw) { mw.innerHTML = ''; mw.style.display = 'none'; }
            const ws = document.getElementById('welcomeScreen');
            if (ws) ws.style.display = 'flex';
            window.loadChatHistory();
            window.closeSidebarIfMobile();
        };
    }

    const openArchivesBtn = document.getElementById('openArchivesBtn');
    if (openArchivesBtn) {
        openArchivesBtn.onclick = () => {
            window.closeModals();
            const archiveModal = document.getElementById('archiveModal');
            if (archiveModal) {
                archiveModal.style.display = 'flex';
                setTimeout(() => archiveModal.classList.add('active'), 10);
            }
            window.loadChatHistory();
            window.closeSidebarIfMobile();
        };
    }

    const openSavedImagesBtn = document.getElementById('openSavedImagesBtn');
    if (openSavedImagesBtn) {
        openSavedImagesBtn.onclick = () => {
            window.closeModals();
            const modal = document.getElementById('savedImagesModal');
            if (modal) {
                modal.style.display = 'flex';
                setTimeout(() => modal.classList.add('active'), 10);
                window.loadSavedImages?.();
            }
            window.closeSidebarIfMobile();
        };
    }

    document.getElementById('closeSavedImagesBtn')?.addEventListener('click', window.closeModals);
    document.getElementById('closeArchiveBtn')?.addEventListener('click', window.closeModals);


    initSavedImagesLogic();
    initWebsiteBuilderLogic();
    // تحميل المحادثات عند البداية
    window.loadChatHistory();
}

function initWebsiteBuilderLogic() {
    const openBtn = document.getElementById('openWebsiteBuilderBtn');
    const modal = document.getElementById('websiteBuilderModal');
    const closeBtn = document.getElementById('closeWebsiteBuilderBtn');
    const tabCreate = document.getElementById('wb-tab-create');
    const tabEdit = document.getElementById('wb-tab-edit');
    const formCreate = document.getElementById('wb-create-form');
    const formEdit = document.getElementById('wb-edit-form');
    const submitBtn = document.getElementById('wb-submit-btn');

    if (!openBtn || !modal) return;

    // Only create mode is supported
    let currentMode = 'create';

    openBtn.onclick = () => {
        window.closeModals?.();
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
        window.closeSidebarIfMobile?.();
    };

    closeBtn.onclick = () => {
        modal.style.display = 'none';
        modal.classList.remove('active');
    };

    // Create tab (only tab now)
    if (tabCreate) {
        tabCreate.onclick = () => {
            currentMode = 'create';
            tabCreate.classList.add('active');
            if (formCreate) formCreate.style.display = 'block';
            if (formEdit) formEdit.style.display = 'none';
            resetFeedback();
        };
    }

    function resetFeedback() {
        document.getElementById('wb-result-area').style.display = 'none';
        document.getElementById('wb-error-area').style.display = 'none';
    }

    submitBtn.onclick = async () => {
        resetFeedback();

        let payload = { mode: currentMode };

        if (currentMode === 'create') {
            const prompt = document.getElementById('wb-create-prompt').value.trim();
            const slug = document.getElementById('wb-create-slug').value.trim();
            if (!prompt) { showError("الرجاء كتابة وصف الموقع."); return; }
            payload.prompt = prompt;
            if (slug) payload.slug = slug;
        }

        // إرفاق بيانات المستخدم إن وجدت
        if (window.currentUser) {
            payload.owner_email = window.currentUser.email || '';
            payload.owner_identifier = window.currentUser.uid;
        }

        const loadingStatus = document.getElementById('wb-loading-status');
        if (loadingStatus) loadingStatus.textContent = 'جاري إرسال الطلب...';
        document.getElementById('wb-loading').style.display = 'block';
        submitBtn.disabled = true;

        try {
            // الخطوة 1: إرسال الطلب والحصول على job_id فوراً
            const response = await fetch('/api/publish-website', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Server responded with ${response.status}: ${errText}`);
            }

            const data = await response.json();

            if (!data.success && data.status !== 'processing') {
                document.getElementById('wb-loading').style.display = 'none';
                submitBtn.disabled = false;
                showError(data.message || "حدث خطأ غير معروف.");
                return;
            }

            // حفظ الـ jobId للمتابعة حتى لو أغلق المستخدم الصفحة
            const jobId = data.job_id;
            localStorage.setItem('wb_active_job', jobId);

            // إغلاق المودال فوراً وإبلاغ المستخدم
            const modalEl = document.getElementById('websiteBuilderModal');
            modalEl.style.display = 'none';
            modalEl.classList.remove('active');
            
            if (window.showToast) {
                showToast("🚀 بدأنا بناء موقعك! سنقوم بإخطارك وفتح نافذة الروابط فور الجاهزية.", "info");
            } else {
                alert("🚀 بدأنا بناء موقعك! سنقوم بإخطارك وفتح نافذة الروابط فور الجاهزية.");
            }

            // بدء المتابعة
            trackJobStatus(jobId);

        } catch (e) {
            console.error("Website Builder API Error Details:", e);
            document.getElementById('wb-loading').style.display = 'none';
            submitBtn.disabled = false;
            showError(`فشل الاتصال: ${e.message}`);
        }
    };

    function updateWBSidebarIndicator(active) {
        const btn = document.getElementById('openWebsiteBuilderBtn');
        if (!btn) return;
        let badge = btn.querySelector('.wb-status-badge');
        if (active) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'wb-status-badge';
                badge.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                badge.style.cssText = 'margin-right:auto; margin-left:10px; font-size:0.8rem; background:rgba(255,255,255,0.2); padding:2px 6px; border-radius:10px;';
                btn.appendChild(badge);
            }
            btn.style.boxShadow = '0 0 15px rgba(16,185,129,0.6)';
        } else {
            if (badge) badge.remove();
            btn.style.boxShadow = '0 4px 14px rgba(16,185,129,0.35)';
        }
    }

    // دالة لمتابعة حالة المهمة (تعمل بشكل مستقل)
    async function trackJobStatus(jobId) {
        let elapsed = 0;
        const maxWait = 720; // 12 minutes
        const submitBtn = document.getElementById('wb-submit-btn');

        updateWBSidebarIndicator(true);

        const updateSteps = (seconds) => {
            const stepGen = document.getElementById('step-gen');
            const stepCode = document.getElementById('step-code');
            const stepDeploy = document.getElementById('step-deploy');
            const loadingStatus = document.getElementById('wb-loading-status');

            if (seconds < 15) {
                if (loadingStatus) loadingStatus.textContent = 'جاري تحليل طلبك...';
                if (stepGen) stepGen.style.opacity = '1';
            } else if (seconds < 60) {
                if (loadingStatus) loadingStatus.textContent = 'جاري كتابة الكود والتصميم...';
                if (stepGen) stepGen.innerHTML = '<i class="fa-solid fa-check" style="margin-left: 8px; color: #10b981;"></i> تم تجهيز المحتوى';
                if (stepGen) stepGen.style.opacity = '1';
                if (stepCode) stepCode.style.opacity = '1';
            } else if (seconds < 120) {
                if (loadingStatus) loadingStatus.textContent = 'جاري تحسين واجهة المستخدم...';
                if (stepCode) stepCode.innerHTML = '<i class="fa-solid fa-check" style="margin-left: 8px; color: #10b981;"></i> تم كتابة الأكواد';
                if (stepCode) stepCode.style.opacity = '1';
                if (stepDeploy) stepDeploy.style.opacity = '1';
            } else {
                if (loadingStatus) loadingStatus.textContent = 'جاري النشر النهائي...';
                if (stepDeploy) stepDeploy.style.opacity = '1';
            }
        };

        const pollInterval = setInterval(async () => {
            elapsed += 5;
            updateSteps(elapsed);

            if (elapsed >= maxWait) {
                clearInterval(pollInterval);
                localStorage.removeItem('wb_active_job');
                updateWBSidebarIndicator(false);
                if (window.showToast) showToast("⚠️ استغرقت العملية وقتاً طويلاً جداً. يرجى التحقق لاحقاً.", "error");
                else alert("⚠️ استغرقت العملية وقتاً طويلاً جداً. يرجى التحقق لاحقاً.");
                return;
            }

            try {
                const statusRes = await fetch(`/api/publish-status/${jobId}`);
                if (!statusRes.ok) throw new Error(`Status check failed: ${statusRes.status}`);
                const status = await statusRes.json();

                if (status.status === 'done') {
                    clearInterval(pollInterval);
                    localStorage.removeItem('wb_active_job');
                    updateWBSidebarIndicator(false);
                    
                    if (window.showToast) showToast("✅ اكتمل بناء موقعك بنجاح!", "success");

                    // فتح المودال تلقائياً وإظهار النتيجة
                    const resultModal = document.getElementById('websiteBuilderModal');
                    resultModal.style.display = 'flex';
                    setTimeout(() => resultModal.classList.add('active'), 10);

                    const resArea = document.getElementById('wb-result-area');
                    const resMsg = document.getElementById('wb-result-message');
                    const resLink = document.getElementById('wb-result-link');
                    
                    document.getElementById('wb-loading').style.display = 'none';
                    if (submitBtn) submitBtn.disabled = false;
                    
                    resArea.style.display = 'block';
                    resMsg.innerText = status.message || "تم تجهيز الموقع بنجاح!";
                    if (status.direct_url) {
                        resLink.href = status.direct_url;
                        resLink.style.display = 'inline-block';
                    } else {
                        resLink.style.display = 'none';
                    }

                } else if (status.status === 'error') {
                    clearInterval(pollInterval);
                    localStorage.removeItem('wb_active_job');
                    updateWBSidebarIndicator(false);
                    
                    if (window.showToast) showToast(`❌ فشل بناء الموقع: ${status.message}`, "error");
                    
                    // إظهار الخطأ في المودال لو كان مفتوحاً
                    const modalEl = document.getElementById('websiteBuilderModal');
                    if (modalEl.style.display === 'flex') {
                        showError(status.message);
                        document.getElementById('wb-loading').style.display = 'none';
                        if (submitBtn) submitBtn.disabled = false;
                    }
                } else if (status.status === 'not_found') {
                    clearInterval(pollInterval);
                    localStorage.removeItem('wb_active_job');
                    updateWBSidebarIndicator(false);
                    console.warn("Job not found on server, stopping poll.");
                }
            } catch (pollErr) {
                console.warn('Polling error:', pollErr.message);
            }
        }, 5000);
    }

    // فحص إذا كان هناك طلب قيد التنفيذ عند فتح الصفحة
    const savedJob = localStorage.getItem('wb_active_job');
    if (savedJob) {
        trackJobStatus(savedJob);
    }

    function showError(msg) {
        const errArea = document.getElementById('wb-error-area');
        const errMsg = document.getElementById('wb-error-message');
        if (errArea && errMsg) {
            errMsg.innerText = msg;
            errArea.style.display = 'block';
        }
    }
}


function initSavedImagesLogic() {
    window.loadSavedImages = () => {
        const grid = document.getElementById('savedImagesGrid');
        if (!grid) return;

        const images = JSON.parse(localStorage.getItem('tm-saved-images') || '[]');
        if (images.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--text-secondary);"><i class="fa-solid fa-images" style="font-size:3rem; opacity:0.2; margin-bottom:15px; display:block;"></i> لا توجد صور محفوظة حالياً</div>`;
            return;
        }

        grid.innerHTML = images.map((img, idx) => `
            <div class="saved-image-item">
                <img src="${img.url}" loading="lazy" onclick="window.openLightbox('${img.url}')" style="cursor:zoom-in;">
                <div class="saved-image-actions">
                    <button class="img-action-btn-small" onclick="window.downloadSavedImage('${img.url}')"><i class="fa-solid fa-download"></i></button>
                    <button class="img-action-btn-small" style="background:#e74c3c" onclick="window.deleteSavedImage(${idx})"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    };

    window.saveImageLocally = (url) => {
        const images = JSON.parse(localStorage.getItem('tm-saved-images') || '[]');
        if (!images.find(i => i.url === url)) {
            images.unshift({ url, date: Date.now() });
            localStorage.setItem('tm-saved-images', JSON.stringify(images.slice(0, 50))); // Keep last 50
        }
    };

    window.downloadSavedImage = (url) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `TunisiaMind_${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    window.deleteSavedImage = (index) => {
        let images = JSON.parse(localStorage.getItem('tm-saved-images') || '[]');
        images.splice(index, 1);
        localStorage.setItem('tm-saved-images', JSON.stringify(images));
        window.loadSavedImages();
    };
}

// Call init on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
} else {
    initUI();
}
