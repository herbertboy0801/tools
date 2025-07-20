/**
 * 控制面板模块 - 绑定设置面板中所有控件的事件，并更新UI
 */

class ControlsManager {
    constructor() {
        this.settings = {
            background: {
                type: 'color',
                color: '#FFF8F5',
                gradientStart: '#FFF8F5',
                gradientEnd: '#E91E63',
                imageUrl: ''
            },
            borderStyle: 'none',
            musicUrl: '',
            effectsType: 'none',
            title: '我们的爱情回忆'
        };
        this.init();
    }

    init() {
        this.loadSettings();
        this.bindEvents();
        this.applySettings();
    }

    bindEvents() {
        this.bindPanelToggle();
        this.bindBackgroundControls();
        this.bindBorderControls();
        this.bindMusicControls();
        this.bindEffectsControls();
        this.bindTitleControls();
        this.bindLanguageSwitcher();
    }

    bindPanelToggle() {
        const panelToggle = document.getElementById('panel-toggle');
        const panelClose = document.getElementById('panel-close');
        const controlPanel = document.getElementById('control-panel');
        
        const togglePanel = () => {
            if (window.innerWidth <= 768) {
                // 移动端：底部抽屉模式
                controlPanel.classList.toggle('open');
            } else {
                // 桌面端：侧边栏模式
                controlPanel.style.transform = 
                    controlPanel.style.transform === 'translateX(100%)' ? 
                    'translateX(0)' : 'translateX(100%)';
            }
        };
        
        panelToggle.addEventListener('click', togglePanel);
        panelClose.addEventListener('click', togglePanel);
        
        // 移动端点击面板头部切换
        if (window.innerWidth <= 768) {
            const panelHeader = document.querySelector('.panel-header');
            panelHeader.addEventListener('click', togglePanel);
        }
    }

