// api.js — Backend API communication
const API_URL = '/api';

async function sendChatMessage(prompt, userContext = {}) {
    try {
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, userContext })
        });
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = { message: text };
        }

        if (response.status === 429) return { answer: data.message, error: 'rate_limit' };
        if (response.status === 503) {
            showMaintenanceOverlay(data.message);
            return { answer: data.message, error: 'maintenance' };
        }
        if (response.status === 403) {
            window.showToast?.('تم حظر حسابك. يرجى التواصل مع الدعم.', 'error');
            setTimeout(() => { auth.signOut(); window.location.reload(); }, 3000);
            return { answer: 'حسابك محظور.', error: 'banned' };
        }
        
        if (!response.ok) {
            throw new Error(data.message || data.error || response.statusText);
        }
        return data;
    } catch (error) {
        console.error('Chat API Error:', error);
        return { answer: `خطأ في الاتصال: ${error.message}`, error: true, source: 'error' };
    }
}


