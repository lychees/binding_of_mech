import { cameraX, cameraY } from '../config.js';

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
        ctx.arc(this.x - cameraX, this.y - cameraY, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

export default Particle;
