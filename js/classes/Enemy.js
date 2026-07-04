import { bullets, particles, cameraX, cameraY, WORLD_WIDTH, WORLD_HEIGHT, obstacles } from '../config.js';
import { WEAPONS } from '../weapons.js';
import { ENEMY_TEMPLATES } from '../enemies.js';
import Bullet from './Bullet.js';
import Entity from './Entity.js';
import { createFlame, createSpark } from './Particle.js';

// mech 由主模块在创建敌人后设置
let mechRef = null;
export function setMechRef(m) { mechRef = m; }

const DRAWERS = {
    scout(ctx, size) {
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(-size, size);
        ctx.lineTo(size, size);
        ctx.closePath();
        ctx.fill();
    },
    heavy(ctx, size) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            const hx = Math.cos(a) * size;
            const hy = Math.sin(a) * size;
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#884444';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
    },
    sniper(ctx, size) {
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size * 0.7, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size * 0.7, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffccff';
        ctx.beginPath();
        ctx.arc(0, -size * 0.3, 3, 0, Math.PI * 2);
        ctx.fill();
    },
    shotgunner(ctx, size) {
        ctx.fillRect(-size * 1.2, -size * 0.8, size * 2.4, size * 1.6);
        ctx.fillStyle = '#cc8844';
        ctx.fillRect(-6, -size - 6, 4, 8);
        ctx.fillRect(2, -size - 6, 4, 8);
    },
    medic(ctx, size) {
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        const crossSize = size * 0.6;
        const crossThickness = size * 0.2;
        ctx.fillRect(-crossThickness / 2, -crossSize / 2, crossThickness, crossSize);
        ctx.fillRect(-crossSize / 2, -crossThickness / 2, crossSize, crossThickness);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.stroke();
    },
    soldier(ctx, size) {
        ctx.fillRect(-size, -size, size * 2, size * 2);
        ctx.fillStyle = '#aa2222';
        ctx.fillRect(-2, -size - 8, 4, 8);
        ctx.fillStyle = '#ff8888';
        ctx.beginPath();
        ctx.arc(0, -size + 4, 4, 0, Math.PI * 2);
        ctx.fill();
    }
};

class Enemy extends Entity {
    constructor(x, y, templateKey) {
        super(x, y);
        const template = ENEMY_TEMPLATES[templateKey] || ENEMY_TEMPLATES.soldier;
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
        this.drawType = template.drawType || 'soldier';
        this.templateKey = templateKey;
        this.collisionRadius = this.size + 5;
        this.collisionDamageMultiplier = 0.6;
    }

    update() {
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

        this.updateStatusEffects();

        // 障碍物碰撞检测
        for (const obs of obstacles) {
            if (this.x + this.size > obs.x && this.x - this.size < obs.x + obs.width &&
                this.y + this.size > obs.y && this.y - this.size < obs.y + obs.height) {
                const centerX = obs.x + obs.width / 2;
                const centerY = obs.y + obs.height / 2;
                const dx = this.x - centerX;
                const dy = this.y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    this.x += (dx / dist) * 3;
                    this.y += (dy / dist) * 3;
                }
                this.angle += Math.PI / 2;
            }
        }

        this.boundPosition(this.size, this.size, WORLD_WIDTH - this.size, WORLD_HEIGHT - this.size);

        if (this.shootCooldown > 0) this.shootCooldown--;

        const mech = mechRef;
        if (!mech) return;
        const dx = mech.x - this.x;
        const dy = mech.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.detectionRange && this.shootCooldown <= 0) {
            const angleToPlayer = Math.atan2(dx, -dy);
            const weaponObj = WEAPONS[this.weapon] || WEAPONS.VULCAN;
            if (weaponObj.drawType === 'shotgun') {
                for (let i = 0; i < weaponObj.pelletCount; i++) {
                    const spread = (Math.random() - 0.5) * weaponObj.spread * 2;
                    bullets.push(new Bullet(this.x, this.y, angleToPlayer + spread, weaponObj, true));
                }
            } else {
                bullets.push(new Bullet(this.x, this.y, angleToPlayer + (Math.random() - 0.5) * 0.3, weaponObj, true));
            }
            this.shootCooldown = this.fireRate;
        }
    }

    draw() {
        if (this.isBurning) {
            particles.push(...createFlame(this.x, this.y - 10));
        }

        ctx.save();
        ctx.translate(this.x - cameraX, this.y - cameraY);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.color;

        const drawer = DRAWERS[this.drawType] || DRAWERS.soldier;
        drawer(ctx, this.size);

        ctx.restore();

        const barWidth = 20;
        const barHeight = 3;
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;

        ctx.fillStyle = '#333';
        ctx.fillRect(screenX - barWidth / 2, screenY - this.size - 10, barWidth, barHeight);
        ctx.fillStyle = this.color;
        ctx.fillRect(screenX - barWidth / 2, screenY - this.size - 10, barWidth * (this.health / this.maxHealth), barHeight);

        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.fillText(ENEMY_TEMPLATES[this.templateKey]?.name || '', screenX - barWidth / 2, screenY - this.size - 14);
    }

    resolveCollision(other) {
        super.resolveCollision(other);
        if (this.lastCollisionTime === this.collisionCooldown) {
            particles.push(...createSpark(
                this.x + (other.x - this.x) / 2,
                this.y + (other.y - this.y) / 2,
                '#ffcc00', 6, 4
            ));
        }
    }
}

export default Enemy;
