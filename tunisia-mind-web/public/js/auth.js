// auth.js — Firebase Authentication with Conversational Signup and Email Code Verification
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider,
    sendPasswordResetEmail,
    updateEmail,
    updateProfile,
    onAuthStateChanged,
    signOut,
    reload,
    browserLocalPersistence,
    setPersistence
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
    getFirestore,
    doc, setDoc, getDoc, updateDoc, deleteDoc,
    collection, addDoc, serverTimestamp,
    query, orderBy, getDocs, where, increment
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDdkMJBY07emVGa-8qNImJJm2_jjs24oQk",
    authDomain: "tunisia-mind.firebaseapp.com",
    projectId: "tunisia-mind",
    storageBucket: "tunisia-mind.firebasestorage.app",
    messagingSenderId: "57593992930",
    appId: "1:575939929130:web:4baaa92ebe293a39d5cf53"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Ensure auth state persists across page reloads
setPersistence(auth, browserLocalPersistence).catch(e => console.warn('Persistence warning:', e));
auth.useDeviceLanguage(); // Set language to user's browser language

window.firebaseAuth = auth;
window.firebaseDb = db;
window.fsCore = { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, addDoc, serverTimestamp, query, orderBy, getDocs, where, increment };
window.tmLogout = () => {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
};

window.confirmFinalLogout = async () => {
    try {
        if (window.closeModals) window.closeModals();
        await signOut(auth);
    } catch (e) {
        console.error("Sign out error, attempting to clear storage and reload.", e);
    }

    // Clear everything regardless of signOut success or failure
    sessionStorage.clear();
    localStorage.clear();

    // Redirect to the root to ensure a full, clean reload
    window.location.href = '/';
};

// Initial listener for the custom modal buttons
const setupModalButtons = () => {
    document.getElementById('confirmLogoutBtn')?.addEventListener('click', window.confirmFinalLogout);
    document.getElementById('cancelLogoutBtn')?.addEventListener('click', () => {
        const modal = document.getElementById('logoutModal');
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
        }
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupModalButtons);
} else {
    setupModalButtons();
}

window.firebaseSignOut = window.tmLogout;

// ربط جميع أزرار تسجيل الخروج
const attachAllLogoutButtons = () => {
    const buttons = ['mainLogoutBtn', 'sidebarLogoutBtn'];
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.removeAttribute('onclick');
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.closeSidebarIfMobile) window.closeSidebarIfMobile();
                window.tmLogout();
                return false;
            };
        }
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachAllLogoutButtons);
} else {
    attachAllLogoutButtons();
}
setTimeout(attachAllLogoutButtons, 1000);
setTimeout(attachAllLogoutButtons, 3000);

window.currentUser = null;
window.currentUserProfile = {};

function showAuthModal() {
    if (document.getElementById('splashScreen')) return;
    const m = document.getElementById('authModal');
    if (m) { m.style.display = 'flex'; m.classList.add('active'); }
}
function hideAuthModal() {
    const m = document.getElementById('authModal');
    if (m) { m.style.display = 'none'; m.classList.remove('active'); }
}
window.showAuthModal = showAuthModal;
window.hideAuthModal = hideAuthModal;

// Handle Redirect Result (for mobile/blocked popups)
getRedirectResult(auth).catch(e => {
    if (e.code && e.code !== 'auth/popup-closed-by-user') {
        console.error("Redirect Result Error:", e);
    }
});

