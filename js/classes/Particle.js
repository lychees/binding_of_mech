// 通用粒子系统
import { cameraX, cameraY } from '../config.js?v=2';

class Particle {
    constructor(x, y, vx, vy, color, size = 0, isGas = false) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = isGas ? 18 : 25;
        this.maxLife = isGas ? 18 : 25;
        this.size = size || (2 + Math.random() * 3);
        this.isGas = isGas;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= this.isGas ? 0.92 : 0.95;
        this.vy *= this.isGas ? 0.92 : 0.95;
        this.life--;
        if (this.isGas) this.size += 0.25;
    }

    draw() {
        const opacity = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(this.x - cameraX, this.y - cameraY, Math.max(0.1, this.size), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// 工厂方法：爆炸火花
export function createSpark(x, y, color, count = 6, speed = 4) {
    const list = [];
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const s = Math.random() * speed;
        list.push(new Particle(
            x, y,
            Math.cos(angle) * s,
            Math.sin(angle) * s,
            color
        ));
    }
    return list;
}

// 工厂方法：烟雾
export function createSmoke(x, y, color = '#777777', count = 1, size = 4) {
    const list = [];
    for (let i = 0; i < count; i++) {
        list.push(new Particle(
            x + (Math.random() - 0.5) * 12,
            y + (Math.random() - 0.5) * 12,
            (Math.random() - 0.5) * 0.5,
            -0.3 - Math.random() * 0.5,
            color,
            size + Math.random() * size,
            true
        ));
    }
    return list;
}

// 工厂方法：火焰
export function createFlame(x, y, count = 2) {
    const list = [];
    for (let i = 0; i < count; i++) {
        list.push(new Particle(
            x + (Math.random() - 0.5) * 14,
            y - 10 + (Math.random() - 0.5) * 14,
            (Math.random() - 0.5) * 1,
            -0.5 - Math.random() * 1,
            Math.random() < 0.5 ? '#ff4400' : '#ffaa00'
        ));
    }
    return list;
}

// 工厂方法：喷气/尾焰
export function createJet(x, y, dirX, dirY, color = null) {
    const c = color || `hsl(${180 + Math.random() * 40}, 80%, 60%)`;
    return [new Particle(
        x + (Math.random() - 0.5) * 6,
        y + (Math.random() - 0.5) * 6,
        dirX * 0.5 + (Math.random() - 0.5) * 0.3,
        dirY * 0.5 + (Math.random() - 0.5) * 0.3,
        c,
        2 + Math.random() * 2
    )];
}

// 工厂方法：气体喷射
export function createGas(x, y, dirX, dirY) {
    return [new Particle(
        x, y,
        -dirX * (2 + Math.random() * 4) + (Math.random() - 0.5) * 2,
        -dirY * (2 + Math.random() * 4) + (Math.random() - 0.5) * 2,
        Math.random() < 0.5 ? 'rgba(200,230,255,0.8)' : 'rgba(255,255,255,0.6)',
        2 + Math.random() * 3,
        true
    )];
}

export default Particle;

