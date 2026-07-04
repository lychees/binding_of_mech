import { keys, obstacles, cameraX, cameraY, WORLD_WIDTH, WORLD_HEIGHT, particles } from '../config.js';
import { playHookSound, playHookHitSound, playHookBoostSound } from '../audio.js';
import Particle from './Particle.js';

// mech 由主模块设置
let mechRef = null;
export function setMechRef(m) { mechRef = m; }

class Hook {
    constructor(x, y, angle, owner) {
        playHookSound();
        this.owner = owner;
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.angle = angle;
        this.speed = 60;
        this.maxLength = 300;
        this.length = 0;
        this.state = 'flying'; // flying, hooked, retracting
        this.life = 120;
        this.hookX = x;
        this.hookY = y;
        this.hitSoundPlayed = false;
        this.boostTimer = 0;
        this.justHooked = false;
    }
    
    update(mech) {
        const owner = this.owner || mech;
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        
        if (this.state === 'flying') {
            this.length += this.speed;
            this.hookX = this.startX + sin * this.length;
            this.hookY = this.startY - cos * this.length;
            
            // 边界检测
            if (this.hookX < 0 || this.hookX > WORLD_WIDTH ||
                this.hookY < 0 || this.hookY > WORLD_HEIGHT) {
                this.state = 'retracting';
            }
            
            // 障碍物碰撞检测
            for (let i = 0; i < obstacles.length; i++) {
                const obs = obstacles[i];
                if (this.hookX >= obs.x && this.hookX <= obs.x + obs.width &&
                    this.hookY >= obs.y && this.hookY <= obs.y + obs.height) {
                    this.state = 'hooked';
                    this.hookX = this.hookX;
                    this.hookY = this.hookY;
                    break;
                }
            }
            
            // 地面碰撞检测（任何位置都可以钩住）
            if (this.state === 'flying') {
                // 如果飞行距离达到最大长度，自动钩住
                if (this.length >= this.maxLength) {
                    this.state = 'hooked';
                    this.hookX = this.hookX;
                    this.hookY = this.hookY;
                }
            }
        } else if (this.state === 'hooked') {
            if (!this.justHooked) {
                this.justHooked = true;
                if (!this.hitSoundPlayed) {
                    playHookHitSound();
                    this.hitSoundPlayed = true;
                }
            }
            // 拉拽机甲向钩爪点，但允许玩家自由移动
            if (!owner) return;
            const dx = this.hookX - owner.x;
            const dy = this.hookY - owner.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // 限制最大距离为绳索长度
            const maxRopeLength = this.length;
            if (dist > maxRopeLength) {
                // 将机甲位置限制在绳索长度范围内
                const ratio = maxRopeLength / dist;
                owner.x = this.hookX - dx * ratio;
                owner.y = this.hookY - dy * ratio;
                // 给一点弹性缓冲
                owner.velocityX *= 0.5;
                owner.velocityY *= 0.5;
            }
            
            // 保持拉拽力让绳索绷紧
            if (dist > maxRopeLength * 0.4) {
                const pullSpeed = 35;
                owner.velocityX += (dx / dist) * pullSpeed * 0.5;
                owner.velocityY += (dy / dist) * pullSpeed * 0.5;
                
                // 立体机动：被拉拽时持续播放压缩空气喷射
                this.spawnGasParticles(owner, dx, dy, dist);
                this.boostTimer--;
                if (this.boostTimer <= 0) {
                    playHookBoostSound();
                    this.boostTimer = 12; // 每 12 帧播放一次
                }
            } else {
                this.boostTimer = 0;
            }
        } else if (this.state === 'retracting') {
            this.length -= this.speed * 1.5;
            if (this.length <= 0) {
                this.life = 0;
            }
        }
        
        if (this.life <= 0) {
            this.state = 'done';
        }
    }
    
    spawnGasParticles(mech, dx, dy, dist) {
        // 计算绳索方向
        const nx = dx / dist;
        const ny = dy / dist;
        
        // 在机甲背部两侧喷射压缩空气
        const totalAngle = mech.bodyAngle;
        const cos = Math.cos(totalAngle);
        const sin = Math.sin(totalAngle);
        
        // 背部左右两个喷射口（相对机体）
        const nozzles = [
            { ox: -12, oy: -10 },
            { ox: 12, oy: -10 },
            { ox: 0, oy: -16 }
        ];
        
        for (const n of nozzles) {
            // 将局部偏移旋转到世界坐标
            const wx = mech.x + (n.ox * cos - n.oy * sin);
            const wy = mech.y + (n.ox * sin + n.oy * cos);
            
            // 喷射方向大致与拉拽方向相反（向斜后方喷出）
            for (let k = 0; k < 3; k++) {
                const spreadAngle = (Math.random() - 0.5) * 0.8;
                const cosS = Math.cos(spreadAngle);
                const sinS = Math.sin(spreadAngle);
                // 喷射方向为拉拽反方向加上随机散布
                const pvx = (-nx * cosS - -ny * sinS) * (2 + Math.random() * 3);
                const pvy = (-nx * sinS + -ny * cosS) * (2 + Math.random() * 3);
                
                const speed = 2 + Math.random() * 4;
                const pvx2 = -nx * speed + (Math.random() - 0.5) * 2;
                const pvy2 = -ny * speed + (Math.random() - 0.5) * 2;
                
                particles.push(new Particle(
                    wx, wy,
                    pvx2, pvy2,
                    Math.random() < 0.5 ? 'rgba(200,230,255,0.8)' : 'rgba(255,255,255,0.6)',
                    2 + Math.random() * 3,
                    true
                ));
            }
        }
    }
    
    draw() {
        if (this.state === 'done') return;
        
        const owner = this.owner || mechRef;
        if (!owner) return;
        
        // 使用当前机甲角度计算枪口位置（实时更新）
        const totalAngle = owner.bodyAngle + owner.upperAngle + owner.weaponAngle;
        const cos = Math.cos(totalAngle);
        const sin = Math.sin(totalAngle);
        
        // 绳索起点始终跟随机甲当前枪口位置
        const muzzleX = owner.x + sin * owner.currentWeapon.barrelLength - cameraX;
        const muzzleY = owner.y - cos * owner.currentWeapon.barrelLength - cameraY;
        
        // 计算当前钩爪位置（固定在世界坐标）
        const currentHookX = this.hookX - cameraX;
        const currentHookY = this.hookY - cameraY;
        
        // 绳索
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(muzzleX, muzzleY);
        ctx.lineTo(currentHookX, currentHookY);
        ctx.stroke();
        
        // 绳索高光
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(muzzleX, muzzleY);
        ctx.lineTo(currentHookX, currentHookY);
        ctx.stroke();
        
        // 钩爪头
        ctx.save();
        ctx.translate(currentHookX - cameraX, currentHookY - cameraY);
        ctx.rotate(this.angle);
        
        // 钩爪主体
        ctx.fillStyle = '#aaa';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // 钩爪尖
        ctx.fillStyle = '#ccc';
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(-4, 0);
        ctx.lineTo(4, 0);
        ctx.closePath();
        ctx.fill();
        
        // 发光效果
        if (this.state === 'flying') {
            ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.state === 'hooked') {
            ctx.fillStyle = 'rgba(0, 255, 100, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

export default Hook;
