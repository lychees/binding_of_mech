import { bullets, particles, cameraX, cameraY, WORLD_WIDTH, WORLD_HEIGHT, obstacles } from '../config.js';
import { WEAPONS } from '../weapons.js';
import Bullet from './Bullet.js?v=2';
import Particle from './Particle.js?v=2';

class Fortress {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 80;
        this.health = 2000;
        this.maxHealth = 2000;
        this.armor = 0.3;
        this.isDead = false;
        
        // 要塞炮台配置
        this.turrets = [];
        const turretCount = 6;
        for (let i = 0; i < turretCount; i++) {
            const angle = (i / turretCount) * Math.PI * 2;
            this.turrets.push({
                angle: angle,
                targetAngle: angle,
                fireCooldown: i * 20,
                fireRate: 40 + Math.random() * 20,
                range: 500,
                damage: 8,
                alive: true
            });
        }
        
        this.rotation = 0;
        this.rotationSpeed = 0.002;
        this.shootCooldown = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 300; // 每5秒召唤小怪
        this.detectionRange = 700;
        
        // 物理碰撞
        this.collisionRadius = this.size;
        this.velocityX = 0;
        this.velocityY = 0;
    }
    
    update(mech, pilot, isPilotActive) {
        if (this.isDead) return;
        
        this.rotation += this.rotationSpeed;
        
        const target = isPilotActive && pilot && !pilot.isDead ? pilot : mech;
        if (!target) return;
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // 炮台瞄准和射击
        for (let i = 0; i < this.turrets.length; i++) {
            const turret = this.turrets[i];
            if (!turret.alive) continue;
            
            // 基础角度 + 旋转
            const baseAngle = this.rotation + turret.angle;
            
            if (dist < turret.range) {
                // 瞄准玩家
                turret.targetAngle = Math.atan2(dx, -dy);
                
                if (turret.fireCooldown > 0) turret.fireCooldown--;
                if (turret.fireCooldown <= 0) {
                    this.fireTurret(turret, baseAngle);
                    turret.fireCooldown = turret.fireRate;
                }
            } else {
                turret.targetAngle = baseAngle;
                if (turret.fireCooldown > 0) turret.fireCooldown--;
            }
        }
        
        // 主炮齐射
        if (dist < this.detectionRange) {
            if (this.shootCooldown > 0) this.shootCooldown--;
            if (this.shootCooldown <= 0) {
                this.fireMainCannons(target);
                this.shootCooldown = 120;
            }
        }
        
        // 召唤小怪
        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            return this.spawnMinion();
        }
        
        return null;
    }
    
    fireTurret(turret, baseAngle) {
        const cos = Math.cos(turret.targetAngle);
        const sin = Math.sin(turret.targetAngle);
        const muzzleX = this.x + sin * (this.size + 15);
        const muzzleY = this.y - cos * (this.size + 15);
        
        const spread = (Math.random() - 0.5) * 0.15;
        bullets.push(new Bullet(
            muzzleX, muzzleY,
            turret.targetAngle + spread,
            {
                bulletSpeed: 9,
                bulletRadius: 3,
                bulletLife: 80,
                damage: turret.damage,
                bulletColor: '#ff4444',
                drawType: 'cannon'
            },
            true
        ));
    }
    
    fireMainCannons(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const baseAngle = Math.atan2(dx, -dy);
        
        // 三发主炮扇形射击
        for (let i = -1; i <= 1; i++) {
            const angle = baseAngle + i * 0.3;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            bullets.push(new Bullet(
                this.x + sin * (this.size + 20),
                this.y - cos * (this.size + 20),
                angle,
                {
                    bulletSpeed: 7,
                    bulletRadius: 8,
                    bulletLife: 100,
                    damage: 25,
                    bulletColor: '#ff6600',
                    drawType: 'cannon'
                },
                true
            ));
        }
        
        // 发射特效
        for (let k = 0; k < 10; k++) {
            particles.push(new Particle(
                this.x, this.y,
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4,
                '#ff6600'
            ));
        }
    }
    
    spawnMinion() {
        const angle = Math.random() * Math.PI * 2;
        const dist = this.size + 50 + Math.random() * 80;
        return {
            x: this.x + Math.sin(angle) * dist,
            y: this.y - Math.cos(angle) * dist,
            type: Math.random() < 0.6 ? 'soldier' : 'heavy'
        };
    }
    
    takeHit(damage) {
        const actualDamage = damage * (1 - this.armor);
        this.health -= actualDamage;
        
        // 随机摧毁炮台
        if (this.health < this.maxHealth * 0.7 && this.turrets.filter(t => t.alive).length > 4) {
            this.destroyRandomTurret();
        }
        if (this.health < this.maxHealth * 0.4 && this.turrets.filter(t => t.alive).length > 2) {
            this.destroyRandomTurret();
        }
        
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
        }
    }
    
    destroyRandomTurret() {
        const aliveTurrets = this.turrets.filter(t => t.alive);
        if (aliveTurrets.length === 0) return;
        const turret = aliveTurrets[Math.floor(Math.random() * aliveTurrets.length)];
        turret.alive = false;
        
        // 炮台爆炸特效
        const cos = Math.cos(this.rotation + turret.angle);
        const sin = Math.sin(this.rotation + turret.angle);
        for (let k = 0; k < 15; k++) {
            particles.push(new Particle(
                this.x + sin * (this.size + 10),
                this.y - cos * (this.size + 10),
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5,
                '#ff8800'
            ));
        }
    }
    
    draw() {
        if (this.isDead) return;
        
        ctx.save();
        ctx.translate(this.x - cameraX, this.y - cameraY);
        ctx.rotate(this.rotation);
        
        // 阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 10, this.size * 0.9, this.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 主体
        ctx.fillStyle = '#3a2a2a';
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const r = i % 2 === 0 ? this.size : this.size * 0.7;
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#5a3a3a';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 核心
        const healthRatio = this.health / this.maxHealth;
        ctx.fillStyle = healthRatio > 0.5 ? '#ff4444' : '#ff8800';
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // 炮台
        for (let i = 0; i < this.turrets.length; i++) {
            const turret = this.turrets[i];
            if (!turret.alive) continue;
            const angle = turret.angle;
            const tx = Math.cos(angle) * (this.size + 10);
            const ty = Math.sin(angle) * (this.size + 10);
            
            ctx.save();
            ctx.translate(tx, ty);
            ctx.rotate(angle + Math.PI / 2);
            
            ctx.fillStyle = '#4a4a4a';
            ctx.fillRect(-8, -12, 16, 24);
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(-3, -22, 6, 12);
            
            ctx.restore();
        }
        
        ctx.restore();
        
        // 血条
        const barWidth = 120;
        const barHeight = 8;
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(screenX - barWidth / 2, screenY - this.size - 20, barWidth, barHeight);
        ctx.fillStyle = healthRatio > 0.5 ? '#ff4444' : '#ff8800';
        ctx.fillRect(screenX - barWidth / 2, screenY - this.size - 20, barWidth * healthRatio, barHeight);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX - barWidth / 2, screenY - this.size - 20, barWidth, barHeight);
        
        // 名称
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('移动要塞', screenX - 35, screenY - this.size - 28);
    }
}

export default Fortress;
