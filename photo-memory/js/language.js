/**
 * 语言管理器 - 处理多语言支持
 */
class LanguageManager {
    constructor() {
        this.currentLanguage = 'zh-CN';
        this.translations = {};
    }

    async loadLanguage(lang) {
        try {
            const response = await fetch(`lang/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load language file: ${lang}.json`);
            }
            this.translations = await response.json();
            this.currentLanguage = lang;
            this.updateUI();
        } catch (error) {
            console.error('Error loading language:', error);
        }
    }

    updateUI() {
        document.querySelectorAll('[data-lang-key]').forEach(element => {
            const key = element.getAttribute('data-lang-key');
            if (this.translations[key]) {
                element.textContent = this.translations[key];
            }
        });
    }

    getTranslation(key) {
        return this.translations[key] || key;
    }
}

export { LanguageManager };