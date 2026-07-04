// 实体基类：共享位置、速度、着火、冒烟、碰撞等逻辑
import { particles } from '../config.js?v=2';
import { clamp, normalize } from '../utils.js?v=2';
import { createFlame, createSmoke, createSpark } from './Particle.js?v=2';

export default class Entity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.velocityX = 0;
        this.velocityY = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.isDead = false;

        this.collisionRadius = 20;
        this.collisionDamageMultiplier = 0.6;
        this.lastCollisionTime = 0;
        this.collisionCooldown = 15;

        this.isBurning = false;
        this.burnTimer = 0;
        this.burnDamageTimer = 0;
        this.burnChance = 0.15;

        this.smokeTimer = 0;
    }

    takeHit(damage) {
        this.health -= damage;
        if (Math.random() < this.burnChance) {
            this.isBurning = true;
            this.burnTimer = 180;
            this.burnDamageTimer = 30;
        }
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
        }
    }

    updateStatusEffects() {
        if (this.lastCollisionTime > 0) this.lastCollisionTime--;

        if (this.isBurning) {
            this.burnTimer--;
            this.burnDamageTimer--;
            if (this.burnDamageTimer <= 0) {
                this.burnDamageTimer = 30;
                this.takeHit(2);
            }
            if (this.burnTimer <= 0) this.isBurning = false;
            if (Math.random() < 0.4) {
                particles.push(...createFlame(this.x, this.y - 10));
            }
        }

        const healthRatio = this.health / this.maxHealth;
        if (healthRatio < 0.6 && healthRatio > 0) {
            this.smokeTimer--;
            const threshold = healthRatio < 0.3 ? 3 : 8;
            if (this.smokeTimer <= 0) {
                this.smokeTimer = threshold;
                const color = healthRatio < 0.3 ? '#555555' : '#777777';
                particles.push(...createSmoke(this.x, this.y, color, 1, 4));
            }
        }
    }

    resolveCollision(other) {
        if (this.isDead || other.isDead) return;
        if (this.health <= 0 || (other.health !== undefined && other.health <= 0)) return;

        const dx = other.x - this.x;
        const dy = other.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const otherRadius = other.collisionRadius || 20;
        const minDist = this.collisionRadius + otherRadius;

        if (dist >= minDist || dist <= 0) return;

        const overlap = minDist - dist;
        const nx = dx / dist;
        const ny = dy / dist;

        this.x -= nx * overlap * 0.5;
        this.y -= ny * overlap * 0.5;
        other.x += nx * overlap * 0.5;
        other.y += ny * overlap * 0.5;

        const rvx = (other.velocityX || 0) - this.velocityX;
        const rvy = (other.velocityY || 0) - this.velocityY;
        const velAlongNormal = rvx * nx + rvy * ny;

        if (velAlongNormal >= 0) return;
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
        const combinedMultiplier = (this.collisionDamageMultiplier || 0.6) + (other.collisionDamageMultiplier || 0.6);
        const damage = relativeSpeed * combinedMultiplier * 0.5;
        if (damage >= 1) {
            this.takeHit(damage);
            if (other.takeHit) other.takeHit(damage);
            this.lastCollisionTime = this.collisionCooldown;
            if (other.lastCollisionTime !== undefined) {
                other.lastCollisionTime = other.collisionCooldown || 15;
            }

            const sparkX = this.x + nx * this.collisionRadius;
            const sparkY = this.y + ny * this.collisionRadius;
            particles.push(...createSpark(sparkX, sparkY, '#ffcc00', Math.min(12, Math.floor(damage)), Math.min(8, 2 + damage * 0.5)));
        }
    }

    boundPosition(minX, minY, maxX, maxY) {
        this.x = clamp(this.x, minX, maxX);
        this.y = clamp(this.y, minY, maxY);
    }
}
