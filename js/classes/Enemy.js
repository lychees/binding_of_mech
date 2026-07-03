import { bullets, particles, cameraX, cameraY, WORLD_WIDTH, WORLD_HEIGHT, obstacles } from '../config.js';
import { WEAPONS } from '../weapons.js';
import { ENEMY_TEMPLATES } from '../enemies.js';
import Bullet from './Bullet.js';
import Particle from './Particle.js';

// mech 由主模块在创建敌人后设置
let mechRef = null;
export function setMechRef(m) { mechRef = m; }

class Enemy {
    constructor(x, y, templateKey) {
        const template = ENEMY_TEMPLATES[templateKey] || ENEMY_TEMPLATES.soldier;
        this.x = x;
        this.y = y;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = template.speed;
        this.size = template.size;
        this.color = template.color;
        this.health = template.health;
        this.maxHealth = template.health;
        this.moveTimer = 0;
        this.moveDuration = 60 + Math.random() * 60;
        this.shootCooldown = 0;
        this.fireRate = template.fireRate;
        this.detectionRange = template.detectionRange;
        this.weapon = template.weapon;
        this.drawType = template.drawType;
        this.templateKey = templateKey;
        
        // 物理/状态
        this.velocityX = 0;
        this.velocityY = 0;
        this.collisionRadius = this.size + 5;
        this.collisionDamageMultiplier = 0.6;
        this.lastCollisionTime = 0;
        this.collisionCooldown = 15;
        this.isBurning = false;
        this.burnTimer = 0;
        this.burnDamageTimer = 0;
        this.smokeTimer = 0;
    }
    
    update() {
        // 简单AI移动
        this.moveTimer++;
        if (this.moveTimer > this.moveDuration) {
            this.moveTimer = 0;
            this.moveDuration = 60 + Math.random() * 60;
            this.angle += (Math.random() - 0.5) * Math.PI;
        }
        
        this.x += Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;
        this.velocityX = Math.sin(this.angle) * this.speed;
        this.velocityY = -Math.cos(this.angle) * this.speed;
        
        if (this.lastCollisionTime > 0) this.lastCollisionTime--;
        
        // 障碍物碰撞检测
        for (let i = 0; i < obstacles.length; i++) {
            const obs = obstacles[i];
            if (this.x + this.size > obs.x && this.x - this.size < obs.x + obs.width &&
                this.y + this.size > obs.y && this.y - this.size < obs.y + obs.height) {
                // 简单推开
                const centerX = obs.x + obs.width / 2;
                const centerY = obs.y + obs.height / 2;
                const dx = this.x - centerX;
                const dy = this.y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    this.x += (dx / dist) * 3;
                    this.y += (dy / dist) * 3;
                }
                // 改变方向
                this.angle += Math.PI / 2;
            }
        }
        
        // 边界限制
        this.x = Math.max(this.size, Math.min(WORLD_WIDTH - this.size, this.x));
        this.y = Math.max(this.size, Math.min(WORLD_HEIGHT - this.size, this.y));
        
        // 射击
        if (this.shootCooldown > 0) this.shootCooldown--;
        
        // 着火持续掉血
        if (this.isBurning) {
            this.burnTimer--;
            this.burnDamageTimer--;
            if (this.burnDamageTimer <= 0) {
                this.burnDamageTimer = 30;
                this.health -= 2;
            }
            if (this.burnTimer <= 0) this.isBurning = false;
        }
        
