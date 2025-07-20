import { LanguageManager } from './language.js';

/**
 * 负责处理用户认证
 */
class AuthManager {
    constructor() {
        this.correctPassword = 'love2024';
        this.isAuthenticated = false;
        this.languageManager = new LanguageManager();
        this.init();
    }

    init() {
        this.checkExistingAuth();
        if (!this.isAuthenticated) {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        const passwordForm = document.getElementById('password-form');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLoginAttempt();
            });
        }
    }

    async handleLoginAttempt() {
        const passwordInput = document.getElementById('password-input');
        const errorMessage = document.getElementById('error-message');
        
        if (passwordInput.value === this.correctPassword) {
            this.authenticate();
        } else {
            // 使用语言管理器获取错误消息
            await this.languageManager.loadLanguage(this.languageManager.getCurrentLanguage());
            const incorrectPasswordMsg = this.languageManager.getTranslation('incorrectPassword');
            errorMessage.textContent = incorrectPasswordMsg;
            errorMessage.classList.remove('hidden');
            passwordInput.focus();
        }
    }

    checkExistingAuth() {
        const authStatus = localStorage.getItem('photoWallAuth');
        const authTime = localStorage.getItem('photoWallAuthTime');
        
        if (authStatus === 'true' && authTime) {
            const hoursDiff = (Date.now() - parseInt(authTime, 10)) / (1000 * 60 * 60);
            if (hoursDiff < 24) {
                this.isAuthenticated = true;
            }
        }
    }

    authenticate() {
        this.isAuthenticated = true;
        localStorage.setItem('photoWallAuth', 'true');
        localStorage.setItem('photoWallAuthTime', Date.now().toString());
        
        // 派发全局事件，通知应用其他部分认证已成功
        document.dispatchEvent(new CustomEvent('authSuccess'));
    }

    getAuthStatus() {
        return this.isAuthenticated;
    }

    logout() {
        this.isAuthenticated = false;
        localStorage.removeItem('photoWallAuth');
        localStorage.removeItem('photoWallAuthTime');
        // 刷新页面以显示登录界面
        window.location.reload();
    }
}

export { AuthManager };