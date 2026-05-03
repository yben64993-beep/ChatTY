// invite.js — Referral system

document.addEventListener('DOMContentLoaded', async () => {
    // Check for ?ref= on page load
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
        sessionStorage.setItem('referredBy', ref);
        console.log('Referred by:', ref);
        
        // Wait for Firebase to be ready to fetch inviter name
        const checkFirebase = setInterval(async () => {
            if (window.firebaseDb && window.fsCore) {
                clearInterval(checkFirebase);
                try {
                    const { doc, getDoc } = window.fsCore;
                    const inviterSnap = await getDoc(doc(window.firebaseDb, 'users', ref));
                    if (inviterSnap.exists()) {
                        const inviterName = inviterSnap.data().displayName || inviterSnap.data().firstName || 'صديق';
                        sessionStorage.setItem('inviterName', inviterName);
                        // Trigger signup form
                        if (window.showForm) {
                            window.showForm('signupForm');
                            const banner = document.getElementById('referralBanner');
                            if (banner) {
                                banner.style.display = 'block';
                                banner.innerHTML = `🌟 أنت تقبل دعوة صديقك <b>${inviterName}</b> للانضمام إلى MindTY!`;
                            }
                        }
                    }
                } catch(e) { console.error('Inviter fetch error:', e); }
            }
        }, 500);
    }
});

// Called from auth.js after a new user registers
window.creditReferral = async function(newUserId) {
    const referrerId = sessionStorage.getItem('referredBy');
    if (!referrerId || !window.firebaseDb || referrerId === newUserId) return;
    try {
        const { doc, getDoc, updateDoc, increment } = window.fsCore;
        const referrerRef = doc(window.firebaseDb, 'users', referrerId);
        const referrerSnap = await getDoc(referrerRef);
        if (referrerSnap.exists()) {
            await updateDoc(referrerRef, {
                bonusMessages: increment(50),
                totalReferrals: increment(1)
            });
        }
        // Give new user bonus
        const newUserRef = doc(window.firebaseDb, 'users', newUserId);
        await updateDoc(newUserRef, { bonusMessages: increment(20) });
        sessionStorage.removeItem('referredBy');
        console.log('Referral credited.');
    } catch(e) { console.error('Referral Error:', e); }
};
