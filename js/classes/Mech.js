import { keys, particles, footprints, bullets, hooks, obstacles, cameraX, cameraY, WORLD_WIDTH, WORLD_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../config.js?v=2';
import { playShootSound } from '../audio.js?v=2';
import { WEAPONS } from '../weapons.js?v=2';
import Bullet from './Bullet.js?v=2';
import LaserBeam from './LaserBeam.js?v=2';
import Missile from './Missile.js?v=2';
import Entity from './Entity.js?v=2';
import Particle, { createFlame, createSpark, createJet, createSmoke } from './Particle.js?v=2';
import Hook from './Hook.js?v=2';
import { clamp, dist, normalize } from '../utils.js?v=2';
import { broadcastAction } from '../net/OnlineGame.js?v=2';

function shadeColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

const WEAPON_RENDERERS = {
    vulcan(ctx, w, mech) {
        ctx.fillStyle = w.color;
        ctx.fillRect(-w.barrelWidth / 2, -w.barrelLength, w.barrelWidth, w.barrelLength);
        ctx.fillStyle = w.muzzleColor;
        ctx.fillRect(-w.barrelWidth / 2 - 1, -w.barrelLength, w.barrelWidth + 2, 4);
        ctx.fillStyle = '#aa5a3a';
        ctx.fillRect(-1, -w.barrelLength + 2, 2, w.barrelLength - 4);
        ctx.fillStyle = '#8a4a2a';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(-w.barrelWidth / 2 - 2, -w.barrelLength + 5 + i * 5, w.barrelWidth + 4, 2);
        }
        if (mech.heatLevel > 0) {
            const heatRatio = mech.heatLevel / w.overheatThreshold;
            ctx.fillStyle = '#333';
            ctx.fillRect(-w.barrelWidth / 2 - 8, -w.barrelLength, 5, w.barrelLength);
            ctx.fillStyle = `rgba(255, ${Math.floor(255 - heatRatio * 255)}, 0, 0.9)`;
            ctx.fillRect(-w.barrelWidth / 2 - 8, -w.barrelLength + w.barrelLength * (1 - heatRatio), 5, w.barrelLength * heatRatio);
        }
    },
    shotgun(ctx, w) {
        ctx.fillStyle = w.color;
        ctx.fillRect(-w.barrelWidth / 2, -w.barrelLength, w.barrelWidth, w.barrelLength);
        ctx.fillStyle = w.muzzleColor;
        ctx.fillRect(-4, -w.barrelLength, 3, w.barrelLength - 2);
        ctx.fillRect(1, -w.barrelLength, 3, w.barrelLength - 2);
        ctx.fillStyle = '#6a5a4a';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(-6, -w.barrelLength + 5 + i * 6, 12, 2);
        }
    },
    cannon(ctx, w) {
        ctx.fillStyle = w.color;
        ctx.fillRect(-w.barrelWidth / 2, -w.barrelLength, w.barrelWidth, w.barrelLength);
        ctx.fillStyle = w.muzzleColor;
        ctx.fillRect(-w.barrelWidth / 2 - 2, -w.barrelLength - 3, w.barrelWidth + 4, 6);
        ctx.fillStyle = '#5a6a5a';
        ctx.fillRect(-3, -10, 6, 8);
        ctx.fillRect(-8, -8, 16, 3);
        ctx.fillStyle = '#8a9a8a';
        ctx.fillRect(-2, -w.barrelLength + 3, 4, w.barrelLength - 6);
    },
    laser(ctx, w) {
        ctx.fillStyle = w.color;
        ctx.fillRect(-w.barrelWidth / 2, -w.barrelLength, w.barrelWidth, w.barrelLength);
        ctx.fillStyle = '#ff88cc';
        ctx.beginPath();
        ctx.arc(0, -w.barrelLength / 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ff44aa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -w.barrelLength / 2, 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 100, 180, 0.3)';
        ctx.beginPath();
        ctx.arc(0, -w.barrelLength / 2, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff66aa';
        ctx.fillRect(-w.barrelWidth / 2 - 1, -w.barrelLength - 2, w.barrelWidth + 2, 3);
    },
    beamSword(ctx, w, mech) {
        const bladeLength = w.barrelLength;
        const swingOffset = mech.isSwinging ? mech.swingProgress : 0;
        ctx.save();
        ctx.rotate(swingOffset);
        ctx.fillStyle = '#4a5a6a';
        ctx.fillRect(-3, -8, 6, 10);
        ctx.fillStyle = '#6a7a8a';
        ctx.fillRect(-2, -6, 4, 6);

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

        if (mech.isSwinging) {
            ctx.fillStyle = 'rgba(0, 255, 136, 0.15)';
            ctx.beginPath();
            ctx.arc(0, -8, bladeLength, -w.swingRange / 2 - Math.PI / 2, w.swingRange / 2 - Math.PI / 2);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    },
    missile(ctx, w) {
        ctx.fillStyle = w.color;
        ctx.fillRect(-w.barrelWidth / 2, -w.barrelLength, w.barrelWidth, w.barrelLength);
        ctx.fillStyle = '#ff4422';
        ctx.fillRect(-w.barrelWidth / 2 - 2, -w.barrelLength - 4, w.barrelWidth + 4, 6);
        ctx.fillStyle = '#ff8844';
        ctx.fillRect(-w.barrelWidth / 2 - 1, -w.barrelLength - 8, w.barrelWidth + 2, 4);
        ctx.fillStyle = '#444';
        ctx.fillRect(-3, -w.barrelLength + 4, 6, w.barrelLength - 8);
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.arc(0, -w.barrelLength * 0.4, 4, 0, Math.PI * 2);
        ctx.fill();
    }
};

class Mech extends Entity {
    constructor(x, y) {
        super(x, y);
        this.bodyAngle = 0;
        this.upperAngle = 0;
        this.weaponAngle = 0;

        this.acceleration = 0.12;
        this.deceleration = 0.04;
        this.maxSpeed = 2.5;

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
        this.weaponKeys = ['1', '2', '3', '4', '5', '6', '7'];
        this.weaponList = [WEAPONS.VULCAN, WEAPONS.SHOTGUN, WEAPONS.CANNON, WEAPONS.LASER, WEAPONS.BEAM_SWORD, WEAPONS.MISSILE, WEAPONS.HOMING_MISSILE];

        this.collisionRadius = 25;
        this.collisionDamageMultiplier = 0.8;

        this.heatLevel = 0;
        this.isOverheated = false;
        this.overheatTimer = 0;

        this.isSwinging = false;
        this.swingProgress = 0;
        this.swingDirection = 1;

        this.laserCharge = 0;
        this.isChargingLaser = false;
        this.maxLaserCharge = 60;
        this.laserChargeThreshold = 30;

        this.isDashing = false;
        this.dashCooldown = 0;
        this.dashDuration = 0;
        this.dashDirectionX = 0;
        this.dashDirectionY = 0;
        this.dashSpeed = 12;
        this.dashMaxCooldown = 60;
        this.dashMaxDuration = 10;

        this.isPilotEjected = false;
        this.alreadyExploded = false;
        this.inventory = null;

        // 视觉差异化参数，由蓝图/模块应用后覆盖
        this.variant = 'standard';
        this.color = '#00d4ff';
        this.secondaryColor = '#4a5568';
        this.coreColor = '#a0d0f0';
        this.hasShoulderArmor = false;
        this.hasBackpack = false;
        this.legStyle = 'biped';
        this.visorShape = 'round';
        this.antennaCount = 0;
        this.extraPlating = 0;
    }

    update(input = null) {
        if (this.isDead) {
            for (let i = this.jetParticles.length - 1; i >= 0; i--) {
                this.jetParticles[i].update();
                if (this.jetParticles[i].life <= 0) this.jetParticles.splice(i, 1);
            }
            return;
        }
        this.input = input;
        this.handleWeaponSwitch();
        this.updateLaserCharge();
        if (this.fireCooldown > 0) this.fireCooldown--;
        this.updateHeat();
        this.updateSwing();
        this.updateDash();
        this.updateMovement();
        this.updateTurning();
        this.updateWalkCycle();
        this.updateStatusEffects();
    }

    getInput() {
        return this.input || {
            forward: false,
            backward: false,
            strafeLeft: false,
            strafeRight: false,
            left: false,
            right: false,
            weaponLeft: false,
            weaponRight: false,
            turnLeft: false,
            turnRight: false,
            shoot: false,
            hook: false,
            dash: false,
            weaponSwitch: 0
        };
    }

    handleWeaponSwitch() {
        const input = this.getInput();
        const idx = input.weaponSwitch ? input.weaponSwitch - 1 : -1;
        if (idx >= 0 && idx < this.weaponList.length) {
            this.currentWeapon = this.weaponList[idx];
            this.isSwinging = false;
            if (this.playerTag !== 'remote') broadcastAction('weaponSwitch', { index: idx });
            return;
        }
    }

    updateHeat() {
        if (this.currentWeapon.drawType !== 'vulcan') return;
        if (this.isOverheated) {
            this.overheatTimer--;
            this.heatLevel = (this.overheatTimer / this.currentWeapon.overheatCooldown) * this.currentWeapon.overheatThreshold;
            if (this.overheatTimer <= 0) {
                this.isOverheated = false;
                this.heatLevel = 0;
            }
        } else if (!this.getInput().shoot) {
            this.heatLevel = Math.max(0, this.heatLevel - this.currentWeapon.heatDecay);
        }
    }

    resetOverheat() {
        this.isOverheated = false;
        this.overheatTimer = 0;
        this.heatLevel = 0;
        this.fireCooldown = 0;
    }

    updateLaserCharge() {
        const input = this.getInput();
        const w = this.currentWeapon;
        if (w?.drawType !== 'laser') {
            if (this.isChargingLaser) this.fireLaserCharge();
            return;
        }

        if (input.shoot) {
            this.isChargingLaser = true;
            if (this.laserCharge < this.maxLaserCharge) {
                this.laserCharge++;
            }
        } else if (this.isChargingLaser) {
            this.fireLaserCharge();
        }
    }

    fireLaserCharge() {
        const w = this.currentWeapon;
        if (!w || w.drawType !== 'laser' || this.fireCooldown > 0) {
            this.isChargingLaser = false;
            this.laserCharge = 0;
            return;
        }

        const chargeRatio = this.laserCharge / this.maxLaserCharge;
        const damage = w.damage * (0.45 + chargeRatio * 2.55);
        const width = w.bulletRadius * 2 * (0.5 + chargeRatio * 2.0);
        const life = Math.floor(w.bulletLife * (0.5 + chargeRatio * 1.5));

        this.fireCooldown = w.fireRate;
        playShootSound('laser');

        const totalAngle = this.bodyAngle + this.upperAngle + this.weaponAngle;
        const cos = Math.cos(totalAngle);
        const sin = Math.sin(totalAngle);
        const muzzleX = this.x + sin * w.barrelLength;
        const muzzleY = this.y - cos * w.barrelLength;

        const beam = new LaserBeam(muzzleX, muzzleY, totalAngle, {
            ...w,
            damage,
            bulletRadius: width / 2,
            bulletLife: life,
            chargeRatio
        });
        beam.maxLength = Math.max(WORLD_WIDTH, WORLD_HEIGHT, Math.sqrt(CANVAS_WIDTH ** 2 + CANVAS_HEIGHT ** 2) * 1.5);
        beam.fadeStart = beam.maxLength * 0.3;
        beam.fadeEnd = beam.maxLength;
        beam.width = width;
        bullets.push(beam);

        this.velocityX -= sin * w.recoil * (0.5 + chargeRatio * 2.0);
        this.velocityY += cos * w.recoil * (0.5 + chargeRatio * 2.0);

        const particleColor = chargeRatio >= 1 ? '#ff66cc' : '#ff88cc';
        const particleCount = Math.floor(6 + chargeRatio * 24);
        const particleSize = 2 + chargeRatio * 4;
        particles.push(...createSpark(muzzleX, muzzleY, particleColor, particleCount, particleSize));

        for (let i = 0; i < Math.floor(8 + chargeRatio * 24); i++) {
            const a = totalAngle + (Math.random() - 0.5) * 0.8;
            const s = (1 + Math.random() * 4) * (0.8 + chargeRatio * 1.5);
            const p = new Particle(muzzleX, muzzleY, Math.sin(a) * s, -Math.cos(a) * s, chargeRatio >= 1 ? '#ffaaee' : '#ff66aa');
            p.life = 20 + Math.floor(Math.random() * 20);
            p.maxLife = p.life;
            particles.push(p);
        }

        if (chargeRatio >= 1) {
            for (let i = 0; i < 16; i++) {
                const a = Math.random() * Math.PI * 2;
                const s = 2 + Math.random() * 5;
                const p = new Particle(muzzleX, muzzleY, Math.cos(a) * s, Math.sin(a) * s, '#ffffff');
                p.life = 15 + Math.floor(Math.random() * 15);
                p.maxLife = p.life;
                particles.push(p);
            }
        }

        this.isChargingLaser = false;
        this.laserCharge = 0;
    }

    updateSwing() {
        if (!this.isSwinging) return;
        this.swingProgress += this.swingDirection * this.currentWeapon.swingSpeed;
        if (this.swingProgress >= this.currentWeapon.swingRange / 2) this.swingDirection = -1;
        if (this.swingProgress <= -this.currentWeapon.swingRange / 2) {
            this.isSwinging = false;
            this.swingProgress = 0;
            this.swingDirection = 1;
        }
    }

    updateDash() {
        if (this.dashCooldown > 0) this.dashCooldown--;
        if (!this.isDashing) return;
        this.dashDuration--;
        this.velocityX = this.dashDirectionX * this.dashSpeed;
        this.velocityY = this.dashDirectionY * this.dashSpeed;

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
                update() { this.x += this.vx; this.y += this.vy; this.vx *= 0.95; this.vy *= 0.95; this.life--; },
                draw() {
                    const opacity = Math.max(0, this.life / this.maxLife);
                    ctx.fillStyle = this.color;
                    ctx.globalAlpha = opacity * 0.6;
                    ctx.beginPath();
                    ctx.arc(this.x - cameraX, this.y - cameraY, Math.max(0.1, this.size * opacity), 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }
            });
        }
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

    updateMovement() {
        const input = this.getInput();
        let moveForward = input.forward ? 1 : input.backward ? -1 : 0;
        const strafeLeft = input.strafeLeft || input.left;
        const strafeRight = input.strafeRight || input.right;
        let moveSide = strafeLeft ? -1 : strafeRight ? 1 : 0;

        if (input.dash && !this.isDashing && this.dashCooldown <= 0) {
            let dashX = strafeLeft ? -1 : strafeRight ? 1 : 0;
            let dashY = input.forward ? -1 : input.backward ? 1 : 0;
            if (dashX !== 0 || dashY !== 0) {
                const n = normalize(dashX, dashY);
                this.isDashing = true;
                this.dashDuration = this.dashMaxDuration;
                this.dashCooldown = this.dashMaxCooldown;
                this.dashDirectionX = n.x;
                this.dashDirectionY = n.y;
                if (this.playerTag !== 'remote') broadcastAction('dash', { dx: n.x, dy: n.y });
            }
        }

        const cos = Math.cos(this.bodyAngle);
        const sin = Math.sin(this.bodyAngle);

        const isHooked = hooks.some(h => h.state === 'hooked' && h.owner === this);
        let hookSpeedBoost = isHooked ? 6.0 : 1;
        let hookAccelerationBoost = isHooked ? 3.0 : 1;
        if (isHooked) {
            if (input.forward) { hookSpeedBoost *= 2.5; hookAccelerationBoost *= 1.8; }
            else if (input.backward) { hookSpeedBoost *= 0.4; hookAccelerationBoost *= 0.6; }
        }
        const effectiveMaxSpeed = this.maxSpeed * hookSpeedBoost;
        const effectiveAcceleration = Math.min(0.8, this.acceleration * hookAccelerationBoost);

        const targetVX = sin * moveForward * effectiveMaxSpeed + cos * moveSide * effectiveMaxSpeed * 0.7;
        const targetVY = -cos * moveForward * effectiveMaxSpeed + sin * moveSide * effectiveMaxSpeed * 0.7;

        if (!this.isDashing) {
            if (moveForward !== 0 || moveSide !== 0) {
                this.velocityX += (targetVX - this.velocityX) * effectiveAcceleration;
                this.velocityY += (targetVY - this.velocityY) * effectiveAcceleration;
            } else {
                this.velocityX *= (1 - this.deceleration);
                this.velocityY *= (1 - this.deceleration);
                if (Math.abs(this.velocityX) < 0.01) this.velocityX = 0;
                if (Math.abs(this.velocityY) < 0.01) this.velocityY = 0;
            }
        }

        this.x += this.velocityX;
        this.y += this.velocityY;
        this.boundPosition(30, 30, WORLD_WIDTH - 30, WORLD_HEIGHT - 30);
    }

    updateTurning() {
        const input = this.getInput();
        this.turnVelocity = this.applyTurn(this.turnVelocity,
            input.turnRight ? this.maxTurnSpeed : input.turnLeft ? -this.maxTurnSpeed : 0,
            this.turnDeceleration, 0.15);
        this.bodyAngle += this.turnVelocity;

        this.upperTurnVelocity = this.applyTurn(this.upperTurnVelocity,
            input.weaponRight ? -this.maxUpperTurnSpeed : input.weaponLeft ? this.maxUpperTurnSpeed : 0,
            this.upperTurnDeceleration, 0.12);
        this.upperAngle += this.upperTurnVelocity;
        this.upperAngle = clamp(this.upperAngle, -Math.PI * 0.8, Math.PI * 0.8);

        this.weaponTurnVelocity = this.applyTurn(this.weaponTurnVelocity,
            input.dash && input.weaponLeft ? -this.maxWeaponTurnSpeed : input.dash && input.weaponRight ? this.maxWeaponTurnSpeed : 0,
            this.weaponTurnDeceleration, 0.1);
        this.weaponAngle += this.weaponTurnVelocity;
    }

    applyTurn(velocity, target, deceleration, response) {
        if (target !== 0) velocity += (target - velocity) * response;
        else {
            velocity *= (1 - deceleration);
            if (Math.abs(velocity) < 0.001) velocity = 0;
        }
        return velocity;
    }

    updateWalkCycle() {
        const speed = Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2);
        if (speed > 0.1) this.walkCycle += this.walkSpeed * (speed / this.maxSpeed);
        if (speed > 0.5 && Math.sin(this.walkCycle) > 0.9) this.addFootprint();

        for (let i = footprints.length - 1; i >= 0; i--) {
            footprints[i].opacity -= 0.005;
            if (footprints[i].opacity <= 0) footprints.splice(i, 1);
        }

        if (speed > 1 || Math.abs(this.turnVelocity) > 0.01) this.addJetParticle();

        for (let i = this.jetParticles.length - 1; i >= 0; i--) {
            this.jetParticles[i].update();
            if (this.jetParticles[i].life <= 0) this.jetParticles.splice(i, 1);
        }
    }

    addFootprint() {
        const cos = Math.cos(this.bodyAngle);
        const sin = Math.sin(this.bodyAngle);
        const offset = 12;
        const side = Math.sin(this.walkCycle) > 0 ? -1 : 1;
        footprints.push({
            x: this.x + cos * this.legLength * 0.6 + sin * offset * side,
            y: this.y + sin * this.legLength * 0.6 - cos * offset * side,
            angle: this.bodyAngle,
            opacity: 0.3
        });
    }

    addJetParticle() {
        const cos = Math.cos(this.bodyAngle);
        const sin = Math.sin(this.bodyAngle);
        const color = `hsl(${180 + Math.random() * 40}, 80%, 60%)`;
        this.jetParticles.push(...createJet(
            this.x - cos * 15,
            this.y - sin * 15,
            -cos * 0.5,
            -sin * 0.5,
            color
        ));
    }

    draw() {
        const sc = (c, p) => shadeColor(c, p);
        if (this.isDead) {
            ctx.save();
            ctx.translate(this.x - cameraX, this.y - cameraY);
            ctx.rotate(this.bodyAngle);
            ctx.fillStyle = sc(this.secondaryColor, -30);
            ctx.fillRect(-this.bodyWidth / 2, -this.bodyHeight / 2, this.bodyWidth, this.bodyHeight);
            ctx.fillStyle = '#2a2a2a';
            ctx.beginPath();
            ctx.arc(0, -5, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(-this.upperWidth / 2, -this.upperHeight / 2 - 5, this.upperWidth, this.upperHeight);
            ctx.strokeStyle = '#ff4400';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-12, -8);
            ctx.lineTo(12, 8);
            ctx.moveTo(12, -8);
            ctx.lineTo(-12, 8);
            ctx.stroke();
            ctx.restore();
            return;
        }
        for (const fp of footprints) {
            ctx.save();
            ctx.translate(fp.x, fp.y);
            ctx.rotate(fp.angle);
            ctx.fillStyle = `rgba(80, 80, 80, ${fp.opacity})`;
            ctx.fillRect(-4, -6, 8, 12);
            ctx.restore();
        }

        for (const p of this.jetParticles) {
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

        const bodyW = this.bodyWidth + this.extraPlating * 4;
        const bodyH = this.bodyHeight + this.extraPlating * 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 25, 25 + this.extraPlating * 2, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.hasBackpack) {
            ctx.save();
            ctx.rotate(this.bodyAngle);
            ctx.fillStyle = sc(this.secondaryColor, -20);
            ctx.fillRect(-10, -bodyH / 2 - 12, 20, 10);
            ctx.fillStyle = sc(this.color, 10);
            ctx.fillRect(-6, -bodyH / 2 - 10, 12, 4);
            ctx.restore();
        }

        ctx.save();
        ctx.rotate(this.bodyAngle);
        this.drawLeg(-12, leftLegOffset, leftKnee);
        ctx.restore();

        ctx.save();
        ctx.rotate(this.bodyAngle);
        this.drawLeg(12, rightLegOffset, rightKnee);
        ctx.restore();

        ctx.save();
        ctx.rotate(this.bodyAngle);

        ctx.fillStyle = this.secondaryColor;
        ctx.fillRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH);
        ctx.fillStyle = sc(this.secondaryColor, 15);
        ctx.fillRect(-bodyW / 2 + 4, -bodyH / 2 + 4, bodyW - 8, bodyH - 8);

        ctx.strokeStyle = sc(this.secondaryColor, 30);
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const y of [-8, 0, 8]) {
            ctx.moveTo(-bodyW / 2 + 6, y);
            ctx.lineTo(bodyW / 2 - 6, y);
        }
        ctx.stroke();

        if (this.extraPlating > 0) {
            ctx.strokeStyle = sc(this.color, 20);
            ctx.lineWidth = 2;
            ctx.strokeRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH);
            for (let i = 0; i < this.extraPlating; i++) {
                ctx.fillStyle = sc(this.secondaryColor, -10 - i * 8);
                ctx.fillRect(-bodyW / 2 + 2 + i * 4, bodyH / 2 - 6 - i * 4, bodyW - 4 - i * 8, 4);
            }
        }

        const headSize = this.variant === 'heavy' ? 18 : (this.variant === 'light' ? 14 : 16);
        const headY = -bodyH / 2 - 8;
        ctx.fillStyle = sc(this.secondaryColor, -10);
        if (this.visorShape === 'visor') {
            ctx.fillRect(-headSize / 2, headY, headSize, 8);
        } else if (this.visorShape === 'dome') {
            ctx.beginPath();
            ctx.arc(0, headY + 4, headSize / 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(0, headY + 4, headSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, headY + 4, headSize / 4, 0, Math.PI * 2);
        ctx.fill();

        if (this.antennaCount > 0) {
            ctx.strokeStyle = sc(this.secondaryColor, 30);
            ctx.lineWidth = 2;
            for (let i = 0; i < this.antennaCount; i++) {
                const side = i % 2 === 0 ? -1 : 1;
                const x = side * (10 + i * 3);
                ctx.beginPath();
                ctx.moveTo(x, -bodyH / 2);
                ctx.lineTo(x + side * 3, -bodyH / 2 - 14 - i * 4);
                ctx.stroke();
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(x + side * 3, -bodyH / 2 - 14 - i * 4, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();

        ctx.save();
        ctx.rotate(this.bodyAngle + this.upperAngle);
        ctx.fillStyle = sc(this.secondaryColor, 10);
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = sc(this.secondaryColor, 20);
        ctx.fillRect(-this.upperWidth / 2, -this.upperHeight / 2 - 5, this.upperWidth, this.upperHeight);

        ctx.fillStyle = this.coreColor;
        ctx.beginPath();
        ctx.arc(0, -5, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(0, -5, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (this.hasShoulderArmor) {
            ctx.fillStyle = sc(this.secondaryColor, -15);
            ctx.fillRect(-this.upperWidth / 2 - 10, -this.upperHeight / 2 - 8, 12, 26);
            ctx.fillRect(this.upperWidth / 2 - 2, -this.upperHeight / 2 - 8, 12, 26);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.strokeRect(-this.upperWidth / 2 - 10, -this.upperHeight / 2 - 8, 12, 26);
            ctx.strokeRect(this.upperWidth / 2 - 2, -this.upperHeight / 2 - 8, 12, 26);
        }

        ctx.fillStyle = sc(this.secondaryColor, -10);
        ctx.fillRect(-this.upperWidth / 2 - 3, -this.upperHeight / 2 - 3, 6, 12);
        ctx.fillRect(this.upperWidth / 2 - 3, -this.upperHeight / 2 - 3, 6, 12);

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

        if (w.drawType === 'laser' && this.isChargingLaser && this.laserCharge > 0) {
            const chargeRatio = this.laserCharge / this.maxLaserCharge;
            const pulse = 1 + Math.sin(Date.now() / 40) * 0.25 * chargeRatio;
            const glowColor = chargeRatio >= 1 ? '#ffffff' : '#ff66cc';

            ctx.strokeStyle = `rgba(255, 68, 170, ${0.2 + chargeRatio * 0.4})`;
            ctx.lineWidth = (2 + chargeRatio * 8) * pulse;
            ctx.beginPath();
            ctx.moveTo(0, -5);
            ctx.lineTo(0, -w.barrelLength - 5 - chargeRatio * 12);
            ctx.stroke();

            ctx.fillStyle = glowColor;
            ctx.globalAlpha = 0.4 + chargeRatio * 0.6;
            ctx.beginPath();
            ctx.arc(0, -w.barrelLength - 5, 4 + chargeRatio * 8 * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            if (chargeRatio >= 1) {
                for (let i = 0; i < 4; i++) {
                    const a = Math.random() * Math.PI * 2;
                    const r = 8 + Math.random() * 10;
                    ctx.fillStyle = '#ffaaee';
                    ctx.beginPath();
                    ctx.arc(Math.cos(a) * r, -w.barrelLength - 5 + Math.sin(a) * r, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        const renderer = WEAPON_RENDERERS[w.drawType];
        if (renderer) renderer(ctx, w, this);
    }

    drawLeg(xOffset, footOffset, kneeOffset) {
        const sc = (c, p) => shadeColor(c, p);
        if (this.legStyle === 'tracked') {
            ctx.fillStyle = sc(this.secondaryColor, -20);
            ctx.fillRect(xOffset - this.legWidth / 2 - 3, 4, this.legWidth + 6, this.legLength + 6);
            ctx.fillStyle = sc(this.secondaryColor, 10);
            ctx.fillRect(xOffset - this.legWidth / 2, 8, this.legWidth, this.legLength - 2);
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.arc(xOffset, this.legLength + 6, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(xOffset, this.legLength * 0.55, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = sc(this.color, 20);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(xOffset - this.legWidth / 2, 8);
            ctx.lineTo(xOffset - this.legWidth / 2, this.legLength + 2);
            ctx.moveTo(xOffset + this.legWidth / 2, 8);
            ctx.lineTo(xOffset + this.legWidth / 2, this.legLength + 2);
            ctx.stroke();
            return;
        }

        const reverse = this.legStyle === 'reverseJoint';
        const kneeX = reverse ? xOffset - kneeOffset * 0.3 : xOffset + kneeOffset * 0.3;

        ctx.strokeStyle = this.secondaryColor;
        ctx.lineWidth = this.legWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(xOffset, 0);
        ctx.lineTo(kneeX, this.legLength * 0.5);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(kneeX, this.legLength * 0.5);
        ctx.lineTo(xOffset + footOffset * 0.2, this.legLength + footOffset * 0.1);
        ctx.stroke();

        ctx.fillStyle = sc(this.secondaryColor, 20);
        ctx.beginPath();
        ctx.arc(xOffset, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(kneeX, this.legLength * 0.5, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = sc(this.secondaryColor, -20);
        ctx.save();
        ctx.translate(xOffset + footOffset * 0.2, this.legLength + footOffset * 0.1);
        if (reverse) {
            ctx.beginPath();
            ctx.moveTo(-7, -3);
            ctx.lineTo(7, -3);
            ctx.lineTo(5, 5);
            ctx.lineTo(-5, 5);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillRect(-6, -2, 12, 6);
        }
        ctx.restore();
    }

    takeHit(damage) {
        super.takeHit(damage * (1 - this.armor));
    }

    shoot() {
        if (this.isDead || this.fireCooldown > 0) return;
        const w = this.currentWeapon;

        if (w.drawType === 'vulcan') {
            if (this.isOverheated) return;
            this.heatLevel += w.heatPerShot;
            if (this.heatLevel >= w.overheatThreshold) {
                this.isOverheated = true;
                this.overheatTimer = w.overheatCooldown;
                this.heatLevel = w.overheatThreshold;
            }
        }

        playShootSound(w.drawType);

        if (w.drawType === 'beamSword') {
            if (!this.isSwinging) {
                this.isSwinging = true;
                this.swingProgress = -w.swingRange / 2;
                this.swingDirection = 1;
                this.fireCooldown = w.fireRate;
                const totalAngle = this.bodyAngle + this.upperAngle + this.weaponAngle;
                particles.push(...createSpark(
                    this.x + Math.sin(totalAngle) * 20,
                    this.y - Math.cos(totalAngle) * 20,
                    '#00ff88', 10, 4
                ));
                this.damageEnemiesInArc(w);
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
                bullets.push(new Bullet(muzzleX, muzzleY, totalAngle + (Math.random() - 0.5) * w.spread * 2, w));
            }
        } else if (w.drawType === 'laser') {
            // 激光现在在 updateLaserCharge 中处理
            return;
        } else if (w.drawType === 'missile') {
            let target = null;
            if (w.homing) {
                let best = null;
                let bestD = Infinity;
                for (const e of window.enemies || []) {
                    if (e.isDead || e.health <= 0) continue;
                    const d = dist(muzzleX, muzzleY, e.x, e.y);
                    if (d < bestD) { bestD = d; best = e; }
                }
                target = best;
            }
            bullets.push(new Missile(muzzleX, muzzleY, totalAngle + (Math.random() - 0.5) * w.spread, w, false, target));
        } else {
            bullets.push(new Bullet(muzzleX, muzzleY, totalAngle + (Math.random() - 0.5) * w.spread * 2, w));
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

    damageEnemiesInArc(w) {
        const startAngle = this.bodyAngle + this.upperAngle + this.weaponAngle - w.swingRange / 2;
        for (const enemy of window.enemies || []) {
            if (enemy.isDead || enemy.health <= 0) continue;
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d > w.barrelLength + 35) continue;
            const angleTo = Math.atan2(dx, -dy);
            let diff = angleTo - startAngle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            if (diff >= 0 && diff <= w.swingRange) {
                enemy.takeHit(w.damage);
                if (enemy.health <= 0) {
                    const template = ENEMY_TEMPLATES[enemy.templateKey];
                    if (template) window.spawnDrops?.(enemy.x, enemy.y, template, 'enemy');
                    window.enemies.splice(window.enemies.indexOf(enemy), 1);
                }
            }
        }
    }

    fireHook() {
        for (const h of hooks) {
            if (h.state !== 'done' && h.owner === this) {
                h.state = 'retracting';
                return;
            }
        }
        const totalAngle = this.bodyAngle + this.upperAngle + this.weaponAngle;
        const cos = Math.cos(totalAngle);
        const sin = Math.sin(totalAngle);
        hooks.push(new Hook(
            this.x + sin * this.currentWeapon.barrelLength,
            this.y - cos * this.currentWeapon.barrelLength,
            totalAngle,
            this
        ));
    }
}

export default Mech;
