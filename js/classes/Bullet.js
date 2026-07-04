import { cameraX, cameraY } from '../config.js?v=2';

class Bullet {
    constructor(x, y, angle, weapon, isEnemyBullet = false) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.weapon = weapon;
        this.speed = weapon.bulletSpeed;
        this.radius = weapon.bulletRadius;
        this.life = weapon.bulletLife;
        this.damage = weapon.damage;
        this.isEnemyBullet = isEnemyBullet;
    }
    
    update() {
        this.x += Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;
        this.life--;
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x - cameraX, this.y - cameraY);
        ctx.rotate(this.angle);
        
        const w = this.weapon;
        
        if (w.drawType === 'cannon') {
            ctx.fillStyle = 'rgba(255, 100, 50, 0.4)';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = w.bulletColor;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 150, 50, 0.6)';
            ctx.fillRect(-this.radius - 8, -this.radius/2, 8, this.radius);
        } else if (w.drawType === 'vulcan') {
            ctx.fillStyle = 'rgba(255, 100, 30, 0.4)';
            ctx.fillRect(-8, -1, 6, 2);
            
            ctx.fillStyle = w.bulletColor;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 200, 100, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = 'rgba(0, 200, 255, 0.4)';
            ctx.fillRect(-12, -2, 10, 4);
            
            ctx.fillStyle = w.bulletColor;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(0, 200, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

export default Bullet;