    bindBackgroundControls() {
        const bgType = document.getElementById('bg-type');
        const bgColor = document.getElementById('bg-color');
        const gradientStart = document.getElementById('gradient-start');
        const gradientEnd = document.getElementById('gradient-end');
        const bgImageUrl = document.getElementById('bg-image-url');
        
        // 背景类型切换
        bgType.addEventListener('change', () => {
            this.settings.background.type = bgType.value;
            this.toggleBackgroundControls();
            this.applyBackground();
            this.saveSettings();
        });
        
        // 纯色背景
        bgColor.addEventListener('input', () => {
            this.settings.background.color = bgColor.value;
            this.applyBackground();
        });
        
        bgColor.addEventListener('change', () => {
            this.saveSettings();
        });
        
        // 渐变背景
        gradientStart.addEventListener('input', () => {
            this.settings.background.gradientStart = gradientStart.value;
            this.applyBackground();
        });
        
        gradientStart.addEventListener('change', () => {
            this.saveSettings();
        });
        
        gradientEnd.addEventListener('input', () => {
            this.settings.background.gradientEnd = gradientEnd.value;
            this.applyBackground();
        });
        
        gradientEnd.addEventListener('change', () => {
            this.saveSettings();
        });
        
        // 图片背景
        bgImageUrl.addEventListener('blur', () => {
            this.settings.background.imageUrl = bgImageUrl.value.trim();
            this.applyBackground();
            this.saveSettings();
        });
        
        bgImageUrl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                bgImageUrl.blur();
            }
        });
    }

    toggleBackgroundControls() {
        const colorControls = document.getElementById('bg-color-controls');
        const gradientControls = document.getElementById('bg-gradient-controls');
        const imageControls = document.getElementById('bg-image-controls');
        
        // 隐藏所有控件
        [colorControls, gradientControls, imageControls].forEach(control => {
            control.classList.add('hidden');
        });
        
        // 显示对应控件
        switch (this.settings.background.type) {
            case 'color':
                colorControls.classList.remove('hidden');
                break;
            case 'gradient':
                gradientControls.classList.remove('hidden');
                break;
            case 'image':
                imageControls.classList.remove('hidden');
                break;
        }
    }

    bindBorderControls() {
        const borderStyle = document.getElementById('border-style');
        
        borderStyle.addEventListener('change', () => {
            this.settings.borderStyle = borderStyle.value;
            this.applyBorderStyle();
            this.saveSettings();
        });
    }

    bindMusicControls() {
        const musicUrl = document.getElementById('music-url');
        const musicToggle = document.getElementById('music-toggle');
        const backgroundMusic = document.getElementById('background-music');
        
        musicUrl.addEventListener('blur', () => {
            this.settings.musicUrl = musicUrl.value.trim();
            if (this.settings.musicUrl) {
                backgroundMusic.src = this.settings.musicUrl;
                backgroundMusic.load();
            }
            this.saveSettings();
        });
        
        musicToggle.addEventListener('click', () => {
            this.toggleMusic();
        });
        
        // 音乐加载错误处理
        backgroundMusic.addEventListener('error', () => {
            this.showToast(window.app.modules.language.getTranslation('musicLoadError'), 'error');
            musicToggle.classList.remove('playing');
        });
        
        // 音乐播放状态更新
        backgroundMusic.addEventListener('play', () => {
            musicToggle.classList.add('playing');
            musicToggle.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
            `;
        });
        
        backgroundMusic.addEventListener('pause', () => {
            musicToggle.classList.remove('playing');
            musicToggle.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
            `;
        });
    }

    bindEffectsControls() {
        const effectsType = document.getElementById('effects-type');
        
        effectsType.addEventListener('change', () => {
            this.settings.effectsType = effectsType.value;
            this.applyEffects();
            this.saveSettings();
        });
    }

    bindTitleControls() {
        const mainTitle = document.getElementById('main-title');
        
        mainTitle.addEventListener('blur', () => {
            this.settings.title = mainTitle.textContent.trim();
            this.saveSettings();
        });
        
        mainTitle.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                mainTitle.blur();
            }
        });
    }

    bindLanguageSwitcher() {
        const languageSelect = document.getElementById('language-select');
        languageSelect.addEventListener('change', (e) => {
            const selectedLang = e.target.value;
            window.app.modules.language.loadLanguage(selectedLang);
        });
    }

    applySettings() {
        this.applyBackground();
        this.applyBorderStyle();
        this.applyEffects();
        this.updateUI();
    }

    applyBackground() {
        const photoWall = document.getElementById('photo-wall');
        
        switch (this.settings.background.type) {
            case 'color':
                photoWall.style.background = this.settings.background.color;
                break;
            case 'gradient':
                photoWall.style.background = `linear-gradient(135deg, ${this.settings.background.gradientStart}, ${this.settings.background.gradientEnd})`;
                break;
            case 'image':
                if (this.settings.background.imageUrl) {
                    photoWall.style.background = `url(${this.settings.background.imageUrl}) center/cover no-repeat`;
                } else {
                    photoWall.style.background = this.settings.background.color;
                }
                break;
        }
    }

    applyBorderStyle() {
        const photoItems = document.querySelectorAll('.photo-item');
        
        photoItems.forEach(item => {
            // 清除所有边框类
            item.classList.remove('border-rounded', 'border-shadow');
            
            switch (this.settings.borderStyle) {
                case 'rounded':
                    item.classList.add('border-rounded');
                    break;
                case 'shadow':
                    item.classList.add('border-shadow');
                    break;
                case 'both':
                    item.classList.add('border-rounded', 'border-shadow');
                    break;
            }
        });
    }

    applyEffects() {
        if (window.effectsManager) {
            window.effectsManager.setEffect(this.settings.effectsType);
        }
    }

    toggleMusic() {
        const backgroundMusic = document.getElementById('background-music');
        
        if (!this.settings.musicUrl) {
            this.showToast('请先设置音乐URL', 'error');
            return;
        }
        
        if (backgroundMusic.paused) {
            backgroundMusic.play().catch(error => {
                console.error('音乐播放失败:', error);
                this.showToast('音乐播放失败', 'error');
            });
        } else {
            backgroundMusic.pause();
        }
    }

    updateUI() {
        // 更新背景控件
        document.getElementById('bg-type').value = this.settings.background.type;
        document.getElementById('bg-color').value = this.settings.background.color;
        document.getElementById('gradient-start').value = this.settings.background.gradientStart;
        document.getElementById('gradient-end').value = this.settings.background.gradientEnd;
        document.getElementById('bg-image-url').value = this.settings.background.imageUrl;
        
        // 更新其他控件
        document.getElementById('border-style').value = this.settings.borderStyle;
        document.getElementById('music-url').value = this.settings.musicUrl;
        document.getElementById('effects-type').value = this.settings.effectsType;
        document.getElementById('main-title').textContent = this.settings.title;
        
        // 切换背景控件显示
        this.toggleBackgroundControls();
        
        // 设置音乐
        if (this.settings.musicUrl) {
            const backgroundMusic = document.getElementById('background-music');
            backgroundMusic.src = this.settings.musicUrl;
        }
    }

    saveSettings() {
        localStorage.setItem('photoWallSettings', JSON.stringify(this.settings));
    }

    loadSettings() {
        const saved = localStorage.getItem('photoWallSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }

    exportSettings() {
        return this.settings;
    }

    importSettings(settings) {
        this.settings = { ...this.settings, ...settings };
        this.applySettings();
        this.saveSettings();
    }

    showToast(message, type = 'info') {
        // 移除现有的toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // 显示动画
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // 自动隐藏
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // 响应式处理
    handleResize() {
        const controlPanel = document.getElementById('control-panel');
        
        if (window.innerWidth <= 768) {
            // 移动端：重置为关闭状态
            controlPanel.classList.remove('open');
            controlPanel.style.transform = '';
        } else {
            // 桌面端：重置为显示状态
            controlPanel.classList.remove('open');
            controlPanel.style.transform = 'translateX(0)';
        }
    }
}

// 窗口大小改变时处理响应式
window.addEventListener('resize', () => {
    if (window.controlsManager) {
        clearTimeout(window.controlsManager.resizeTimeout);
        window.controlsManager.resizeTimeout = setTimeout(() => {
            window.controlsManager.handleResize();
        }, 300);
    }
});

// 导出控制管理器
window.ControlsManager = ControlsManager;
export { ControlsManager };