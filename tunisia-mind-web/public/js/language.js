// language.js

function applyTranslations(lang) {
  const trans = window.translations?.[lang];
  if (!trans) {
    console.warn(`No translations found for language: ${lang}`);
    return;
  }

  // Translate text content
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (trans[key] !== undefined) {
      el.innerHTML = trans[key];
    }
  });

  // Translate placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (trans[key] !== undefined) {
      el.placeholder = trans[key];
    }
  });

  // Translate titles (tooltips)
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (trans[key] !== undefined) {
      el.title = trans[key];
    }
  });
}

function setLanguage(lang, dir) {
  const trans = window.translations?.[lang];
  if (!trans) {
    console.warn(`Language '${lang}' not supported.`);
    return;
  }

  const finalDir = dir || trans.dir || (lang === 'ar' ? 'rtl' : 'ltr');

  // Save preference
  localStorage.setItem('mindtyLang', lang);
  localStorage.setItem('mindtyDirection', finalDir);

  // Update DOM direction & lang
  document.documentElement.lang = lang;
  document.documentElement.dir = finalDir;
  
  // Apply a class to body for CSS targeting if needed
  document.body.classList.remove('rtl-dir', 'ltr-dir');
  document.body.classList.add(`${finalDir}-dir`);

  // Apply text
  applyTranslations(lang);

  // Update active button classes
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });
}

// Make functions global so settings.js and others can call them
window.applyTranslations = applyTranslations;
window.setLanguage = setLanguage;
window.getCurrentLang = () => localStorage.getItem('mindtyLang') || 'ar';

document.addEventListener('DOMContentLoaded', () => {
  // Set initial language from storage or default to Arabic
  const savedLang = localStorage.getItem('mindtyLang') || 'ar';
  const savedDir = localStorage.getItem('mindtyDirection') || 'rtl';
  setLanguage(savedLang, savedDir);

  // Add event listeners to language buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      const dir = btn.getAttribute('data-dir') || (lang === 'ar' ? 'rtl' : 'ltr');
      setLanguage(lang, dir);
    });
  });

  // Re-apply translations after a small delay to catch any late-rendered elements
  setTimeout(() => {
    const lang = localStorage.getItem('mindtyLang') || 'ar';
    applyTranslations(lang);
  }, 500);
});
