import { keys, bullets, particles, obstacles, cameraX, cameraY, WORLD_WIDTH, WORLD_HEIGHT } from '../config.js';
import Bullet from './Bullet.js';
import Particle from './Particle.js';

class Pilot {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.maxSpeed = 3.5;
        this.acceleration = 0.2;
        this.deceleration = 0.08;
        
        this.size = 6;
        this.health = 30;
        this.maxHealth = 30;
        this.isDead = false;
        
        this.fireCooldown = 0;
        this.fireRate = 12;
        this.damage = 4;
        this.bulletSpeed = 10;
        this.bulletLife = 40;
        this.bulletColor = '#ffcc44';
        this.bulletRadius = 2;
        
        this.walkCycle = 0;
        
        // 与机甲的互动
        this.nearbyMech = null;
    }
    
    update() {
        if (this.isDead) return;
        
        if (this.fireCooldown > 0) this.fireCooldown--;
        
        // 移动输入
        let moveX = 0;
        let moveY = 0;
        if (keys['w'] || keys['W']) moveY = -1;
        else if (keys['s'] || keys['S']) moveY = 1;
        if (keys['a'] || keys['A']) moveX = -1;
        else if (keys['d'] || keys['D']) moveX = 1;
        
        // 归一化对角线移动
        if (moveX !== 0 || moveY !== 0) {
            const len = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX /= len;
            moveY /= len;
            
            this.velocityX += (moveX * this.maxSpeed - this.velocityX) * this.acceleration;
            this.velocityY += (moveY * this.maxSpeed - this.velocityY) * this.acceleration;
            this.walkCycle += 0.3;
        } else {
            this.velocityX *= (1 - this.deceleration);
            this.velocityY *= (1 - this.deceleration);
            if (Math.abs(this.velocityX) < 0.01) this.velocityX = 0;
            if (Math.abs(this.velocityY) < 0.01) this.velocityY = 0;
        }
        
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // 边界限制
        this.x = Math.max(this.size, Math.min(WORLD_WIDTH - this.size, this.x));
        this.y = Math.max(this.size, Math.min(WORLD_HEIGHT - this.size, this.y));
        
        // 障碍物碰撞
        for (let i = 0; i < obstacles.length; i++) {
            const obs = obstacles[i];
            if (this.x + this.size > obs.x && this.x - this.size < obs.x + obs.width &&
                this.y + this.size > obs.y && this.y - this.size < obs.y + obs.height) {
                const centerX = obs.x + obs.width / 2;
                const centerY = obs.y + obs.height / 2;
                const dx = this.x - centerX;
                const dy = this.y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    this.x += (dx / dist) * 2;
                    this.y += (dy / dist) * 2;
                }
            }
        }
        
        // 面向鼠标
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;
        const mouseX = window.mouseX || 0;
        const mouseY = window.mouseY || 0;
        this.angle = Math.atan2(mouseX - screenX, -(mouseY - screenY));
        
        // 射击
        if (keys[' '] && this.fireCooldown <= 0) {
            this.shoot();
        }
        
        // 行走尘土
        const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        if (speed > 0.5 && Math.random() < 0.1) {
            particles.push(new Particle(
                this.x + (Math.random() - 0.5) * 6,
                this.y + 6,
                (Math.random() - 0.5) * 0.5,
                0.2 + Math.random() * 0.3,
                '#555555'
            ));
        }
    }
    
    shoot() {
        this.fireCooldown = this.fireRate;
        bullets.push(new Bullet(
            this.x, this.y,
            this.angle + (Math.random() - 0.5) * 0.15,
            {
                bulletSpeed: this.bulletSpeed,
                bulletRadius: this.bulletRadius,
                bulletLife: this.bulletLife,
                damage: this.damage,
                bulletColor: this.bulletColor,
                drawType: 'vulcan'
            }
        ));
        
        // 枪口闪光
        for (let i = 0; i < 3; i++) {
            const cos = Math.cos(this.angle);
            const sin = Math.sin(this.angle);
            particles.push(new Particle(
                this.x + sin * 8,
                this.y - cos * 8,
                sin * 2 + (Math.random() - 0.5),
                -cos * 2 + (Math.random() - 0.5),
                this.bulletColor
            ));
        }
    }
    
    takeHit(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
        }
    }
    
    draw() {
        if (this.isDead) return;
        
        ctx.save();
        ctx.translate(this.x - cameraX, this.y - cameraY);
        
        // 阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 8, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 腿部摆动
        const legSwing = Math.sin(this.walkCycle) * 4;
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2, 0);
        ctx.lineTo(-2 + legSwing, 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(2, 0);
        ctx.lineTo(2 - legSwing, 10);
        ctx.stroke();
        
        // 身体
        ctx.fillStyle = '#e0e0e0';
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 头盔
        ctx.fillStyle = '#a0d0f0';
        ctx.beginPath();
        ctx.arc(0, -2, this.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        // 面向方向
        ctx.rotate(this.angle);
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(0, -this.size - 4, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // 血条
        const barWidth = 16;
        const barHeight = 3;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - cameraX - barWidth / 2, this.y - cameraY - this.size - 8, barWidth, barHeight);
        ctx.fillStyle = this.health > this.maxHealth * 0.5 ? '#00ff88' : '#ff4444';
        ctx.fillRect(this.x - cameraX - barWidth / 2, this.y - cameraY - this.size - 8, barWidth * (this.health / this.maxHealth), barHeight);
    }
}

export default Pilot;