        // 冒烟效果
        const healthRatio = this.health / this.maxHealth;
        if (healthRatio < 0.6 && healthRatio > 0) {
            this.smokeTimer--;
            const threshold = healthRatio < 0.3 ? 3 : 8;
            if (this.smokeTimer <= 0) {
                this.smokeTimer = threshold;
                // 使用主模块的 particles 数组； Enemy.js 已从 config 导入 particles
                particles.push({
                    x: this.x + (Math.random() - 0.5) * 12,
                    y: this.y + (Math.random() - 0.5) * 12,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: -0.3 - Math.random() * 0.5,
                    life: 40 + Math.random() * 20,
                    maxLife: 60,
                    color: healthRatio < 0.3 ? '#555555' : '#777777',
                    size: 3 + Math.random() * 3,
                    update: function() {
                        this.x += this.vx;
                        this.y += this.vy;
                        this.vx *= 0.98;
                        this.vy *= 0.98;
                        this.size += 0.1;
                        this.life--;
                    },
                    draw: function() {
                        const opacity = Math.max(0, this.life / this.maxLife);
                        ctx.fillStyle = this.color;
                        ctx.globalAlpha = opacity * 0.4;
                        ctx.beginPath();
                        ctx.arc(this.x - cameraX, this.y - cameraY, Math.max(0.1, this.size), 0, Math.PI * 2);
                        ctx.fill();
                        ctx.globalAlpha = 1;
                    }
                });
            }
        }
        
