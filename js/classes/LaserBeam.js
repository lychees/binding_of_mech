import { cameraX, cameraY } from '../config.js?v=2';

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
        this.maxLength = 200;
        this.width = weapon.bulletRadius * 2;
    }
    
    update() {
        this.life--;
        if (this.length < this.maxLength) {
            this.length += this.weapon.bulletSpeed * 3;
        }
    }
    
    draw() {
        const opacity = this.life / this.maxLife;
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        
        // 光束外发光
        ctx.strokeStyle = 'rgba(255, 100, 180, ' + (opacity * 0.3) + ')';
        ctx.lineWidth = this.width + 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x - cameraX, this.y - cameraY);
        ctx.lineTo(this.x + sin * this.length - cameraX, this.y - cos * this.length - cameraY);
        ctx.stroke();
        
        // 光束主体
        ctx.strokeStyle = 'rgba(255, 68, 170, ' + (opacity * 0.6) + ')';
        ctx.lineWidth = this.width + 2;
        ctx.beginPath();
        ctx.moveTo(this.x - cameraX, this.y - cameraY);
        ctx.lineTo(this.x + sin * this.length - cameraX, this.y - cos * this.length - cameraY);
        ctx.stroke();
        
        // 光束核心
        ctx.strokeStyle = 'rgba(255, 200, 230, ' + opacity + ')';
        ctx.lineWidth = this.width * 0.5;
        ctx.beginPath();
        ctx.moveTo(this.x - cameraX, this.y - cameraY);
        ctx.lineTo(this.x + sin * this.length - cameraX, this.y - cos * this.length - cameraY);
        ctx.stroke();
        
        // 端点发光
        ctx.fillStyle = 'rgba(255, 255, 255, ' + opacity + ')';
        ctx.beginPath();
        ctx.arc(this.x + sin * this.length - cameraX, this.y - cos * this.length - cameraY, this.width, 0, Math.PI * 2);
        ctx.fill();
    }
}

export default LaserBeam;
