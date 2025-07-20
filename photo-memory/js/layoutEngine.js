/**
 * 布局引擎 - 核心模块，负责计算和应用不同布局
 */

class LayoutEngine {
    constructor() {
        this.currentLayout = 'grid-9';
        this.photos = [];
        this.photoElements = new Map();
        this.container = null;
        this.init();
    }

    init() {
        this.container = document.getElementById('photo-container');
        this.bindEvents();
    }

    bindEvents() {
        const layoutBtns = document.querySelectorAll('.layout-btn');
        
        layoutBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const layout = btn.dataset.layout;
                this.switchLayout(layout);
                
                // 更新按钮状态
                layoutBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    addPhoto(photoData) {
        this.photos.push(photoData);
        this.createPhotoElement(photoData);
        this.applyCurrentLayout();
    }

    removePhoto(photoId) {
        const index = this.photos.findIndex(p => p.id === photoId);
        if (index !== -1) {
            this.photos.splice(index, 1);
            
            const element = this.photoElements.get(photoId);
            if (element) {
                element.remove();
                this.photoElements.delete(photoId);
            }
            
            this.applyCurrentLayout();
        }
    }

    createPhotoElement(photoData) {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.dataset.photoId = photoData.id;
        
        photoItem.innerHTML = `
            <img src="${photoData.url}" alt="${photoData.originalName}" loading="lazy">
            <div class="photo-overlay">
                <p class="photo-date">${this.formatMemoryDate(photoData.memory.date)}</p>
                <p class="photo-caption">${photoData.memory.description || '点击添加回忆'}</p>
            </div>
        `;
        
        // 添加点击事件
        photoItem.addEventListener('click', () => {
            if (window.lightbox) {
                window.lightbox.open(photoData.id);
            }
        });
        
        this.photoElements.set(photoData.id, photoItem);
        this.container.appendChild(photoItem);
        
        // 添加加载动画
        this.animatePhotoIn(photoItem);
    }

    animatePhotoIn(element) {
        element.style.opacity = '0';
        element.style.transform = 'scale(0.8) translateY(20px)';
        
        requestAnimationFrame(() => {
            element.style.transition = 'all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)';
            element.style.opacity = '1';
            element.style.transform = 'scale(1) translateY(0)';
        });
    }

    switchLayout(layout) {
        if (this.currentLayout === layout) return;
        
        this.currentLayout = layout;
        this.applyCurrentLayout();
        
        // 保存布局选择
        localStorage.setItem('photoWallLayout', layout);
    }

    applyCurrentLayout() {
        // 清除所有布局类
        this.container.className = 'photo-container';
        
        switch (this.currentLayout) {
            case 'grid-9':
                this.applyGridLayout(3, 3);
                break;
            case 'grid-16':
                this.applyGridLayout(4, 4);
                break;
            case 'grid-25':
                this.applyGridLayout(5, 5);
                break;
            case 'heart':
                this.applyHeartLayout();
                break;
            case 'carousel':
                this.applyCarouselLayout();
                break;
        }
    }

    applyGridLayout(cols, rows) {
        this.container.classList.add('grid-layout', `grid-${cols * rows}`);
        
        // 重置所有照片的样式
        this.photoElements.forEach(element => {
            element.style.position = '';
            element.style.left = '';
            element.style.top = '';
            element.style.transform = '';
            element.style.width = '';
            element.style.height = '';
        });
        
        // 使用GSAP动画
        if (window.gsap) {
            gsap.fromTo(this.photoElements.values(), 
                { scale: 0.8, opacity: 0 },
                { 
                    scale: 1, 
                    opacity: 1, 
                    duration: 0.6, 
                    stagger: 0.1,
                    ease: "back.out(1.7)"
                }
            );
        }
    }

    applyHeartLayout() {
        this.container.classList.add('heart-layout');
        
        const containerRect = this.container.getBoundingClientRect();
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;
        const scale = Math.min(containerRect.width, containerRect.height) / 400;
        
        const heartPositions = this.calculateHeartPositions(this.photos.length, scale);
        
        this.photoElements.forEach((element, photoId, index) => {
            const photoIndex = this.photos.findIndex(p => p.id === photoId);
            if (photoIndex < heartPositions.length) {
                const pos = heartPositions[photoIndex];
                
                element.style.position = 'absolute';
                element.style.width = '80px';
                element.style.height = '80px';
                element.style.left = `${centerX + pos.x - 40}px`;
                element.style.top = `${centerY + pos.y - 40}px`;
                element.style.transform = `rotate(${pos.rotation}deg)`;
                
                // GSAP动画
                if (window.gsap) {
                    gsap.fromTo(element,
                        { scale: 0, rotation: 0 },
                        { 
                            scale: 1, 
                            rotation: pos.rotation,
                            duration: 0.8,
                            delay: photoIndex * 0.1,
                            ease: "elastic.out(1, 0.5)"
                        }
                    );
                }
            }
        });
    }

    calculateHeartPositions(count, scale = 1) {
        const positions = [];
        const maxPoints = Math.min(count, 50); // 限制最大点数
        
        for (let i = 0; i < maxPoints; i++) {
            const t = (i / maxPoints) * 2 * Math.PI;
            
            // 心形参数方程
            const x = 16 * Math.pow(Math.sin(t), 3) * scale;
            const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale;
            
            positions.push({
                x: x * 3,
                y: y * 3,
                rotation: Math.random() * 20 - 10 // 随机旋转角度
            });
        }
        
        return positions;
    }

    applyCarouselLayout() {
        this.container.classList.add('carousel-layout');
        
        // 创建旋转容器
        const carouselContainer = document.createElement('div');
        carouselContainer.className = 'carousel-container';
        
        // 清空容器并添加旋转容器
        this.container.innerHTML = '';
        this.container.appendChild(carouselContainer);
        
        const photoCount = Math.min(this.photos.length, 12); // 最多12张照片
        const angleStep = 360 / photoCount;
        const radius = 150;
        
        this.photos.slice(0, photoCount).forEach((photo, index) => {
            const element = this.photoElements.get(photo.id);
            if (element) {
                const angle = index * angleStep;
                const radian = (angle * Math.PI) / 180;
                
                element.style.position = 'absolute';
                element.style.width = '100px';
                element.style.height = '100px';
                element.style.left = '50%';
                element.style.top = '50%';
                element.style.transform = `
                    translate(-50%, -50%) 
                    rotateY(${angle}deg) 
                    translateZ(${radius}px)
                `;
                
                carouselContainer.appendChild(element.cloneNode(true));
            }
        });
        
        // 添加鼠标悬停暂停动画
        carouselContainer.addEventListener('mouseenter', () => {
            carouselContainer.style.animationPlayState = 'paused';
        });
        
        carouselContainer.addEventListener('mouseleave', () => {
            carouselContainer.style.animationPlayState = 'running';
        });
    }

    updatePhotoMemory(photoId, memory) {
        const photo = this.photos.find(p => p.id === photoId);
        if (photo) {
            photo.memory = { ...photo.memory, ...memory };
            
            // 更新显示
            const element = this.photoElements.get(photoId);
            if (element) {
                const overlay = element.querySelector('.photo-overlay');
                if (overlay) {
                    overlay.querySelector('.photo-date').textContent = this.formatMemoryDate(memory.date);
                    overlay.querySelector('.photo-caption').textContent = memory.description || '点击添加回忆';
                }
            }
        }
    }

    formatMemoryDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    loadLayout() {
        const savedLayout = localStorage.getItem('photoWallLayout');
        if (savedLayout) {
            this.currentLayout = savedLayout;
            
            // 更新按钮状态
            document.querySelectorAll('.layout-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.layout === savedLayout);
            });
        }
    }