        // 检测与玩家距离
        const mech = mechRef;
        if (!mech) return;
        const dx = mech.x - this.x;
        const dy = mech.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < this.detectionRange && this.shootCooldown <= 0) {
            // 朝向玩家射击
            const angleToPlayer = Math.atan2(dx, -dy);
            const weaponObj = WEAPONS[this.weapon] || WEAPONS.VULCAN;
            
            if (weaponObj.drawType === 'shotgun') {
                for (let i = 0; i < weaponObj.pelletCount; i++) {
                    const spread = (Math.random() - 0.5) * weaponObj.spread * 2;
                    bullets.push(new Bullet(
                        this.x, this.y,
                        angleToPlayer + spread,
                        weaponObj,
                        true
                    ));
                }
            } else {
                bullets.push(new Bullet(
                    this.x, this.y,
                    angleToPlayer + (Math.random() - 0.5) * 0.3,
                    weaponObj,
                    true
                ));
            }
            this.shootCooldown = this.fireRate;
        }
    }
    
    draw() {
        // 着火时头顶火焰
        if (this.isBurning) {
            for (let i = 0; i < 2; i++) {
                particles.push(new Particle(
                    this.x + (Math.random() - 0.5) * 14,
                    this.y - 10 + (Math.random() - 0.5) * 14,
                    (Math.random() - 0.5) * 1,
                    -0.5 - Math.random() * 1,
                    Math.random() < 0.5 ? '#ff4400' : '#ffaa00'
                ));
            }
        }
        
        ctx.save();
        ctx.translate(this.x - cameraX, this.y - cameraY);
        ctx.rotate(this.angle);
        
        // 根据类型绘制不同外观
        switch (this.drawType) {
            case 'scout':
                // 侦察兵 - 三角形，速度快
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.moveTo(0, -this.size);
                ctx.lineTo(-this.size, this.size);
                ctx.lineTo(this.size, this.size);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'heavy':
                // 重装兵 - 大六边形
                ctx.fillStyle = this.color;
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    const hx = Math.cos(angle) * this.size;
                    const hy = Math.sin(angle) * this.size;
                    if (i === 0) ctx.moveTo(hx, hy);
                    else ctx.lineTo(hx, hy);
                }
                ctx.closePath();
                ctx.fill();
                // 装甲细节
                ctx.fillStyle = '#884444';
                ctx.beginPath();
                ctx.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'sniper':
                // 狙击手 - 菱形
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.moveTo(0, -this.size);
                ctx.lineTo(this.size * 0.7, 0);
                ctx.lineTo(0, this.size);
                ctx.lineTo(-this.size * 0.7, 0);
                ctx.closePath();
                ctx.fill();
                // 瞄准镜
                ctx.fillStyle = '#ffccff';
                ctx.beginPath();
                ctx.arc(0, -this.size * 0.3, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'shotgunner':
                // 霰弹手 - 宽矩形
                ctx.fillStyle = this.color;
                ctx.fillRect(-this.size * 1.2, -this.size * 0.8, this.size * 2.4, this.size * 1.6);
                // 双管
                ctx.fillStyle = '#cc8844';
                ctx.fillRect(-6, -this.size - 6, 4, 8);
                ctx.fillRect(2, -this.size - 6, 4, 8);
                break;
                
            case 'medic':
                // 医疗兵 - 绿色圆形带白色十字
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
                // 白色十字
                ctx.fillStyle = '#ffffff';
                const crossSize = this.size * 0.6;
                const crossThickness = this.size * 0.2;
                // 竖线
                ctx.fillRect(-crossThickness / 2, -crossSize / 2, crossThickness, crossSize);
                // 横线
                ctx.fillRect(-crossSize / 2, -crossThickness / 2, crossSize, crossThickness);
                // 外圈
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.stroke();
                break;
                
            default:
                // 步兵 - 方形
                ctx.fillStyle = this.color;
                ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);
                // 炮管
                ctx.fillStyle = '#aa2222';
                ctx.fillRect(-2, -this.size - 8, 4, 8);
                // 方向指示
                ctx.fillStyle = '#ff8888';
                ctx.beginPath();
                ctx.arc(0, -this.size + 4, 4, 0, Math.PI * 2);
                ctx.fill();
        }
        
        ctx.restore();
        
        // 血条
        const barWidth = 20;
        const barHeight = 3;
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(screenX - barWidth/2, screenY - this.size - 10, barWidth, barHeight);
        
        ctx.fillStyle = this.color;
        ctx.fillRect(screenX - barWidth/2, screenY - this.size - 10, barWidth * (this.health / this.maxHealth), barHeight);
        
        // 显示名称
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.fillText(ENEMY_TEMPLATES[this.templateKey]?.name || '', screenX - barWidth/2, screenY - this.size - 14);
    }
    takeHit(damage) {
        this.health -= damage;
        if (Math.random() < 0.15) {
            this.isBurning = true;
            this.burnTimer = 180;
            this.burnDamageTimer = 30;
        }
    }
    
    resolveCollision(other) {
        if (this.health <= 0 || (other.health !== undefined && other.health <= 0)) return;
        
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const otherRadius = other.collisionRadius || 20;
        const minDist = this.collisionRadius + otherRadius;
        
        if (dist < minDist && dist > 0) {
            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;
            this.x -= nx * overlap * 0.5;
            this.y -= ny * overlap * 0.5;
            if (other.x !== undefined) {
                other.x += nx * overlap * 0.5;
                other.y += ny * overlap * 0.5;
            }
            
            const rvx = (other.velocityX || 0) - this.velocityX;
            const rvy = (other.velocityY || 0) - this.velocityY;
            const velAlongNormal = rvx * nx + rvy * ny;
            
            if (velAlongNormal < 0) {
                if (this.lastCollisionTime > 0 || (other.lastCollisionTime > 0)) return;
                
                const restitution = 0.5;
                const impulse = -(1 + restitution) * velAlongNormal / 2;
                this.velocityX -= impulse * nx;
                this.velocityY -= impulse * ny;
                if (other.velocityX !== undefined) {
                    other.velocityX += impulse * nx;
                    other.velocityY += impulse * ny;
                }
                
                const relativeSpeed = Math.abs(velAlongNormal);
                const damage = relativeSpeed * this.collisionDamageMultiplier;
                if (damage >= 1) {
                    this.takeHit(damage * 0.5);
                    if (other.takeHit) other.takeHit(damage * 0.5);
                    this.lastCollisionTime = this.collisionCooldown;
                    if (other.lastCollisionTime !== undefined) other.lastCollisionTime = other.collisionCooldown || 15;
                    
                    for (let i = 0; i < 6; i++) {
                        particles.push(new Particle(
                            this.x + nx * this.collisionRadius + (Math.random() - 0.5) * 10,
                            this.y + ny * this.collisionRadius + (Math.random() - 0.5) * 10,
                            (Math.random() - 0.5) * 4,
                            (Math.random() - 0.5) * 4,
                            '#ffcc00'
                        ));
                    }
                }
            }
        }
    }
}

export default Enemy;
