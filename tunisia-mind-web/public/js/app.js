// app.js — Initialization
console.log('🧠 MindTY Engine v3.0.1 Active');
window.currentChatId = null;

// ========== FORGE STUDIO LOGIC ==========
const FORGE_URL = 'https://ai-coder-forge--youssefbensolt1.replit.app';

window.openForgeStudio = () => {
    const mainChat = document.getElementById('mainChatArea');
    const forgeStudio = document.getElementById('forgeStudioContainer');
    const iframe = document.getElementById('forgeIframe');

    if (mainChat && forgeStudio && iframe) {
        mainChat.style.display = 'none';
        forgeStudio.style.display = 'flex';
        
        // Load URL if not loaded yet
        if (iframe.src === 'about:blank' || iframe.src === '') {
            iframe.src = FORGE_URL;
        }

        // Close sidebar on mobile if open
        if (window.innerWidth < 768) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.remove('open');
        }
    }
};

window.closeForgeStudio = () => {
    const mainChat = document.getElementById('mainChatArea');
    const forgeStudio = document.getElementById('forgeStudioContainer');

    if (mainChat && forgeStudio) {
        forgeStudio.style.display = 'none';
        mainChat.style.display = 'flex';
    }
};

// Bind the button click
document.addEventListener('DOMContentLoaded', () => {
    const forgeBtn = document.getElementById('openForgeBtn');
    if (forgeBtn) {
        forgeBtn.onclick = (e) => {
            e.preventDefault();
            window.openForgeStudio();
        };
    }
});
