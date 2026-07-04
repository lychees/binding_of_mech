import { keys, particles, footprints, bullets, hooks, obstacles, cameraX, cameraY, WORLD_WIDTH, WORLD_HEIGHT } from '../config.js';
import { playShootSound } from '../audio.js';
import { WEAPONS } from '../weapons.js';
import Bullet from './Bullet.js';
import LaserBeam from './LaserBeam.js';
import Particle from './Particle.js';
import Hook from './Hook.js';

class Mech {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.bodyAngle = 0;
        this.upperAngle = 0;
        this.weaponAngle = 0;
        
        this.velocityX = 0;
        this.velocityY = 0;
        this.maxSpeed = 2.5;
        this.acceleration = 0.12;
        this.deceleration = 0.04;
        
        this.turnVelocity = 0;
        this.maxTurnSpeed = 0.08;
        this.turnDeceleration = 0.15;
        
        this.upperTurnVelocity = 0;
        this.maxUpperTurnSpeed = 0.08;
        this.upperTurnDeceleration = 0.12;
        
        this.weaponTurnVelocity = 0;
        this.maxWeaponTurnSpeed = 0.035;
        this.weaponTurnDeceleration = 0.02;
        
        this.walkCycle = 0;
        this.walkSpeed = 0.15;
        
        this.legWidth = 8;
        this.legLength = 35;
        this.bodyWidth = 30;
        this.bodyHeight = 25;
        this.upperWidth = 25;
        this.upperHeight = 20;
        
        this.jetParticles = [];
        
        this.currentWeapon = WEAPONS.VULCAN;
        this.fireCooldown = 0;
        this.weaponKeys = ['1', '2', '3', '4', '5'];
        this.weaponList = [WEAPONS.VULCAN, WEAPONS.SHOTGUN, WEAPONS.CANNON, WEAPONS.LASER, WEAPONS.BEAM_SWORD];
        
        // 生命系统
        this.health = 100;
        this.maxHealth = 100;
        this.armor = 0; // 减伤比例 0-1
        this.isDead = false;
        
        // 着火状态
        this.isBurning = false;
        this.burnTimer = 0;
        this.burnDamageTimer = 0;
        this.burnChance = 0.15; // 被击中时着火概率
        
        // 碰撞体积
        this.collisionRadius = 25;
        this.collisionDamageMultiplier = 0.8;
        this.lastCollisionTime = 0;
        this.collisionCooldown = 15; // 帧
        
        // 冒烟效果
        this.smokeTimer = 0;
        this.heatLevel = 0;
        this.isOverheated = false;
        this.overheatTimer = 0;
        
        // 近战攻击状态
        this.isSwinging = false;
        this.swingProgress = 0;
        this.swingDirection = 1;
        
