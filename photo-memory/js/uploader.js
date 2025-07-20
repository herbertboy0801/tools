/**
 * 上传模块 - 处理与第三方云存储的交互逻辑
 */

class PhotoUploader {
    constructor() {
        this.cloudName = '';
        this.uploadPreset = '';
        this.uploadedPhotos = [];
        this.init();
    }

    init() {
        this.loadConfig();
        this.bindEvents();
    }

    bindEvents() {
        const fileInput = document.getElementById('file-input');
        const uploadBtn = document.getElementById('upload-btn');
        const cloudNameInput = document.getElementById('cloud-name');
        const uploadPresetInput = document.getElementById('upload-preset');

        // 上传按钮点击
        uploadBtn.addEventListener('click', () => {
            if (!this.validateConfig()) {
                this.showToast('请先配置Cloudinary设置', 'error');
                return;
            }
            fileInput.click();
        });

        // 文件选择
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                this.uploadFiles(files);
            }
        });

        // 配置保存
        cloudNameInput.addEventListener('blur', () => {
            this.cloudName = cloudNameInput.value.trim();
            this.saveConfig();
        });

        uploadPresetInput.addEventListener('blur', () => {
            this.uploadPreset = uploadPresetInput.value.trim();
            this.saveConfig();
        });

        // 拖拽上传
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const photoWall = document.getElementById('photo-wall');
        
        photoWall.addEventListener('dragover', (e) => {
            e.preventDefault();
            photoWall.classList.add('drag-over');
        });

        photoWall.addEventListener('dragleave', (e) => {
            e.preventDefault();
            photoWall.classList.remove('drag-over');
        });

        photoWall.addEventListener('drop', (e) => {
            e.preventDefault();
            photoWall.classList.remove('drag-over');
            
            const files = Array.from(e.dataTransfer.files).filter(file => 
                file.type.startsWith('image/')
            );
            
            if (files.length > 0) {
                if (!this.validateConfig()) {
                    this.showToast('请先配置Cloudinary设置', 'error');
                    return;
                }
                this.uploadFiles(files);
            }
        });
    }

    validateConfig() {
        return this.cloudName && this.uploadPreset;
    }

    async uploadFiles(files) {
        const uploadBtn = document.getElementById('upload-btn');
        const originalText = uploadBtn.textContent;
        
        uploadBtn.innerHTML = '<span class="loading"></span> 上传中...';
        uploadBtn.disabled = true;

        try {
            const uploadPromises = files.map(file => this.uploadSingleFile(file));
            const results = await Promise.allSettled(uploadPromises);
            
            const successful = results.filter(r => r.status === 'fulfilled');
            const failed = results.filter(r => r.status === 'rejected');
            
            if (successful.length > 0) {
                successful.forEach(result => {
                    this.addPhotoToGallery(result.value);
                });
                this.showToast(`成功上传 ${successful.length} 张照片`, 'success');
            }
            
            if (failed.length > 0) {
                console.error('上传失败的文件:', failed);
                this.showToast(`${failed.length} 张照片上传失败`, 'error');
            }
            
        } catch (error) {
            console.error('上传过程出错:', error);
            this.showToast('上传过程中出现错误', 'error');
        } finally {
            uploadBtn.textContent = originalText;
            uploadBtn.disabled = false;
        }
    }

    async uploadSingleFile(file) {
        // 文件大小检查 (最大10MB)
        if (file.size > 10 * 1024 * 1024) {
            throw new Error('文件大小不能超过10MB');
        }

        // 文件类型检查
        if (!file.type.startsWith('image/')) {
            throw new Error('只支持图片文件');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', this.uploadPreset);
        formData.append('public_id', `couple_${this.generateUniqueId()}`);
        formData.append('folder', 'photo-wall');
        
        // 添加图片变换参数
        formData.append('transformation', 'c_limit,w_1920,h_1920,q_auto:good');

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || '上传失败');
        }

        const data = await response.json();
        
        return {
            id: data.public_id,
            url: data.secure_url,
            thumbnail: this.createThumbnailUrl(data.public_id),
            originalName: file.name,
            uploadTime: new Date().toISOString(),
            size: file.size,
            memory: {
                date: '',
                location: '',
                description: ''
            }
        };
    }

    createThumbnailUrl(publicId) {
        return `https://res.cloudinary.com/${this.cloudName}/image/upload/c_thumb,g_face,w_300,h_300,q_auto:good/${publicId}`;
    }

    generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    addPhotoToGallery(photoData) {
        this.uploadedPhotos.push(photoData);
        this.updatePhotoList();
        this.savePhotos();
        
        // 通知布局引擎更新
        if (window.layoutEngine) {
            window.layoutEngine.addPhoto(photoData);
        }
    }

    updatePhotoList() {
        const photoList = document.getElementById('photo-list');
        photoList.innerHTML = '';
        
        this.uploadedPhotos.forEach((photo, index) => {
            const item = document.createElement('div');
            item.className = 'photo-list-item';
            item.innerHTML = `
                <img src="${photo.thumbnail}" alt="${photo.originalName}" loading="lazy">
                <div class="photo-info">
                    <div>${photo.originalName}</div>
                    <div>${this.formatFileSize(photo.size)}</div>
                    <div>${this.formatDate(photo.uploadTime)}</div>
                </div>
                <button class="delete-btn" data-index="${index}" title="删除照片">
                    删除
                </button>
            `;
            
            // 删除按钮事件
            const deleteBtn = item.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => {
                this.deletePhoto(index);
            });
            
            photoList.appendChild(item);
        });
        
        // 更新空状态显示
        this.updateEmptyState();
    }

    deletePhoto(index) {
        if (confirm('确定要删除这张照片吗？')) {
            const photo = this.uploadedPhotos[index];
            this.uploadedPhotos.splice(index, 1);
            
            this.updatePhotoList();
            this.savePhotos();
            
            // 通知布局引擎更新
            if (window.layoutEngine) {
                window.layoutEngine.removePhoto(photo.id);
            }
            
            this.showToast('照片已删除', 'info');
        }
    }

    updateEmptyState() {
        const emptyState = document.getElementById('empty-state');
        const photoContainer = document.getElementById('photo-container');
        
        if (this.uploadedPhotos.length === 0) {
            emptyState.classList.remove('hidden');
            photoContainer.classList.add('empty');
        } else {
            emptyState.classList.add('hidden');
            photoContainer.classList.remove('empty');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    saveConfig() {
        const config = {
            cloudName: this.cloudName,
            uploadPreset: this.uploadPreset
        };
        localStorage.setItem('photoWallConfig', JSON.stringify(config));
    }

    loadConfig() {
        const config = localStorage.getItem('photoWallConfig');
        if (config) {
            const parsed = JSON.parse(config);
            this.cloudName = parsed.cloudName || '';
            this.uploadPreset = parsed.uploadPreset || '';
            
            // 更新UI
            document.getElementById('cloud-name').value = this.cloudName;
            document.getElementById('upload-preset').value = this.uploadPreset;
        }
    }

    savePhotos() {
        localStorage.setItem('photoWallPhotos', JSON.stringify(this.uploadedPhotos));
    }

    loadPhotos() {
        const photos = localStorage.getItem('photoWallPhotos');
        if (photos) {
            this.uploadedPhotos = JSON.parse(photos);
            this.updatePhotoList();
            
            // 通知布局引擎加载照片
            if (window.layoutEngine) {
                this.uploadedPhotos.forEach(photo => {
                    window.layoutEngine.addPhoto(photo);
                });
            }
        }
    }

    getPhotos() {
        return this.uploadedPhotos;
    }

    updatePhotoMemory(photoId, memory) {
        const photo = this.uploadedPhotos.find(p => p.id === photoId);
        if (photo) {
            photo.memory = { ...photo.memory, ...memory };
            this.savePhotos();
        }
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

// 添加拖拽样式
const dragStyle = document.createElement('style');
dragStyle.textContent = `
    .photo-wall.drag-over {
        background: linear-gradient(135deg, rgba(233, 30, 99, 0.1), rgba(156, 39, 176, 0.1));
        border: 2px dashed var(--primary-color);
        border-radius: var(--border-radius-md);
    }
    
    .photo-container.empty {
        display: flex;
        align-items: center;
        justify-content: center;
    }
`;
document.head.appendChild(dragStyle);

// 导出上传器
window.PhotoUploader = PhotoUploader;
export { PhotoUploader };