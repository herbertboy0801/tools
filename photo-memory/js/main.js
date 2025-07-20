import { PersistenceManager } from './persistence.js';
import { AuthManager } from './auth.js';
import { PhotoUploader } from './uploader.js';
import { LayoutEngine } from './layoutEngine.js';
import { ControlsManager } from './controls.js';
import { LightboxManager } from './lightbox.js';
import { ShareExportManager } from './shareExport.js';
import { EffectsManager } from './effects.js';
import { LanguageManager } from './language.js';

class PhotoWallApp {
    constructor() {
        this.modules = {};
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('开始初始化 PhotoWallApp...');
            this.showLoading();

            this.modules.language = new LanguageManager();
            await this.modules.language.loadLanguage(this.modules.language.getCurrentLanguage());
            console.log('语言文件加载完成。');

            this.modules.persistence = new PersistenceManager();
            this.modules.auth = new AuthManager();
            
            document.addEventListener('authSuccess', async () => {
                if (!this.isInitialized) {
                    console.log('认证成功，初始化主应用...');
                    await this.showMainApp();
                    await this.initMainApp();
                }
            });

            if (this.modules.auth.getAuthStatus()) {
                console.log('用户已认证，直接初始化...');
                document.dispatchEvent(new CustomEvent('authSuccess'));
            } else {
                console.log('用户未认证，显示密码输入界面。');
                this.showPasswordModal();
                this.hideLoading(); // 隐藏加载动画，显示登录框
            }
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.hideLoading();
            this.showError(`应用初始化失败: ${error.message}，请刷新页面重试`);
        }
    }

    async initMainApp() {
        if (this.isInitialized) return;
        console.log('开始初始化主应用模块...');
        
        try {
            await this.initModules();
            await this.loadSavedData();
            this.bindGlobalEvents();
            
            this.isInitialized = true;
            this.hideLoading();
            console.log('照片墙应用初始化完成！');
        } catch (error) {
            console.error('主应用初始化失败:', error);
            this.hideLoading();
            this.showError('主应用初始化失败: ' + error.message);
        }
    }

    async initModules() {
        console.log('开始初始化所有模块...');
        this.modules.uploader = new PhotoUploader();
        this.modules.layoutEngine = new LayoutEngine();
        this.modules.controls = new ControlsManager();
        this.modules.lightbox = new LightboxManager();
        this.modules.shareExport = new ShareExportManager();
        this.modules.effects = new EffectsManager();
        
        // 将模块实例挂载到 window，以便旧代码或调试时访问
        window.persistenceManager = this.modules.persistence;
        window.photoUploader = this.modules.uploader;
        window.layoutEngine = this.modules.layoutEngine;
        window.controlsManager = this.modules.controls;
        window.lightboxManager = this.modules.lightbox;
        window.shareExportManager = this.modules.shareExport;
        window.effectsManager = this.modules.effects;
        console.log('所有模块初始化完成。');
    }

    async loadSavedData() {
        console.log('开始加载已保存的数据...');
        const savedPhotos = this.modules.persistence.getPhotos();
        if (savedPhotos && savedPhotos.length > 0) {
            this.modules.layoutEngine.addPhotos(savedPhotos);
        }
        const savedSettings = this.modules.persistence.getSettings();
        if (savedSettings) {
            this.modules.controls.applySettings(savedSettings);
            this.modules.effects.applyEffects(savedSettings.effects);
        }
        console.log('数据加载完成。');
    }

    bindGlobalEvents() {
        console.log('开始绑定全局事件...');
        // 示例：监听设置更改并保存
        document.addEventListener('settingsChanged', (e) => {
            this.modules.persistence.saveSettings(e.detail);
        });
        // 示例：监听照片添加/删除并保存
        document.addEventListener('photosChanged', (e) => {
            this.modules.persistence.savePhotos(e.detail.photos);
        });
        console.log('全局事件绑定完成。');
    }

    showLoading() {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'flex';
            loadingIndicator.style.opacity = '1';
        }
    }

    hideLoading() {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.opacity = '0';
            setTimeout(() => {
                loadingIndicator.style.display = 'none';
            }, 300);
        }
    }

    showError(message) {
        // 实现一个更友好的错误显示方式，例如一个toast或modal
        console.error(message);
        alert(message); // 临时使用alert
    }

    showPasswordModal() {
        const passwordModal = document.getElementById('password-modal');
        const mainApp = document.getElementById('main-app');
        
        if(passwordModal) passwordModal.classList.remove('hidden');
        if(mainApp) mainApp.classList.add('hidden');
        
        setTimeout(() => {
            const passwordInput = document.getElementById('password-input');
            if(passwordInput) passwordInput.focus();
        }, 100);
    }

    async showMainApp() {
        const passwordModal = document.getElementById('password-modal');
        const mainApp = document.getElementById('main-app');
        
        if (passwordModal) {
            passwordModal.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            passwordModal.style.opacity = '0';
            passwordModal.style.transform = 'scale(0.9)';
        }
        
        return new Promise(resolve => {
            setTimeout(() => {
                if (passwordModal) passwordModal.classList.add('hidden');
                if (mainApp) {
                    mainApp.classList.remove('hidden');
                    mainApp.style.opacity = '0';
                    mainApp.style.transform = 'translateY(20px)';
                    
                    requestAnimationFrame(() => {
                        mainApp.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
                        mainApp.style.opacity = '1';
                        mainApp.style.transform = 'translateY(0)';
                    });
                }
                resolve();
            }, 300);
        });
    }
}

// 应用启动
document.addEventListener('DOMContentLoaded', () => {
    const app = new PhotoWallApp();
    app.init();
    window.photoWallApp = app; // 方便调试
});