        // 冲刺系统
        this.isDashing = false;
        this.dashCooldown = 0;
        this.dashDuration = 0;
        this.dashDirectionX = 0;
        this.dashDirectionY = 0;
        this.dashSpeed = 12;
        this.dashMaxCooldown = 60;
        this.dashMaxDuration = 10;
    }
    
    update() {
        // 武器切换
        for (let i = 0; i < this.weaponKeys.length; i++) {
            if (keys[this.weaponKeys[i]]) {
                this.currentWeapon = this.weaponList[i];
                keys[this.weaponKeys[i]] = false;
                this.isSwinging = false;
                break;
            }
        }
        
        // 射击冷却
        if (this.fireCooldown > 0) {
            this.fireCooldown--;
        }
        
        // 火神炮温度管理
        if (this.currentWeapon.drawType === 'vulcan') {
            if (this.isOverheated) {
                this.overheatTimer--;
                this.heatLevel = (this.overheatTimer / this.currentWeapon.overheatCooldown) * this.currentWeapon.overheatThreshold;
                if (this.overheatTimer <= 0) {
                    this.isOverheated = false;
                    this.heatLevel = 0;
                }
            } else {
                // 不射击时温度下降
                if (!keys[' ']) {
                    this.heatLevel = Math.max(0, this.heatLevel - this.currentWeapon.heatDecay);
                }
            }
        }
        
        // 近战攻击动画
        if (this.isSwinging) {
            this.swingProgress += this.swingDirection * this.currentWeapon.swingSpeed;
            if (this.swingProgress >= this.currentWeapon.swingRange / 2) {
                this.swingDirection = -1;
            }
            if (this.swingProgress <= -this.currentWeapon.swingRange / 2) {
                this.isSwinging = false;
                this.swingProgress = 0;
                this.swingDirection = 1;
            }
        }
        
        // 冲刺系统
        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.isDashing) {
            this.dashDuration--;
            this.velocityX = this.dashDirectionX * this.dashSpeed;
            this.velocityY = this.dashDirectionY * this.dashSpeed;
            
            // 冲刺残影特效
            for (let k = 0; k < 5; k++) {
                const offset = (k - 2) * 8;
                particles.push({
                    x: this.x - this.dashDirectionX * offset + (Math.random() - 0.5) * 6,
                    y: this.y - this.dashDirectionY * offset + (Math.random() - 0.5) * 6,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    life: 15 + Math.random() * 10,
                    maxLife: 25,
                    color: '#00d4ff',
                    size: 4 + Math.random() * 4,
                    update: function() {
                        this.x += this.vx;
                        this.y += this.vy;
                        this.vx *= 0.95;
                        this.vy *= 0.95;
                        this.life--;
                    },
                    draw: function() {
                        const opacity = Math.max(0, this.life / this.maxLife);
                        ctx.fillStyle = this.color;
                        ctx.globalAlpha = opacity * 0.6;
                        ctx.beginPath();
                        const radius = Math.max(0.1, this.size * opacity);
                        ctx.arc(this.x - cameraX, this.y - cameraY, radius, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.globalAlpha = 1;
                    }
                });
            }
            
            // 冲刺光晕
            ctx.fillStyle = 'rgba(0, 212, 255, 0.15)';
            ctx.beginPath();
            ctx.arc(this.x - cameraX, this.y - cameraY, 40, 0, Math.PI * 2);
            ctx.fill();
            
            if (this.dashDuration <= 0) {
                this.isDashing = false;
                this.velocityX *= 0.5;
                this.velocityY *= 0.5;
            }
        }
        
        // 移动
        let moveForward = 0;
        if (keys['w'] || keys['W']) moveForward = 1;
        else if (keys['s'] || keys['S']) moveForward = -1;
        
        let moveSide = 0;
        if (keys['a'] || keys['A']) moveSide = -1;
        else if (keys['d'] || keys['D']) moveSide = 1;
        
        // 碰撞冷却递减
        if (this.lastCollisionTime > 0) this.lastCollisionTime--;
        
        // 检测冲刺输入（Shift + 方向键）
        if (keys['Shift'] && !this.isDashing && this.dashCooldown <= 0) {
            let dashX = 0;
            let dashY = 0;
            if (keys['w'] || keys['W']) dashY = -1;
            if (keys['s'] || keys['S']) dashY = 1;
            if (keys['a'] || keys['A']) dashX = -1;
            if (keys['d'] || keys['D']) dashX = 1;
            
            if (dashX !== 0 || dashY !== 0) {
                this.isDashing = true;
                this.dashDuration = this.dashMaxDuration;
                this.dashCooldown = this.dashMaxCooldown;
                // 归一化方向
                const len = Math.sqrt(dashX * dashX + dashY * dashY);
                this.dashDirectionX = dashX / len;
                this.dashDirectionY = dashY / len;
            }
        }
        
        const cos = Math.cos(this.bodyAngle);
        const sin = Math.sin(this.bodyAngle);
        
        // 被钩爪拉拽时提升移动速度上限
        const isHooked = hooks.some(h => h.state === 'hooked');
        const effectiveMaxSpeed = isHooked ? this.maxSpeed * 2.5 : this.maxSpeed;
        
        const targetVX = (sin) * moveForward * effectiveMaxSpeed + cos * moveSide * effectiveMaxSpeed * 0.7;
        const targetVY = (-cos) * moveForward * effectiveMaxSpeed + sin * moveSide * effectiveMaxSpeed * 0.7;
        
        if (!this.isDashing) {
            if (moveForward !== 0 || moveSide !== 0) {
                this.velocityX += (targetVX - this.velocityX) * this.acceleration;
                this.velocityY += (targetVY - this.velocityY) * this.acceleration;
            } else {
                this.velocityX *= (1 - this.deceleration);
                this.velocityY *= (1 - this.deceleration);
                if (Math.abs(this.velocityX) < 0.01) this.velocityX = 0;
                if (Math.abs(this.velocityY) < 0.01) this.velocityY = 0;
            }
        }
        
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.x = Math.max(30, Math.min(WORLD_WIDTH - 30, this.x));
        this.y = Math.max(30, Math.min(WORLD_HEIGHT - 30, this.y));
        
        // 障碍物碰撞检测（玩家）
        for (let i = 0; i < obstacles.length; i++) {
            const obs = obstacles[i];
            if (this.x + this.bodyWidth/2 > obs.x && this.x - this.bodyWidth/2 < obs.x + obs.width &&
                this.y + this.bodyHeight/2 > obs.y && this.y - this.bodyHeight/2 < obs.y + obs.height) {
                // 简单推开
                const centerX = obs.x + obs.width/2;
                const centerY = obs.y + obs.height/2;
                const dx = this.x - centerX;
                const dy = this.y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    this.x += (dx / dist) * 3;
                    this.y += (dy / dist) * 3;
                }
            }
        }
        
        // 转向
        let targetTurn = 0;
        if (keys['e'] || keys['E']) targetTurn = this.maxTurnSpeed;
        else if (keys['q'] || keys['Q']) targetTurn = -this.maxTurnSpeed;
        
        if (targetTurn !== 0) {
            this.turnVelocity += (targetTurn - this.turnVelocity) * 0.15;
        } else {
            this.turnVelocity *= (1 - this.turnDeceleration);
            if (Math.abs(this.turnVelocity) < 0.001) this.turnVelocity = 0;
        }
        this.bodyAngle += this.turnVelocity;
        
        let targetUpperTurn = 0;
        if (keys['ArrowLeft']) targetUpperTurn = -this.maxUpperTurnSpeed;
        else if (keys['ArrowRight']) targetUpperTurn = this.maxUpperTurnSpeed;
        
        if (targetUpperTurn !== 0) {
            this.upperTurnVelocity += (targetUpperTurn - this.upperTurnVelocity) * 0.12;
        } else {
            this.upperTurnVelocity *= (1 - this.upperTurnDeceleration);
            if (Math.abs(this.upperTurnVelocity) < 0.001) this.upperTurnVelocity = 0;
        }
        this.upperAngle += this.upperTurnVelocity;
        
        const maxUpperAngle = Math.PI * 0.8;
        this.upperAngle = Math.max(-maxUpperAngle, Math.min(maxUpperAngle, this.upperAngle));
        
        let targetWeaponTurn = 0;
        if (keys['Shift'] && keys['ArrowLeft']) targetWeaponTurn = -this.maxWeaponTurnSpeed;
        else if (keys['Shift'] && keys['ArrowRight']) targetWeaponTurn = this.maxWeaponTurnSpeed;
        
        if (targetWeaponTurn !== 0) {
            this.weaponTurnVelocity += (targetWeaponTurn - this.weaponTurnVelocity) * 0.1;
        } else {
            this.weaponTurnVelocity *= (1 - this.weaponTurnDeceleration);
            if (Math.abs(this.weaponTurnVelocity) < 0.001) this.weaponTurnVelocity = 0;
        }
        this.weaponAngle += this.weaponTurnVelocity;
        
        // 行走动画
        const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        if (speed > 0.1) {
            this.walkCycle += this.walkSpeed * (speed / this.maxSpeed);
        }
        
        if (speed > 0.5 && Math.sin(this.walkCycle) > 0.9) {
            this.addFootprint();
        }
        
        for (let i = footprints.length - 1; i >= 0; i--) {
            footprints[i].opacity -= 0.005;
            if (footprints[i].opacity <= 0) {
                footprints.splice(i, 1);
            }
        }
        
        if (speed > 1 || Math.abs(this.turnVelocity) > 0.01) {
            this.addJetParticle();
        }
        
        for (let i = this.jetParticles.length - 1; i >= 0; i--) {
            this.jetParticles[i].update();
            if (this.jetParticles[i].life <= 0) {
                this.jetParticles.splice(i, 1);
            }
        }
        
        // 着火持续掉血
        if (this.isBurning) {
            this.burnTimer--;
            this.burnDamageTimer--;
            if (this.burnDamageTimer <= 0) {
                this.burnDamageTimer = 30; // 每0.5秒（30帧）掉一次血
                this.health -= 2;
                if (this.health <= 0) {
                    this.health = 0;
                    this.isDead = true;
                }
            }
            if (this.burnTimer <= 0) {
                this.isBurning = false;
            }
            // 着火火焰粒子
            if (Math.random() < 0.4) {
                particles.push(new Particle(
                    this.x + (Math.random() - 0.5) * 20,
                    this.y - 10 + (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 1,
                    -0.5 - Math.random() * 1,
                    Math.random() < 0.5 ? '#ff4400' : '#ffaa00'
                ));
            }
        }
        
        // 受损冒烟（黄血或红血）
        const healthRatio = this.health / this.maxHealth;
        if (healthRatio < 0.6 && healthRatio > 0) {
            this.smokeTimer--;
            const smokeThreshold = healthRatio < 0.3 ? 3 : 8;
            if (this.smokeTimer <= 0) {
                this.smokeTimer = smokeThreshold;
                particles.push({
                    x: this.x + (Math.random() - 0.5) * 20,
                    y: this.y - 5 + (Math.random() - 0.5) * 10,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: -0.3 - Math.random() * 0.5,
                    life: 40 + Math.random() * 20,
                    maxLife: 60,
                    color: healthRatio < 0.3 ? '#555555' : '#777777',
                    size: 4 + Math.random() * 4,
                    update: function() {
                        this.x += this.vx;
                        this.y += this.vy;
                        this.vx *= 0.98;
                        this.vy *= 0.98;
                        this.size += 0.1;
                        this.life--;
                    },
                    draw: function() {
                        const opacity = Math.max(0, this.life / this.maxLife);
                        ctx.fillStyle = this.color;
                        ctx.globalAlpha = opacity * 0.4;
                        ctx.beginPath();
                        ctx.arc(this.x - cameraX, this.y - cameraY, this.size, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.globalAlpha = 1;
                    }
                });
            }
        }
    }
    
    addFootprint() {
        const cos = Math.cos(this.bodyAngle);
        const sin = Math.sin(this.bodyAngle);
        const offset = 12;
        
        footprints.push({
            x: this.x + cos * this.legLength * 0.6 + (Math.sin(this.walkCycle) > 0 ? -sin * offset : sin * offset),
            y: this.y + sin * this.legLength * 0.6 + (Math.sin(this.walkCycle) > 0 ? cos * offset : -cos * offset),
            angle: this.bodyAngle,
            opacity: 0.3
        });
    }
    
    addJetParticle() {
        const cos = Math.cos(this.bodyAngle);
        const sin = Math.sin(this.bodyAngle);
        
        this.jetParticles.push({
            x: this.x - cos * 15 + (Math.random() - 0.5) * 10,
            y: this.y - sin * 15 + (Math.random() - 0.5) * 10,
            vx: -cos * 0.5 + (Math.random() - 0.5) * 0.3,
            vy: -sin * 0.5 + (Math.random() - 0.5) * 0.3,
            life: 20,
            maxLife: 20,
            color: 'hsl(' + (180 + Math.random() * 40) + ', 80%, 60%)',
            update: function() {
                this.x += this.vx;
                this.y += this.vy;
                this.vx *= 0.95;
                this.vy *= 0.95;
                this.life--;
            }
        });
    }
    
    draw() {
        for (let i = 0; i < footprints.length; i++) {
            const fp = footprints[i];
            ctx.save();
            ctx.translate(fp.x, fp.y);
            ctx.rotate(fp.angle);
            ctx.fillStyle = 'rgba(80, 80, 80, ' + fp.opacity + ')';
            ctx.fillRect(-4, -6, 8, 12);
            ctx.restore();
        }
        
        for (let i = 0; i < this.jetParticles.length; i++) {
            const p = this.jetParticles[i];
            const opacity = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = opacity * 0.6;
            ctx.beginPath();
            ctx.arc(p.x - cameraX, p.y - cameraY, 2 * opacity, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        
        ctx.save();
        ctx.translate(this.x - cameraX, this.y - cameraY);
        
        const leftLegOffset = Math.sin(this.walkCycle) * 8;
        const rightLegOffset = Math.sin(this.walkCycle + Math.PI) * 8;
        const leftKnee = Math.sin(this.walkCycle + Math.PI * 0.5) * 5;
        const rightKnee = Math.sin(this.walkCycle + Math.PI * 1.5) * 5;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 25, 25, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.save();
        ctx.rotate(this.bodyAngle);
        this.drawLeg(-12, leftLegOffset, leftKnee, true);
        ctx.restore();
        
        ctx.save();
        ctx.rotate(this.bodyAngle);
        this.drawLeg(12, rightLegOffset, rightKnee, false);
        ctx.restore();
        
        ctx.save();
        ctx.rotate(this.bodyAngle);
        
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(-this.bodyWidth/2, -this.bodyHeight/2, this.bodyWidth, this.bodyHeight);
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(-this.bodyWidth/2 + 3, -this.bodyHeight/2 + 3, this.bodyWidth - 6, this.bodyHeight - 6);
        ctx.strokeStyle = '#5a6578';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-10, -8);
        ctx.lineTo(10, -8);
        ctx.moveTo(-10, 0);
        ctx.lineTo(10, 0);
        ctx.moveTo(-10, 8);
        ctx.lineTo(10, 8);
        ctx.stroke();
        ctx.restore();
        
        ctx.save();
        ctx.rotate(this.bodyAngle + this.upperAngle);
        
        ctx.fillStyle = '#5a6a7d';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#5a7a9a';
        ctx.fillRect(-this.upperWidth/2, -this.upperHeight/2 - 5, this.upperWidth, this.upperHeight);
        
        ctx.fillStyle = '#7a9aba';
        ctx.beginPath();
        ctx.arc(0, -5, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#a0d0f0';
        ctx.beginPath();
        ctx.arc(0, -5, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#4a6a8a';
        ctx.fillRect(-this.upperWidth/2 - 3, -this.upperHeight/2 - 3, 6, 12);
        ctx.fillRect(this.upperWidth/2 - 3, -this.upperHeight/2 - 3, 6, 12);
        
        ctx.save();
        ctx.rotate(this.weaponAngle);
        this.drawWeapon();
        ctx.restore();
        
        ctx.restore();
        ctx.restore();
    }
    
    drawWeapon() {
        const w = this.currentWeapon;
        
        ctx.fillStyle = w.color;
        ctx.beginPath();
        ctx.arc(0, -5, 6, 0, Math.PI * 2);
        ctx.fill();
        
        switch (w.drawType) {
            case 'vulcan':
                ctx.fillStyle = w.color;
                ctx.fillRect(-w.barrelWidth/2, -w.barrelLength, w.barrelWidth, w.barrelLength);
                ctx.fillStyle = w.muzzleColor;
                ctx.fillRect(-w.barrelWidth/2 - 1, -w.barrelLength, w.barrelWidth + 2, 4);
                ctx.fillStyle = '#aa5a3a';
                ctx.fillRect(-1, -w.barrelLength + 2, 2, w.barrelLength - 4);
                // 散热片
                ctx.fillStyle = '#8a4a2a';
                for (let i = 0; i < 4; i++) {
                    ctx.fillRect(-w.barrelWidth/2 - 2, -w.barrelLength + 5 + i * 5, w.barrelWidth + 4, 2);
                }
                // 温度指示条
                if (this.heatLevel > 0) {
                    const heatRatio = this.heatLevel / w.overheatThreshold;
                    ctx.fillStyle = '#333';
                    ctx.fillRect(-w.barrelWidth/2 - 8, -w.barrelLength, 5, w.barrelLength);
                    ctx.fillStyle = 'rgba(255, ' + Math.floor(255 - heatRatio * 255) + ', 0, 0.9)';
                    ctx.fillRect(-w.barrelWidth/2 - 8, -w.barrelLength + w.barrelLength * (1 - heatRatio), 5, w.barrelLength * heatRatio);
                }
                break;
                
            case 'shotgun':
                ctx.fillStyle = w.color;
                ctx.fillRect(-w.barrelWidth/2, -w.barrelLength, w.barrelWidth, w.barrelLength);
                ctx.fillStyle = w.muzzleColor;
                ctx.fillRect(-4, -w.barrelLength, 3, w.barrelLength - 2);
                ctx.fillRect(1, -w.barrelLength, 3, w.barrelLength - 2);
                ctx.fillStyle = '#6a5a4a';
                for (let i = 0; i < 3; i++) {
                    ctx.fillRect(-6, -w.barrelLength + 5 + i * 6, 12, 2);
                }
                break;
                
            case 'cannon':
                ctx.fillStyle = w.color;
                ctx.fillRect(-w.barrelWidth/2, -w.barrelLength, w.barrelWidth, w.barrelLength);
                ctx.fillStyle = w.muzzleColor;
                ctx.fillRect(-w.barrelWidth/2 - 2, -w.barrelLength - 3, w.barrelWidth + 4, 6);
                ctx.fillStyle = '#5a6a5a';
                ctx.fillRect(-3, -10, 6, 8);
                ctx.fillRect(-8, -8, 16, 3);
                ctx.fillStyle = '#8a9a8a';
                ctx.fillRect(-2, -w.barrelLength + 3, 4, w.barrelLength - 6);
                break;
                
            case 'laser':
                ctx.fillStyle = w.color;
                ctx.fillRect(-w.barrelWidth/2, -w.barrelLength, w.barrelWidth, w.barrelLength);
                ctx.fillStyle = '#ff88cc';
                ctx.beginPath();
                ctx.arc(0, -w.barrelLength/2, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ff44aa';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, -w.barrelLength/2, 5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillStyle = 'rgba(255, 100, 180, 0.3)';
                ctx.beginPath();
                ctx.arc(0, -w.barrelLength/2, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ff66aa';
                ctx.fillRect(-w.barrelWidth/2 - 1, -w.barrelLength - 2, w.barrelWidth + 2, 3);
                break;
                
            case 'beamSword':
                // 光束军刀
                const bladeLength = w.barrelLength;
                const swingOffset = this.isSwinging ? this.swingProgress : 0;
                
                ctx.save();
                ctx.rotate(swingOffset);
                
                // 刀柄
                ctx.fillStyle = '#4a5a6a';
                ctx.fillRect(-3, -8, 6, 10);
                ctx.fillStyle = '#6a7a8a';
                ctx.fillRect(-2, -6, 4, 6);
                
                // 光束刀刃
                ctx.fillStyle = 'rgba(0, 255, 136, 0.3)';
                ctx.beginPath();
                ctx.moveTo(-6, -8);
                ctx.lineTo(0, -8 - bladeLength);
                ctx.lineTo(6, -8);
                ctx.closePath();
                ctx.fill();
                
                ctx.fillStyle = 'rgba(0, 255, 200, 0.6)';
                ctx.beginPath();
                ctx.moveTo(-3, -8);
                ctx.lineTo(0, -8 - bladeLength * 0.9);
                ctx.lineTo(3, -8);
                ctx.closePath();
                ctx.fill();
                
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(-1, -8);
                ctx.lineTo(0, -8 - bladeLength * 0.8);
                ctx.lineTo(1, -8);
                ctx.closePath();
                ctx.fill();
                
                // 挥舞轨迹
                if (this.isSwinging) {
                    ctx.fillStyle = 'rgba(0, 255, 136, 0.15)';
                    ctx.beginPath();
                    ctx.arc(0, -8, bladeLength, -this.currentWeapon.swingRange/2 - Math.PI/2, this.currentWeapon.swingRange/2 - Math.PI/2);
                    ctx.closePath();
                    ctx.fill();
                }
                
                ctx.restore();
                break;
        }
    }
    
    takeHit(damage) {
        let actualDamage = damage * (1 - this.armor);
        this.health -= actualDamage;
        
        // 着火判定
        if (Math.random() < this.burnChance) {
            this.isBurning = true;
            this.burnTimer = 180; // 3秒
            this.burnDamageTimer = 30;
        }
        
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
        }
    }
    
    resolveCollision(other) {
        if (this.isDead || other.isDead) return;
        
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = this.collisionRadius + other.collisionRadius;
        
        if (dist < minDist && dist > 0) {
            // 分离
            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;
            this.x -= nx * overlap * 0.5;
            this.y -= ny * overlap * 0.5;
            other.x += nx * overlap * 0.5;
            other.y += ny * overlap * 0.5;
            
            // 相对速度
            const rvx = other.velocityX - this.velocityX;
            const rvy = other.velocityY - this.velocityY;
            const velAlongNormal = rvx * nx + rvy * ny;
            
            if (velAlongNormal < 0) {
                // 碰撞冷却
                if (this.lastCollisionTime > 0 || other.lastCollisionTime > 0) return;
                
                // 反弹
                const restitution = 0.5;
                const impulse = -(1 + restitution) * velAlongNormal / 2;
                this.velocityX -= impulse * nx;
                this.velocityY -= impulse * ny;
                other.velocityX += impulse * nx;
                other.velocityY += impulse * ny;
                
                // 碰撞伤害 = 相对速度 * 伤害系数
                const relativeSpeed = Math.abs(velAlongNormal);
                const damage = relativeSpeed * this.collisionDamageMultiplier;
                if (damage >= 1) {
                    this.takeHit(damage * 0.5);
                    other.takeHit(damage * 0.5);
                    this.lastCollisionTime = this.collisionCooldown;
                    other.lastCollisionTime = other.collisionCooldown;
                    
                    // 碰撞火花
                    for (let i = 0; i < 6; i++) {
                        particles.push(new Particle(
                            this.x + nx * this.collisionRadius + (Math.random() - 0.5) * 10,
                            this.y + ny * this.collisionRadius + (Math.random() - 0.5) * 10,
                            (Math.random() - 0.5) * 4,
                            (Math.random() - 0.5) * 4,
                            '#ffcc00'
                        ));
                    }
                }
            }
        }
    }
    
    drawLeg(xOffset, footOffset, kneeOffset, isLeft) {
        ctx.strokeStyle = '#4a5568';
        ctx.lineWidth = this.legWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(xOffset, 0);
        ctx.lineTo(xOffset + kneeOffset * 0.3, this.legLength * 0.5);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(xOffset + kneeOffset * 0.3, this.legLength * 0.5);
        ctx.lineTo(xOffset + footOffset * 0.2, this.legLength + footOffset * 0.1);
        ctx.stroke();
        
        ctx.fillStyle = '#5a6a7d';
        ctx.beginPath();
        ctx.arc(xOffset, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(xOffset + kneeOffset * 0.3, this.legLength * 0.5, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#3a4558';
        ctx.save();
        ctx.translate(xOffset + footOffset * 0.2, this.legLength + footOffset * 0.1);
        ctx.fillRect(-6, -2, 12, 6);
        ctx.restore();
    }
    
    shoot() {
        if (this.fireCooldown > 0) return;
        
        const w = this.currentWeapon;
        
        // 火神炮过热检查
        if (w.drawType === 'vulcan') {
            if (this.isOverheated) return;
            this.heatLevel += w.heatPerShot;
            if (this.heatLevel >= w.overheatThreshold) {
                this.isOverheated = true;
                this.overheatTimer = w.overheatCooldown;
                this.heatLevel = w.overheatThreshold;
            }
        }
        
        // 音效
        playShootSound(w.drawType);
        
        // 近战攻击
        if (w.drawType === 'beamSword') {
            if (!this.isSwinging) {
                this.isSwinging = true;
                this.swingProgress = -w.swingRange / 2;
                this.swingDirection = 1;
                this.fireCooldown = w.fireRate;
                
                // 近战特效
                const totalAngle = this.bodyAngle + this.upperAngle + this.weaponAngle;
                const cos = Math.cos(totalAngle);
                const sin = Math.sin(totalAngle);
                
                for (let i = 0; i < 10; i++) {
                    particles.push(new Particle(
                        this.x + sin * 20 + (Math.random() - 0.5) * 30,
                        this.y - cos * 20 + (Math.random() - 0.5) * 30,
                        (Math.random() - 0.5) * 4,
                        (Math.random() - 0.5) * 4,
                        '#00ff88'
                    ));
                }
            }
            return;
        }
        
        this.fireCooldown = w.fireRate;
        
        const totalAngle = this.bodyAngle + this.upperAngle + this.weaponAngle;
        const cos = Math.cos(totalAngle);
        const sin = Math.sin(totalAngle);
        
        const muzzleX = this.x + sin * w.barrelLength;
        const muzzleY = this.y - cos * w.barrelLength;
        
        if (w.drawType === 'shotgun') {
            for (let i = 0; i < w.pelletCount; i++) {
                const spread = (Math.random() - 0.5) * w.spread * 2;
                bullets.push(new Bullet(muzzleX, muzzleY, totalAngle + spread, w));
            }
        } else if (w.drawType === 'laser') {
            bullets.push(new LaserBeam(muzzleX, muzzleY, totalAngle, w));
        } else {
            const spread = (Math.random() - 0.5) * w.spread * 2;
            bullets.push(new Bullet(muzzleX, muzzleY, totalAngle + spread, w));
        }
        
        const particleCount = w.drawType === 'cannon' ? 15 : 8;
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle(
                muzzleX, muzzleY,
                -sin * 2 + (Math.random() - 0.5) * 3,
                cos * 2 + (Math.random() - 0.5) * 3,
                w.bulletColor
            ));
        }
        
        this.velocityX -= sin * w.recoil;
        this.velocityY += cos * w.recoil;
    }
    
    fireHook() {
        // 检查是否已有钩爪，有则取消
        for (let i = 0; i < hooks.length; i++) {
            if (hooks[i].state !== 'done') {
                hooks[i].state = 'retracting';
                return;
            }
        }
        
        const totalAngle = this.bodyAngle + this.upperAngle + this.weaponAngle;
        const cos = Math.cos(totalAngle);
        const sin = Math.sin(totalAngle);
        
        const muzzleX = this.x + sin * this.currentWeapon.barrelLength;
        const muzzleY = this.y - cos * this.currentWeapon.barrelLength;
        
        hooks.push(new Hook(muzzleX, muzzleY, totalAngle));
    }
}

export default Mech;
