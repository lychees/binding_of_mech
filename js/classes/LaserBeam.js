import { cameraX, cameraY, WORLD_WIDTH, WORLD_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../config.js?v=2';

class LaserBeam {
    constructor(x, y, angle, weapon) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.weapon = weapon;
        this.life = weapon.bulletLife;
        this.maxLife = weapon.bulletLife;
        this.damage = weapon.damage;
        this.length = 0;
        this.width = weapon.bulletRadius * 2;
        this.isEnemyBullet = false;
        this.chargeRatio = weapon.chargeRatio || (this.width / 6);

        const screenDiagonal = Math.sqrt(CANVAS_WIDTH ** 2 + CANVAS_HEIGHT ** 2);
        this.maxLength = Math.max(WORLD_WIDTH, WORLD_HEIGHT, screenDiagonal * 1.5);
        this.fadeStart = this.maxLength * 0.3;
        this.fadeEnd = this.maxLength;
    }

    update() {
        this.life--;
        if (this.length < this.maxLength) {
            this.length += this.weapon.bulletSpeed * 4;
        }
    }

    getDamageAtDistance(distance) {
        if (distance <= this.fadeStart) return this.damage;
        if (distance >= this.fadeEnd) return this.damage * 0.25;
        const t = (distance - this.fadeStart) / (this.fadeEnd - this.fadeStart);
        return this.damage * (1 - t * 0.75);
    }

    draw() {
        const opacity = this.life / this.maxLife;
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        const endX = this.x + sin * this.length;
        const endY = this.y - cos * this.length;

        const outerGlow = this.width * (2.5 + this.chargeRatio * 2);
        const coreWidth = this.width * (0.4 + this.chargeRatio * 0.3);

        ctx.strokeStyle = `rgba(255, 100, 180, ${opacity * 0.25})`;
        ctx.lineWidth = outerGlow;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x - cameraX, this.y - cameraY);
        ctx.lineTo(endX - cameraX, endY - cameraY);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 68, 170, ${opacity * 0.55})`;
        ctx.lineWidth = this.width + 2;
        ctx.beginPath();
        ctx.moveTo(this.x - cameraX, this.y - cameraY);
        ctx.lineTo(endX - cameraX, endY - cameraY);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 220, 245, ${opacity})`;
        ctx.lineWidth = coreWidth;
        ctx.beginPath();
        ctx.moveTo(this.x - cameraX, this.y - cameraY);
        ctx.lineTo(endX - cameraX, endY - cameraY);
        ctx.stroke();

        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(endX - cameraX, endY - cameraY, this.width * 0.8, 0, Math.PI * 2);
        ctx.fill();

        if (this.chargeRatio >= 1) {
            ctx.strokeStyle = `rgba(255, 200, 230, ${opacity * 0.4})`;
            ctx.lineWidth = this.width * 4;
            ctx.beginPath();
            ctx.moveTo(this.x - cameraX, this.y - cameraY);
            ctx.lineTo(endX - cameraX, endY - cameraY);
            ctx.stroke();
        }
    }
}

export default LaserBeam;
