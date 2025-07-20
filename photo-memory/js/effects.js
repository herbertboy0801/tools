/**
 * 动态特效模块 - 实现花瓣飘落、星光闪烁等浪漫背景特效
 */

class EffectsManager {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        this.currentEffect = 'none';
        this.particles = [];
        this.isRunning = false;
        this.init();
    }

    init() {
        this.createCanvas();
        this.bindEvents();
    }

    createCanvas() {
        this.canvas = document.getElementById('effects-canvas');
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'effects-canvas';
            this.canvas.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1;
            `;
            document.body.appendChild(this.canvas);
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.resizeCanvas();
            }, 300);
        });
    }

    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // 重新初始化粒子
        if (this.currentEffect !== 'none') {
            this.initParticles();
        }
    }

    setEffect(effectType) {
        if (this.currentEffect === effectType) return;
        
        this.stop();
        this.currentEffect = effectType;
        
        if (effectType !== 'none') {
            this.start();
        }
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.initParticles();
        this.animate();
    }

    stop() {
        this.isRunning = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.particles = [];
        this.clearCanvas();
    }

    initParticles() {
        this.particles = [];
        
        switch (this.currentEffect) {
            case 'petals':
                this.initPetals();
                break;
            case 'stars':
                this.initStars();
                break;
            case 'hearts':
                this.initHearts();
                break;
            case 'bubbles':
                this.initBubbles();
                break;
        }
    }

    initPetals() {
        const petalCount = Math.floor((this.canvas.width * this.canvas.height) / 15000);
        
        for (let i = 0; i < petalCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height - this.canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * 2 + 1,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.1,
                size: Math.random() * 8 + 4,
                color: this.getRandomPetalColor(),
                opacity: Math.random() * 0.8 + 0.2,
                swing: Math.random() * 0.02 + 0.01
            });
        }
    }

    initStars() {
        const starCount = Math.floor((this.canvas.width * this.canvas.height) / 8000);
        
        for (let i = 0; i < starCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 3 + 1,
                twinkleSpeed: Math.random() * 0.05 + 0.02,
                twinklePhase: Math.random() * Math.PI * 2,
                brightness: Math.random() * 0.8 + 0.2
            });
        }
    }

    initHearts() {
        const heartCount = Math.floor((this.canvas.width * this.canvas.height) / 20000);
        
        for (let i = 0; i < heartCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height + this.canvas.height,
                vx: (Math.random() - 0.5) * 1,
                vy: -(Math.random() * 1.5 + 0.5),
                size: Math.random() * 12 + 8,
                color: this.getRandomHeartColor(),
                opacity: Math.random() * 0.7 + 0.3,
                pulse: Math.random() * 0.05 + 0.02,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }
    }

    initBubbles() {
        const bubbleCount = Math.floor((this.canvas.width * this.canvas.height) / 12000);
        
        for (let i = 0; i < bubbleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height + this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: -(Math.random() * 2 + 1),
                size: Math.random() * 15 + 5,
                opacity: Math.random() * 0.3 + 0.1,
                wobble: Math.random() * 0.02 + 0.01,
                wobblePhase: Math.random() * Math.PI * 2
            });
        }
    }

    animate() {
        if (!this.isRunning) return;
        
        this.clearCanvas();
        
        switch (this.currentEffect) {
            case 'petals':
                this.animatePetals();
                break;
            case 'stars':
                this.animateStars();
                break;
            case 'hearts':
                this.animateHearts();
                break;
            case 'bubbles':
                this.animateBubbles();
                break;
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    animatePetals() {
        this.particles.forEach((petal, index) => {
            // 更新位置
            petal.x += petal.vx + Math.sin(Date.now() * petal.swing) * 0.5;
            petal.y += petal.vy;
            petal.rotation += petal.rotationSpeed;
            
            // 重置超出边界的花瓣
            if (petal.y > this.canvas.height + 20) {
                petal.y = -20;
                petal.x = Math.random() * this.canvas.width;
            }
            if (petal.x > this.canvas.width + 20) {
                petal.x = -20;
            } else if (petal.x < -20) {
                petal.x = this.canvas.width + 20;
            }
            
            // 绘制花瓣
            this.drawPetal(petal);
        });
    }

    animateStars() {
        this.particles.forEach(star => {
            // 更新闪烁
            star.twinklePhase += star.twinkleSpeed;
            const twinkle = Math.sin(star.twinklePhase) * 0.5 + 0.5;
            
            // 绘制星星
            this.drawStar(star, twinkle);
        });
    }

    animateHearts() {
        this.particles.forEach((heart, index) => {
            // 更新位置
            heart.x += heart.vx;
            heart.y += heart.vy;
            
            // 脉冲效果
            heart.pulsePhase += heart.pulse;
            const pulse = Math.sin(heart.pulsePhase) * 0.2 + 1;
            
            // 重置超出边界的爱心
            if (heart.y < -20) {
                heart.y = this.canvas.height + 20;
                heart.x = Math.random() * this.canvas.width;
            }
            
            // 绘制爱心
            this.drawHeart(heart, pulse);
        });
    }

    animateBubbles() {
        this.particles.forEach(bubble => {
            // 更新位置
            bubble.x += bubble.vx + Math.sin(Date.now() * bubble.wobble + bubble.wobblePhase) * 0.3;
            bubble.y += bubble.vy;
            
            // 重置超出边界的气泡
            if (bubble.y < -20) {
                bubble.y = this.canvas.height + 20;
                bubble.x = Math.random() * this.canvas.width;
            }
            
            // 绘制气泡
            this.drawBubble(bubble);
        });
    }

    drawPetal(petal) {
        this.ctx.save();
        this.ctx.translate(petal.x, petal.y);
        this.ctx.rotate(petal.rotation);
        this.ctx.globalAlpha = petal.opacity;
        
        // 绘制花瓣形状
        this.ctx.fillStyle = petal.color;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, petal.size, petal.size * 0.6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    drawStar(star, twinkle) {
        this.ctx.save();
        this.ctx.globalAlpha = star.brightness * twinkle;
        
        const gradient = this.ctx.createRadialGradient(
            star.x, star.y, 0,
            star.x, star.y, star.size * 2
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, '#ffeb3b');
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, star.size * twinkle, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制十字光芒
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = star.brightness * twinkle * 0.8;
        
        this.ctx.beginPath();
        this.ctx.moveTo(star.x - star.size * 2, star.y);
        this.ctx.lineTo(star.x + star.size * 2, star.y);
        this.ctx.moveTo(star.x, star.y - star.size * 2);
        this.ctx.lineTo(star.x, star.y + star.size * 2);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    drawHeart(heart, pulse) {
        this.ctx.save();
        this.ctx.translate(heart.x, heart.y);
        this.ctx.scale(pulse, pulse);
        this.ctx.globalAlpha = heart.opacity;
        
        const size = heart.size;
        this.ctx.fillStyle = heart.color;
        
        // 绘制爱心形状
        this.ctx.beginPath();
        this.ctx.moveTo(0, size * 0.3);
        
        // 左半边
        this.ctx.bezierCurveTo(-size * 0.5, -size * 0.2, -size * 0.8, size * 0.1, 0, size * 0.8);
        
        // 右半边
        this.ctx.bezierCurveTo(size * 0.8, size * 0.1, size * 0.5, -size * 0.2, 0, size * 0.3);
        
        this.ctx.fill();
        
        this.ctx.restore();
    }

    drawBubble(bubble) {
        this.ctx.save();
        this.ctx.globalAlpha = bubble.opacity;
        
        // 气泡主体
        const gradient = this.ctx.createRadialGradient(
            bubble.x - bubble.size * 0.3, bubble.y - bubble.size * 0.3, 0,
            bubble.x, bubble.y, bubble.size
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.7, 'rgba(173, 216, 230, 0.3)');
        gradient.addColorStop(1, 'rgba(173, 216, 230, 0.1)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 气泡边框
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // 高光
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.beginPath();
        this.ctx.arc(
            bubble.x - bubble.size * 0.3,
            bubble.y - bubble.size * 0.3,
            bubble.size * 0.2,
            0, Math.PI * 2
        );
        this.ctx.fill();
        
        this.ctx.restore();
    }

    getRandomPetalColor() {
        const colors = [
            '#FFB6C1', // 浅粉色
            '#FFC0CB', // 粉色
            '#FF69B4', // 热粉色
            '#FF1493', // 深粉色
            '#DC143C', // 深红色
            '#FFE4E1', // 薄雾玫瑰
            '#FFCCCB'  // 浅珊瑚色
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    getRandomHeartColor() {
        const colors = [
            '#FF69B4', // 热粉色
            '#FF1493', // 深粉色
            '#DC143C', // 深红色
            '#B22222', // 火砖红
            '#CD5C5C', // 印度红
            '#F08080'  // 浅珊瑚色
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // 性能优化：根据设备性能调整粒子数量
    getOptimalParticleCount(baseCount) {
        const performance = this.getDevicePerformance();
        
        switch (performance) {
            case 'high':
                return baseCount;
            case 'medium':
                return Math.floor(baseCount * 0.7);
            case 'low':
                return Math.floor(baseCount * 0.4);
            default:
                return Math.floor(baseCount * 0.6);
        }
    }

    getDevicePerformance() {
        // 简单的设备性能检测
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) return 'low';
        
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            if (renderer.includes('Intel') || renderer.includes('AMD')) {
                return 'medium';
            }
            if (renderer.includes('NVIDIA') || renderer.includes('GeForce')) {
                return 'high';
            }
        }
        
        // 基于屏幕分辨率和设备像素比判断
        const pixelCount = window.screen.width * window.screen.height * (window.devicePixelRatio || 1);
        
        if (pixelCount > 2073600) { // > 1920x1080
            return 'high';
        } else if (pixelCount > 921600) { // > 1280x720
            return 'medium';
        } else {
            return 'low';
        }
    }

    // 暂停和恢复（用于页面不可见时优化性能）
    pause() {
        if (this.isRunning) {
            this.wasRunning = true;
            this.stop();
        }
    }

    resume() {
        if (this.wasRunning && this.currentEffect !== 'none') {
            this.start();
            this.wasRunning = false;
        }
    }

    // 销毁
    destroy() {
        this.stop();
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this.canvas = null;
        this.ctx = null;
    }
}

// 页面可见性变化时优化性能
document.addEventListener('visibilitychange', () => {
    if (window.effectsManager) {
        if (document.hidden) {
            window.effectsManager.pause();
        } else {
            window.effectsManager.resume();
        }
    }
});

// 导出特效管理器
window.EffectsManager = EffectsManager;
export { EffectsManager };