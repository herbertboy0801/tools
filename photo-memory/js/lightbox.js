/**
 * 全屏图片浏览器模块 - 实现Lightbox功能
 */

class LightboxManager {
    constructor() {
        this.currentIndex = 0;
        this.photos = [];
        this.isOpen = false;
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.init();
    }

    init() {
        this.bindEvents();
        this.createKeyboardShortcuts();
    }

    bindEvents() {
        const lightbox = document.getElementById('lightbox');
        const lightboxClose = document.getElementById('lightbox-close');
        const lightboxPrev = document.getElementById('lightbox-prev');
        const lightboxNext = document.getElementById('lightbox-next');
        const lightboxOverlay = document.querySelector('.lightbox-overlay');
        
        // 关闭按钮
        lightboxClose.addEventListener('click', () => this.close());
        
        // 导航按钮
        lightboxPrev.addEventListener('click', () => this.prev());
        lightboxNext.addEventListener('click', () => this.next());
        
        // 点击遮罩层关闭
        lightboxOverlay.addEventListener('click', (e) => {
            if (e.target === lightboxOverlay) {
                this.close();
            }
        });
        
        // 触摸事件（移动端滑动）
        const lightboxContent = document.querySelector('.lightbox-content');
        lightboxContent.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
        }, { passive: true });
        
        lightboxContent.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].clientX;
            this.handleSwipe();
        }, { passive: true });
        
        // 阻止滚动
        lightboxContent.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    createKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;
            
            switch (e.key) {
                case 'Escape':
                    this.close();
                    break;
                case 'ArrowLeft':
                    this.prev();
                    break;
                case 'ArrowRight':
                    this.next();
                    break;
                case ' ': // 空格键
                    e.preventDefault();
                    this.next();
                    break;
            }
        });
    }

    open(photos, index = 0) {
        this.photos = photos;
        this.currentIndex = index;
        this.isOpen = true;
        
        const lightbox = document.getElementById('lightbox');
        lightbox.classList.add('active');
        
        // 禁用页面滚动
        document.body.style.overflow = 'hidden';
        
        this.updateDisplay();
        this.updateNavigation();
        
        // 预加载相邻图片
        this.preloadImages();
    }

    close() {
        this.isOpen = false;
        
        const lightbox = document.getElementById('lightbox');
        lightbox.classList.remove('active');
        
        // 恢复页面滚动
        document.body.style.overflow = '';
        
        // 清理
        this.currentIndex = 0;
        this.photos = [];
    }

    prev() {
        if (this.photos.length === 0) return;
        
        this.currentIndex = (this.currentIndex - 1 + this.photos.length) % this.photos.length;
        this.updateDisplay();
        this.updateNavigation();
        this.preloadImages();
    }

    next() {
        if (this.photos.length === 0) return;
        
        this.currentIndex = (this.currentIndex + 1) % this.photos.length;
        this.updateDisplay();
        this.updateNavigation();
        this.preloadImages();
    }

    updateDisplay() {
        if (this.photos.length === 0) return;
        
        const currentPhoto = this.photos[this.currentIndex];
        const lightboxImage = document.getElementById('lightbox-image');
        const lightboxDate = document.getElementById('lightbox-date');
        const lightboxLocation = document.getElementById('lightbox-location');
        const lightboxDescription = document.getElementById('lightbox-description');
        const lightboxCounter = document.getElementById('lightbox-counter');
        
        // 更新图片
        lightboxImage.src = currentPhoto.url;
        lightboxImage.alt = currentPhoto.description || '爱的记忆';
        
        // 更新信息
        lightboxDate.value = currentPhoto.date || '';
        lightboxLocation.value = currentPhoto.location || '';
        lightboxDescription.value = currentPhoto.description || '';
        
        // 更新计数器
        lightboxCounter.textContent = `${this.currentIndex + 1} / ${this.photos.length}`;
        
        // 绑定信息编辑事件
        this.bindInfoEditEvents(currentPhoto);
    }

    bindInfoEditEvents(photo) {
        const lightboxDate = document.getElementById('lightbox-date');
        const lightboxLocation = document.getElementById('lightbox-location');
        const lightboxDescription = document.getElementById('lightbox-description');
        
        // 移除之前的事件监听器
        const newDate = lightboxDate.cloneNode(true);
        const newLocation = lightboxLocation.cloneNode(true);
        const newDescription = lightboxDescription.cloneNode(true);
        
        lightboxDate.parentNode.replaceChild(newDate, lightboxDate);
        lightboxLocation.parentNode.replaceChild(newLocation, lightboxLocation);
        lightboxDescription.parentNode.replaceChild(newDescription, lightboxDescription);
        
        // 添加新的事件监听器
        const saveInfo = () => {
            photo.date = newDate.value;
            photo.location = newLocation.value;
            photo.description = newDescription.value;
            
            // 更新照片墙中的显示
            this.updatePhotoWallInfo(photo);
            
            // 保存到本地存储
            if (window.photoUploader) {
                window.photoUploader.savePhotos();
            }
            
            this.showToast('信息已保存');
        };
        
        newDate.addEventListener('blur', saveInfo);
        newLocation.addEventListener('blur', saveInfo);
        newDescription.addEventListener('blur', saveInfo);
        
        // 回车键保存
        [newDate, newLocation, newDescription].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    input.blur();
                }
            });
        });
    }

    updatePhotoWallInfo(photo) {
        const photoItems = document.querySelectorAll('.photo-item');
        
        photoItems.forEach(item => {
            const img = item.querySelector('img');
            if (img && img.src === photo.url) {
                const overlay = item.querySelector('.photo-overlay');
                if (overlay) {
                    const dateElement = overlay.querySelector('.photo-date');
                    const captionElement = overlay.querySelector('.photo-caption');
                    
                    if (dateElement) {
                        dateElement.textContent = photo.date || '';
                    }
                    if (captionElement) {
                        captionElement.textContent = photo.description || '';
                    }
                }
            }
        });
    }

    updateNavigation() {
        const lightboxPrev = document.getElementById('lightbox-prev');
        const lightboxNext = document.getElementById('lightbox-next');
        
        // 单张图片时隐藏导航
        if (this.photos.length <= 1) {
            lightboxPrev.style.display = 'none';
            lightboxNext.style.display = 'none';
        } else {
            lightboxPrev.style.display = 'flex';
            lightboxNext.style.display = 'flex';
        }
    }

    preloadImages() {
        if (this.photos.length <= 1) return;
        
        // 预加载前一张和后一张图片
        const prevIndex = (this.currentIndex - 1 + this.photos.length) % this.photos.length;
        const nextIndex = (this.currentIndex + 1) % this.photos.length;
        
        [prevIndex, nextIndex].forEach(index => {
            const img = new Image();
            img.src = this.photos[index].url;
        });
    }

    handleSwipe() {
        const swipeThreshold = 50;
        const swipeDistance = this.touchEndX - this.touchStartX;
        
        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance > 0) {
                // 向右滑动 - 上一张
                this.prev();
            } else {
                // 向左滑动 - 下一张
                this.next();
            }
        }
    }

    // 从照片墙打开Lightbox
    openFromPhotoWall(clickedElement) {
        const photoItems = document.querySelectorAll('.photo-item');
        const photos = [];
        let clickedIndex = 0;
        
        photoItems.forEach((item, index) => {
            const img = item.querySelector('img');
            const overlay = item.querySelector('.photo-overlay');
            
            if (img) {
                const photo = {
                    url: img.src,
                    date: '',
                    location: '',
                    description: img.alt || ''
                };
                
                // 从overlay获取现有信息
                if (overlay) {
                    const dateElement = overlay.querySelector('.photo-date');
                    const captionElement = overlay.querySelector('.photo-caption');
                    
                    if (dateElement) {
                        photo.date = dateElement.textContent;
                    }
                    if (captionElement) {
                        photo.description = captionElement.textContent;
                    }
                }
                
                photos.push(photo);
                
                // 找到被点击的照片索引
                if (item === clickedElement || item.contains(clickedElement)) {
                    clickedIndex = index;
                }
            }
        });
        
        if (photos.length > 0) {
            this.open(photos, clickedIndex);
        }
    }

    // 添加照片到当前Lightbox
    addPhoto(photo) {
        this.photos.push(photo);
        if (this.isOpen) {
            this.updateNavigation();
        }
    }

    // 从当前Lightbox移除照片
    removePhoto(photoUrl) {
        const index = this.photos.findIndex(photo => photo.url === photoUrl);
        if (index !== -1) {
            this.photos.splice(index, 1);
            
            if (this.photos.length === 0) {
                this.close();
                return;
            }
            
            // 调整当前索引
            if (this.currentIndex >= this.photos.length) {
                this.currentIndex = this.photos.length - 1;
            }
            
            if (this.isOpen) {
                this.updateDisplay();
                this.updateNavigation();
            }
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

    // 获取当前照片信息
    getCurrentPhoto() {
        return this.photos[this.currentIndex] || null;
    }

    // 设置当前照片信息
    setCurrentPhotoInfo(info) {
        const currentPhoto = this.getCurrentPhoto();
        if (currentPhoto) {
            Object.assign(currentPhoto, info);
            this.updateDisplay();
            this.updatePhotoWallInfo(currentPhoto);
        }
    }
}

// 导出Lightbox管理器
window.LightboxManager = LightboxManager;
export { LightboxManager };