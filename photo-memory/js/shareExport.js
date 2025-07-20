/**
 * 分享与导出模块 - 实现分享链接生成和文件导出功能
 */

class ShareExportManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        // 不在初始化时加载库，而是在需要时才加载
        // this.loadLibraries();
    }

    bindEvents() {
        const shareBtn = document.getElementById('share-btn');
        const exportPngBtn = document.getElementById('export-png-btn');
        const exportPdfBtn = document.getElementById('export-pdf-btn');
        const shareModal = document.getElementById('share-modal');
        const shareClose = document.getElementById('share-close');
        const copyLinkBtn = document.getElementById('copy-link-btn');
        
        // 分享按钮
        shareBtn.addEventListener('click', () => this.generateShareLink());
        
        // 导出按钮
        exportPngBtn.addEventListener('click', () => this.exportAsPNG());
        exportPdfBtn.addEventListener('click', () => this.exportAsPDF());
        
        // 分享模态框
        shareClose.addEventListener('click', () => this.closeShareModal());
        shareModal.addEventListener('click', (e) => {
            if (e.target === shareModal) {
                this.closeShareModal();
            }
        });
        
        // 复制链接
        copyLinkBtn.addEventListener('click', () => this.copyShareLink());
        
        // 检查URL参数，如果有分享数据则加载
        this.checkForSharedData();
    }

    async loadLibraries() {
        // 动态加载html2canvas和jsPDF
        if (!window.html2canvas) {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        }
        
        if (!window.jsPDF) {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    generateShareLink() {
        try {
            const shareData = this.collectShareData();
            const encodedData = this.encodeShareData(shareData);
            const shareUrl = `${window.location.origin}${window.location.pathname}?share=${encodedData}`;
            
            this.showShareModal(shareUrl);
        } catch (error) {
            console.error('生成分享链接失败:', error);
            this.showToast('生成分享链接失败', 'error');
        }
    }

    collectShareData() {
        const photos = [];
        const photoItems = document.querySelectorAll('.photo-item');
        
        photoItems.forEach(item => {
            const img = item.querySelector('img');
            const overlay = item.querySelector('.photo-overlay');
            
            if (img) {
                const photo = {
                    url: img.src,
                    alt: img.alt || '',
                    date: '',
                    location: '',
                    description: ''
                };
                
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
            }
        });
        
        // 获取当前设置
        const settings = window.controlsManager ? window.controlsManager.exportSettings() : {};
        const layout = window.layoutEngine ? window.layoutEngine.getCurrentLayout() : 'grid-9';
        
        return {
            photos,
            settings,
            layout,
            timestamp: Date.now()
        };
    }

    encodeShareData(data) {
        const jsonString = JSON.stringify(data);
        return btoa(encodeURIComponent(jsonString));
    }

    decodeShareData(encodedData) {
        try {
            const jsonString = decodeURIComponent(atob(encodedData));
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('解码分享数据失败:', error);
            return null;
        }
    }

    showShareModal(shareUrl) {
        const shareModal = document.getElementById('share-modal');
        const shareLink = document.getElementById('share-link');
        
        shareLink.value = shareUrl;
        shareModal.classList.add('active');
        
        // 自动选中链接文本
        shareLink.select();
        shareLink.setSelectionRange(0, 99999); // 移动端兼容
    }

    closeShareModal() {
        const shareModal = document.getElementById('share-modal');
        shareModal.classList.remove('active');
    }

    async copyShareLink() {
        const shareLink = document.getElementById('share-link');
        
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(shareLink.value);
            } else {
                // 降级方案
                shareLink.select();
                document.execCommand('copy');
            }
            
            this.showToast('链接已复制到剪贴板');
        } catch (error) {
            console.error('复制失败:', error);
            this.showToast('复制失败，请手动复制', 'error');
        }
    }

    checkForSharedData() {
        const urlParams = new URLSearchParams(window.location.search);
        const shareData = urlParams.get('share');
        
        if (shareData) {
            const decodedData = this.decodeShareData(shareData);
            if (decodedData) {
                this.loadSharedData(decodedData);
            }
        }
    }

    async loadSharedData(data) {
        try {
            // 等待其他模块初始化完成
            await this.waitForModules();
            
            // 加载照片
            if (data.photos && window.photoUploader) {
                window.photoUploader.loadSharedPhotos(data.photos);
            }
            
            // 加载设置
            if (data.settings && window.controlsManager) {
                window.controlsManager.importSettings(data.settings);
            }
            
            // 加载布局
            if (data.layout && window.layoutEngine) {
                window.layoutEngine.setLayout(data.layout);
            }
            
            this.showToast('已加载分享的照片墙');
        } catch (error) {
            console.error('加载分享数据失败:', error);
            this.showToast('加载分享数据失败', 'error');
        }
    }

    waitForModules() {
        return new Promise((resolve) => {
            const checkModules = () => {
                if (window.photoUploader && window.controlsManager && window.layoutEngine) {
                    resolve();
                } else {
                    setTimeout(checkModules, 100);
                }
            };
            checkModules();
        });
    }

    async exportAsPNG() {
        try {
            this.showToast('正在生成PNG图片...');
            
            await this.loadLibraries();
            
            const photoWall = document.getElementById('photo-wall');
            const canvas = await html2canvas(photoWall, {
                backgroundColor: null,
                scale: 2, // 高分辨率
                useCORS: true,
                allowTaint: true,
                logging: false,
                width: photoWall.offsetWidth,
                height: photoWall.offsetHeight
            });
            
            // 创建下载链接
            const link = document.createElement('a');
            link.download = `照片墙_${this.getTimestamp()}.png`;
            link.href = canvas.toDataURL('image/png');
            
            // 触发下载
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showToast('PNG图片导出成功');
        } catch (error) {
            console.error('PNG导出失败:', error);
            this.showToast('PNG导出失败', 'error');
        }
    }

    async exportAsPDF() {
        try {
            this.showToast('正在生成PDF文件...');
            
            await this.loadLibraries();
            
            const photoWall = document.getElementById('photo-wall');
            const canvas = await html2canvas(photoWall, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                width: photoWall.offsetWidth,
                height: photoWall.offsetHeight
            });
            
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            
            // 计算PDF尺寸
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = imgWidth / imgHeight;
            
            // A4纸张尺寸 (mm)
            const a4Width = 210;
            const a4Height = 297;
            
            let pdfWidth, pdfHeight;
            if (ratio > a4Width / a4Height) {
                // 横向图片
                pdfWidth = a4Width;
                pdfHeight = a4Width / ratio;
            } else {
                // 纵向图片
                pdfHeight = a4Height;
                pdfWidth = a4Height * ratio;
            }
            
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: ratio > 1 ? 'landscape' : 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // 居中放置图片
            const x = (a4Width - pdfWidth) / 2;
            const y = (a4Height - pdfHeight) / 2;
            
            pdf.addImage(imgData, 'JPEG', x, y, pdfWidth, pdfHeight);
            
            // 添加标题
            const title = document.getElementById('main-title').textContent || '我们的爱情回忆';
            pdf.setFontSize(16);
            pdf.text(title, a4Width / 2, 20, { align: 'center' });
            
            // 添加时间戳
            pdf.setFontSize(10);
            pdf.text(`生成时间: ${new Date().toLocaleString()}`, a4Width / 2, a4Height - 10, { align: 'center' });
            
            pdf.save(`照片墙_${this.getTimestamp()}.pdf`);
            
            this.showToast('PDF文件导出成功');
        } catch (error) {
            console.error('PDF导出失败:', error);
            this.showToast('PDF导出失败', 'error');
        }
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

    // 生成二维码分享（可选功能）
    async generateQRCode(url) {
        try {
            // 可以集成QR码生成库
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
            return qrApiUrl;
        } catch (error) {
            console.error('生成二维码失败:', error);
            return null;
        }
    }

    // 社交媒体分享
    shareToSocial(platform, url, title = '我的照片墙') {
        const encodedUrl = encodeURIComponent(url);
        const encodedTitle = encodeURIComponent(title);
        
        let shareUrl;
        
        switch (platform) {
            case 'weibo':
                shareUrl = `https://service.weibo.com/share/share.php?url=${encodedUrl}&title=${encodedTitle}`;
                break;
            case 'qq':
                shareUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${encodedUrl}&title=${encodedTitle}`;
                break;
            case 'wechat':
                // 微信分享需要特殊处理，这里只是示例
                this.showToast('请复制链接到微信分享');
                return;
            default:
                this.showToast('不支持的分享平台', 'error');
                return;
        }
        
        window.open(shareUrl, '_blank', 'width=600,height=400');
    }
}

// 导出分享导出管理器
window.ShareExportManager = ShareExportManager;
export { ShareExportManager };