    getPhotos() {
        return this.photos;
    }

    getPhotoById(photoId) {
        return this.photos.find(p => p.id === photoId);
    }

    // 响应式布局调整
    handleResize() {
        if (this.currentLayout === 'heart') {
            this.applyHeartLayout();
        } else if (this.currentLayout === 'carousel') {
            this.applyCarouselLayout();
        }
    }

    // 导出当前布局配置
    exportLayoutConfig() {
        return {
            layout: this.currentLayout,
            photos: this.photos.map(photo => ({
                id: photo.id,
                url: photo.url,
                thumbnail: photo.thumbnail,
                memory: photo.memory
            }))
        };
    }

    // 导入布局配置
    importLayoutConfig(config) {
        if (config.layout) {
            this.switchLayout(config.layout);
        }
        
        if (config.photos) {
            // 清空现有照片
            this.photos = [];
            this.photoElements.clear();
            this.container.innerHTML = '';
            
            // 添加新照片
            config.photos.forEach(photo => {
                this.addPhoto(photo);
            });
        }
    }
}

// 窗口大小改变时重新计算布局
window.addEventListener('resize', () => {
    if (window.layoutEngine) {
        // 防抖处理
        clearTimeout(window.layoutEngine.resizeTimeout);
        window.layoutEngine.resizeTimeout = setTimeout(() => {
            window.layoutEngine.handleResize();
        }, 300);
    }
});

// 导出布局引擎
window.LayoutEngine = LayoutEngine;
export { LayoutEngine };