/**
 * 数据持久化模块 - 使用localStorage实现数据的读取和保存
 */

class PersistenceManager {
    constructor() {
        this.storageKeys = {
            photos: 'photoWallPhotos',
            settings: 'photoWallSettings',
            layout: 'photoWallLayout',
            auth: 'photoWallAuth',
            cloudConfig: 'photoWallCloudConfig'
        };
        this.init();
    }

    init() {
        this.checkStorageSupport();
        this.setupAutoSave();
        this.cleanupOldData();
    }

    checkStorageSupport() {
        try {
            const testKey = 'test';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            this.storageSupported = true;
        } catch (error) {
            console.warn('localStorage不可用:', error);
            this.storageSupported = false;
            this.showToast('浏览器不支持本地存储，数据将无法保存', 'warning');
        }
    }

    setupAutoSave() {
        // 页面卸载时自动保存
        window.addEventListener('beforeunload', () => {
            this.saveAllData();
        });
        
        // 定期自动保存（每5分钟）
        setInterval(() => {
            this.saveAllData();
        }, 5 * 60 * 1000);
        
        // 页面可见性变化时保存
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveAllData();
            }
        });
    }

    cleanupOldData() {
        // 清理超过30天的旧数据
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30天
        const now = Date.now();
        
        Object.values(this.storageKeys).forEach(key => {
            try {
                const data = this.getItem(key);
                if (data && data.timestamp && (now - data.timestamp) > maxAge) {
                    this.removeItem(key);
                    console.log(`清理过期数据: ${key}`);
                }
            } catch (error) {
                console.warn(`清理数据失败: ${key}`, error);
            }
        });
    }

    // 基础存储方法
    setItem(key, value) {
        if (!this.storageSupported) return false;
        
        try {
            const dataWithTimestamp = {
                data: value,
                timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(dataWithTimestamp));
            return true;
        } catch (error) {
            console.error(`保存数据失败: ${key}`, error);
            
            // 如果是存储空间不足，尝试清理
            if (error.name === 'QuotaExceededError') {
                this.handleStorageQuotaExceeded();
                // 重试一次
                try {
                    const dataWithTimestamp = {
                        data: value,
                        timestamp: Date.now()
                    };
                    localStorage.setItem(key, JSON.stringify(dataWithTimestamp));
                    return true;
                } catch (retryError) {
                    this.showToast('存储空间不足，请清理浏览器数据', 'error');
                }
            }
            return false;
        }
    }

    getItem(key) {
        if (!this.storageSupported) return null;
        
        try {
            const item = localStorage.getItem(key);
            if (!item) return null;
            
            const parsed = JSON.parse(item);
            
            // 兼容旧版本数据格式
            if (parsed.data !== undefined) {
                return parsed;
            } else {
                // 旧格式，添加时间戳
                return {
                    data: parsed,
                    timestamp: Date.now()
                };
            }
        } catch (error) {
            console.error(`读取数据失败: ${key}`, error);
            return null;
        }
    }

    removeItem(key) {
        if (!this.storageSupported) return false;
        
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`删除数据失败: ${key}`, error);
            return false;
        }
    }

    handleStorageQuotaExceeded() {
        console.warn('存储空间不足，开始清理...');
        
        // 清理策略：删除最旧的非关键数据
        const nonCriticalKeys = [];
        const criticalKeys = [this.storageKeys.auth, this.storageKeys.cloudConfig];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && !criticalKeys.includes(key)) {
                nonCriticalKeys.push(key);
            }
        }
        
        // 按时间戳排序，删除最旧的数据
        nonCriticalKeys.sort((a, b) => {
            const dataA = this.getItem(a);
            const dataB = this.getItem(b);
            const timestampA = dataA ? dataA.timestamp : 0;
            const timestampB = dataB ? dataB.timestamp : 0;
            return timestampA - timestampB;
        });
        
        // 删除最旧的一半数据
        const toDelete = Math.ceil(nonCriticalKeys.length / 2);
        for (let i = 0; i < toDelete; i++) {
            this.removeItem(nonCriticalKeys[i]);
        }
        
        this.showToast('已清理部分旧数据以释放空间');
    }

    // 照片数据管理
    savePhotos(photos) {
        return this.setItem(this.storageKeys.photos, photos);
    }

    loadPhotos() {
        const result = this.getItem(this.storageKeys.photos);
        return result ? result.data : [];
    }

    addPhoto(photo) {
        const photos = this.loadPhotos();
        photos.push(photo);
        return this.savePhotos(photos);
    }

    removePhoto(photoUrl) {
        const photos = this.loadPhotos();
        const filteredPhotos = photos.filter(photo => photo.url !== photoUrl);
        return this.savePhotos(filteredPhotos);
    }

    updatePhoto(photoUrl, updates) {
        const photos = this.loadPhotos();
        const photoIndex = photos.findIndex(photo => photo.url === photoUrl);
        
        if (photoIndex !== -1) {
            photos[photoIndex] = { ...photos[photoIndex], ...updates };
            return this.savePhotos(photos);
        }
        
        return false;
    }

    // 设置数据管理
    saveSettings(settings) {
        return this.setItem(this.storageKeys.settings, settings);
    }

    loadSettings() {
        const result = this.getItem(this.storageKeys.settings);
        return result ? result.data : null;
    }

    // 布局数据管理
    saveLayout(layout) {
        return this.setItem(this.storageKeys.layout, layout);
    }

    loadLayout() {
        const result = this.getItem(this.storageKeys.layout);
        return result ? result.data : 'grid-9';
    }

    // 认证数据管理
    saveAuth(authData) {
        return this.setItem(this.storageKeys.auth, authData);
    }

    loadAuth() {
        const result = this.getItem(this.storageKeys.auth);
        return result ? result.data : null;
    }

    clearAuth() {
        return this.removeItem(this.storageKeys.auth);
    }

    // 云存储配置管理
    saveCloudConfig(config) {
        return this.setItem(this.storageKeys.cloudConfig, config);
    }

    loadCloudConfig() {
        const result = this.getItem(this.storageKeys.cloudConfig);
        return result ? result.data : null;
    }

    // 批量操作
    saveAllData() {
        const results = {};
        
        try {
            // 保存照片数据
            if (window.photoUploader && window.photoUploader.photos) {
                results.photos = this.savePhotos(window.photoUploader.photos);
            }
            
            // 保存设置数据
            if (window.controlsManager && window.controlsManager.settings) {
                results.settings = this.saveSettings(window.controlsManager.settings);
            }
            
            // 保存布局数据
            if (window.layoutEngine && window.layoutEngine.currentLayout) {
                results.layout = this.saveLayout(window.layoutEngine.currentLayout);
            }
            
            // 保存云存储配置
            if (window.photoUploader && window.photoUploader.cloudConfig) {
                results.cloudConfig = this.saveCloudConfig(window.photoUploader.cloudConfig);
            }
            
            console.log('自动保存完成:', results);
        } catch (error) {
            console.error('自动保存失败:', error);
        }
        
        return results;
    }

    loadAllData() {
        return {
            photos: this.loadPhotos(),
            settings: this.loadSettings(),
            layout: this.loadLayout(),
            auth: this.loadAuth(),
            cloudConfig: this.loadCloudConfig()
        };
    }

    // 数据导出和导入
    exportData() {
        const allData = this.loadAllData();
        const exportData = {
            ...allData,
            exportTime: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `照片墙数据备份_${this.getTimestamp()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        this.showToast('数据导出成功');
    }

    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const importData = JSON.parse(e.target.result);
                    
                    // 验证数据格式
                    if (!this.validateImportData(importData)) {
                        reject(new Error('数据格式不正确'));
                        return;
                    }
                    
                    // 导入数据
                    if (importData.photos) {
                        this.savePhotos(importData.photos);
                    }
                    if (importData.settings) {
                        this.saveSettings(importData.settings);
                    }
                    if (importData.layout) {
                        this.saveLayout(importData.layout);
                    }
                    if (importData.cloudConfig) {
                        this.saveCloudConfig(importData.cloudConfig);
                    }
                    
                    this.showToast('数据导入成功');
                    resolve(importData);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('文件读取失败'));
            };
            
            reader.readAsText(file);
        });
    }

    validateImportData(data) {
        // 基本格式验证
        if (typeof data !== 'object' || data === null) {
            return false;
        }
        
        // 验证照片数据
        if (data.photos && !Array.isArray(data.photos)) {
            return false;
        }
        
        // 验证设置数据
        if (data.settings && typeof data.settings !== 'object') {
            return false;
        }
        
        return true;
    }

    // 清理所有数据
    clearAllData() {
        const confirmed = confirm('确定要清除所有数据吗？此操作不可恢复。');
        
        if (confirmed) {
            Object.values(this.storageKeys).forEach(key => {
                this.removeItem(key);
            });
            
            this.showToast('所有数据已清除');
            
            // 刷新页面
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }

    // 获取存储使用情况
    getStorageUsage() {
        if (!this.storageSupported) return null;
        
        let totalSize = 0;
        const usage = {};
        
        Object.entries(this.storageKeys).forEach(([name, key]) => {
            const item = localStorage.getItem(key);
            const size = item ? new Blob([item]).size : 0;
            usage[name] = {
                size,
                sizeFormatted: this.formatBytes(size)
            };
            totalSize += size;
        });
        
        return {
            total: {
                size: totalSize,
                sizeFormatted: this.formatBytes(totalSize)
            },
            items: usage
        };
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        return `${year}${month}${day}_${hours}${minutes}`;
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
}

// 导出持久化管理器
window.PersistenceManager = PersistenceManager;
export { PersistenceManager };