onAuthStateChanged(auth, async (user) => {
    const isGuest = sessionStorage.getItem('tm-guest-mode') === 'true';
    
    if (user) {
        sessionStorage.removeItem('tm-guest-mode'); // Clear guest mode if logged in
        try {
            const snap = await getDoc(doc(db, 'users', user.uid));
            window.currentUser = user;
            const profile = snap.exists() ? snap.data() : {};
            
            // Fix: Ensure new or older users without the field get 50 messages
            if (profile && profile.bonusMessages === undefined) {
                profile.bonusMessages = 50;
                setDoc(doc(db, 'users', user.uid), { bonusMessages: 50 }, { merge: true }).catch(e => console.warn("Failed to auto-gift points:", e));
            }

            // Assign a unique 9-digit userId if user doesn't have one
            if (profile && !profile.userId) {
                const newUserId = String(Math.floor(100000000 + Math.random() * 900000000));
                profile.userId = newUserId;
                setDoc(doc(db, 'users', user.uid), { userId: newUserId }, { merge: true }).catch(e => console.warn("Failed to assign userId:", e));
            }
            
            window.currentUserProfile = profile;
            window.currentUserProfile.bonusMessages = Number(profile.bonusMessages) || 0;
            window.currentUserProfile.isGuest = false;

            const displayName = profile.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : (user.displayName || user.email.split('@')[0]);
            document.getElementById('userNameDisplay').textContent = displayName;

            const avatar = profile.photoBase64 || profile.photoURL || user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`;
            const sidebarAvatar = document.getElementById('sidebarAvatar');
            if (sidebarAvatar) sidebarAvatar.src = avatar;
            window.currentUserProfile.photoURL = avatar;

        } catch (dbError) {
            console.warn("Could not fetch user profile from DB:", dbError);
            window.currentUser = user;
            window.currentUserProfile = { 
                email: user.email, 
                isEmailVerified: true, 
                bonusMessages: 50,
                isGuest: false
            };
            document.getElementById('userNameDisplay').textContent = user.email.split('@')[0];
        }

        hideAuthModal();
        if (window.loadChatHistory) window.loadChatHistory();
        if (window.updateQuotaDisplay) window.updateQuotaDisplay();
    } else if (isGuest) {
        window.currentUser = { uid: 'guest_user', displayName: 'ضيف', isGuest: true };
        const guestBonus = Number(localStorage.getItem('tm-guest-bonus')) || 100;
        window.currentUserProfile = { firstName: 'ضيف', lastName: '', bonusMessages: guestBonus, isGuest: true };
        document.getElementById('userNameDisplay').textContent = 'ضيف (Guest)';
        
        // Change logout to login in sidebar for guests
        const logoutBtn = document.getElementById('sidebarLogoutBtn');
        if (logoutBtn) {
            logoutBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> <span data-i18n="login">تسجيل الدخول</span>';
            logoutBtn.onclick = () => { window.showAuthModal(); return false; };
        }
        
        // Show guest prompt in sidebar
        const guestPrompt = document.getElementById('guestSidebarPrompt');
        if (guestPrompt) guestPrompt.style.display = 'block';

        hideAuthModal();
        if (window.updateQuotaDisplay) window.updateQuotaDisplay();
    } else {
        window.currentUser = null;
        window.currentUserProfile = {};
        showAuthModal();
    }
});

async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        
        if (!snap.exists()) {
            let userAge = 18; 

            const nameParts = (user.displayName || '').split(' ');
            const firstName = nameParts[0] || 'مستخدم';
            const lastName = nameParts.slice(1).join(' ') || 'جوجل';

            const profileData = {
                uid: user.uid,
                email: user.email,
                firstName: firstName,
                lastName: lastName,
                displayName: user.displayName || user.email.split('@')[0],
                age: userAge,
                photoURL: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firstName)}`,
                isEmailVerified: true,
                bonusMessages: 50,
                msgCount: 0,
                userId: String(Math.floor(100000000 + Math.random() * 900000000)),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            
            await setDoc(userRef, profileData);
            window.currentUserProfile = profileData;
        } else {
            window.currentUserProfile = snap.data();
        }
        
        hideAuthModal();
        if (window.loadChatHistory) window.loadChatHistory();
        window.showToast?.('تم تسجيل الدخول بجوجل بنجاح!', 'success');
        
    } catch (error) {
        if (error.code === 'auth/popup-blocked' || (error.message || '').includes('cross-origin') || (error.message || '').includes('cookies')) {
            window.showToast?.('جاري محاولة تسجيل الدخول عبر التحويل...', 'info');
            try {
                await signInWithRedirect(auth, provider);
            } catch (err2) {
                console.error("Redirect Login Error:", err2);
                window.showToast?.('فشل تسجيل الدخول. يرجى التأكد من إعدادات المتصفح.', 'error');
            }
        } else if (error.code !== 'auth/popup-closed-by-user') {
            window.showToast?.(`فشل تسجيل الدخول: ${error.message}`, 'error');
        } else {
            // Popup closed by user or browser forcefully closed it.
            // On some mobile devices, popup closes automatically. Fallback to redirect.
            if (window.innerWidth <= 768) {
                 window.showToast?.('جاري محاولة تسجيل الدخول...', 'info');
                 signInWithRedirect(auth, provider).catch(e => console.error(e));
            }
        }
    }
}

function loginAsGuest() {
    sessionStorage.setItem('tm-guest-mode', 'true');
    window.currentUser = { uid: 'guest_user', displayName: 'ضيف', isGuest: true };
    window.currentUserProfile = { firstName: 'ضيف', lastName: '', bonusMessages: 100, isGuest: true };
    document.getElementById('userNameDisplay').textContent = 'ضيف (Guest)';
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    if (sidebarAvatar) sidebarAvatar.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=Guest';
    hideAuthModal();
    if (window.updateQuotaDisplay) window.updateQuotaDisplay();
    // Guests don't have cloud history, but can start a new chat
    if (window.loadChatHistory) window.loadChatHistory(); 
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('googleLoginBtn')?.addEventListener('click', loginWithGoogle);
    document.getElementById('guestLoginBtn')?.addEventListener('click', loginAsGuest);
});
