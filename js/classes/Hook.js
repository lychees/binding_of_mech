import { keys, cameraX, cameraY, WORLD_WIDTH, WORLD_HEIGHT } from '../config.js';

// mech 由主模块设置
let mechRef = null;
export function setMechRef(m) { mechRef = m; }

class Hook {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.angle = angle;
        this.speed = 15;
        this.maxLength = 300;
        this.length = 0;
        this.state = 'flying'; // flying, hooked, retracting
        this.life = 120;
        this.hookX = x;
        this.hookY = y;
    }
    
    update(mech) {
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
                // 按空格键钩住地面
                if (keys[' ']) {
                    this.state = 'hooked';
                    this.hookX = this.hookX;
                    this.hookY = this.hookY;
                }
                // 如果飞行距离达到最大长度，自动钩住
                if (this.length >= this.maxLength) {
                    this.state = 'hooked';
                    this.hookX = this.hookX;
                    this.hookY = this.hookY;
                }
            }
        } else if (this.state === 'hooked') {
            // 拉拽机甲向钩爪点，但允许玩家自由移动
            const mech = mechRef;
            if (!mech) return;
            const dx = this.hookX - mech.x;
            const dy = this.hookY - mech.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // 限制最大距离为绳索长度
            const maxRopeLength = this.length;
            if (dist > maxRopeLength) {
                // 将机甲位置限制在绳索长度范围内
                const ratio = maxRopeLength / dist;
                mech.x = this.hookX - dx * ratio;
                mech.y = this.hookY - dy * ratio;
                // 给一点弹性缓冲
                mech.velocityX *= 0.5;
                mech.velocityY *= 0.5;
            }
            
            // 保持轻微拉拽力让绳索绷紧
            if (dist > maxRopeLength * 0.8) {
                const pullSpeed = 2;
                mech.velocityX += (dx / dist) * pullSpeed * 0.1;
                mech.velocityY += (dy / dist) * pullSpeed * 0.1;
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
    
    draw() {
        if (this.state === 'done') return;
        
        const mech = mechRef;
        if (!mech) return;
        
        // 使用当前机甲角度计算枪口位置（实时更新）
        const totalAngle = mech.bodyAngle + mech.upperAngle + mech.weaponAngle;
        const cos = Math.cos(totalAngle);
        const sin = Math.sin(totalAngle);
        
        // 绳索起点始终跟随机甲当前枪口位置
        const muzzleX = mech.x + sin * mech.currentWeapon.barrelLength - cameraX;
        const muzzleY = mech.y - cos * mech.currentWeapon.barrelLength - cameraY;
        
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
