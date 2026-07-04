import { cameraX, cameraY, WORLD_WIDTH, WORLD_HEIGHT, particles } from '../config.js?v=2';
import Particle, { createSpark } from './Particle.js?v=2';
import { dist } from '../utils.js?v=2';

class Missile {
    constructor(x, y, angle, weapon, isEnemyBullet = false, target = null) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.weapon = weapon;
        this.speed = weapon.bulletSpeed;
        this.radius = weapon.bulletRadius;
        this.life = weapon.bulletLife;
        this.damage = weapon.damage;
        this.isEnemyBullet = isEnemyBullet;
        this.target = target;
        this.homing = weapon.homing || false;
        this.turnSpeed = weapon.turnSpeed || 0.06;
        this.acceleration = weapon.acceleration || 0.15;
        this.maxSpeed = weapon.maxSpeed || this.speed * 1.5;
        this.vx = Math.sin(angle) * this.speed;
        this.vy = -Math.cos(angle) * this.speed;
    }

    update(enemies, players, pilot, isPilotActive) {
        this.life--;

        if (this.homing && this.target && !this.target.isDead && this.target.health > 0) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const desiredAngle = Math.atan2(dx, -dy);
            let diff = desiredAngle - this.angle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            this.angle += Math.sign(diff) * Math.min(Math.abs(diff), this.turnSpeed);
        } else if (this.homing) {
            // 寻找新目标
            const candidates = this.isEnemyBullet
                ? (isPilotActive && pilot && !pilot.isDead ? [pilot, ...players.filter(p => !p.isDead)] : players.filter(p => !p.isDead))
                : (enemies || []);
            let best = null;
            let bestD = Infinity;
            for (const t of candidates) {
                if (t.isDead || t.health <= 0) continue;
                const d = dist(this.x, this.y, t.x, t.y);
                if (d < bestD) { bestD = d; best = t; }
            }
            this.target = best;
        }

        this.vx += Math.sin(this.angle) * this.acceleration;
        this.vy += -Math.cos(this.angle) * this.acceleration;
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }
        this.x += this.vx;
        this.y += this.vy;

        // 尾焰粒子
        if (Math.random() < 0.7) {
            particles.push(new Particle(
                this.x - this.vx * 0.5,
                this.y - this.vy * 0.5,
                -this.vx * 0.2 + (Math.random() - 0.5) * 1,
                -this.vy * 0.2 + (Math.random() - 0.5) * 1,
                '#ff8844'
            ));
        }

        if (this.x < 0 || this.x > WORLD_WIDTH || this.y < 0 || this.y > WORLD_HEIGHT) {
            this.life = 0;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x - cameraX, this.y - cameraY);
        ctx.rotate(this.angle);

        // 尾焰
        ctx.fillStyle = 'rgba(255, 100, 50, 0.6)';
        ctx.beginPath();
        ctx.moveTo(-this.radius * 1.5, 0);
        ctx.lineTo(-this.radius * 4, -this.radius);
        ctx.lineTo(-this.radius * 4, this.radius);
        ctx.closePath();
        ctx.fill();

        // 弹体
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(-this.radius * 2, -this.radius, this.radius * 4, this.radius * 2);
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(this.radius * 2, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // 弹头
        ctx.fillStyle = '#ff8844';
        ctx.beginPath();
        ctx.moveTo(this.radius * 2, -this.radius * 0.8);
        ctx.lineTo(this.radius * 4, 0);
        ctx.lineTo(this.radius * 2, this.radius * 0.8);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    explode() {
        particles.push(...createSpark(this.x, this.y, '#ff8844', 12, 4));
        for (let i = 0; i < 8; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = 1 + Math.random() * 3;
            particles.push(new Particle(this.x, this.y, Math.cos(a) * s, Math.sin(a) * s, '#ffaa44'));
        }
    }
}

export default Missile;
