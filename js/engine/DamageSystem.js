import { world } from './WorldState.js?v=2';
import { dist } from '../utils.js?v=2';
import { ENEMY_TEMPLATES } from '../enemies.js?v=2';
import { createSpark } from '../classes/Particle.js?v=2';
import { playHitSound, playExplosionSound } from '../audio.js?v=2';

function teamOf(entity) {
    if (entity.playerTag || entity.isPilot) return 'player';
    if (entity.templateKey) return 'enemy';
    return 'neutral';
}

function canHit(bullet, target) {
    if (target.isDead || target.health <= 0) return false;
    if (bullet.isEnemyBullet) {
        return teamOf(target) === 'player';
    }
    return teamOf(target) === 'enemy';
}

function onKill(target, source) {
    if (target.templateKey) {
        const template = ENEMY_TEMPLATES[target.templateKey];
        if (template && typeof window.spawnDrops === 'function') {
            window.spawnDrops(target.x, target.y, template, 'enemy');
        }
    }
}

export function updateDamage() {
    const { bullets, players, enemies, fortress, obstacles, particles } = world;
    const playerTargets = [
        ...players.filter(p => !p.isDead),
        world.pilot && !world.pilot.isDead ? world.pilot : null
    ].filter(Boolean);

    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (b.update && b.update.length > 0 && b.constructor?.name === 'Missile') {
            b.update(enemies, players, world.pilot, world.isPilotActive);
        } else if (b.update) {
            b.update();
        }

        let hit = false;
        const bTeam = b.isEnemyBullet ? 'enemy' : 'player';

        if (bTeam === 'player') {
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                if (e.isDead || e.health <= 0) continue;
                if (dist(b.x, b.y, e.x, e.y) < (e.size || e.collisionRadius || 10) + (b.radius || 5)) {
                    const dmg = b.getDamageAtDistance ? b.getDamageAtDistance(dist(b.x, b.y, e.x, e.y)) : (b.damage || 0);
                    e.takeHit(dmg);
                    hit = true;
                    if (e.health <= 0) {
                        onKill(e, b);
                        playExplosionSound('small');
                        enemies.splice(j, 1);
                    }
                    break;
                }
            }
            if (!hit && fortress && !fortress.isDead) {
                const d = dist(b.x, b.y, fortress.x, fortress.y);
                if (d < fortress.size + (b.radius || 5)) {
                    fortress.takeHit(b.damage || 5);
                    hit = true;
                }
            }
        } else {
            for (const t of playerTargets) {
                const r = t.isPilot ? (t.size + 4) : (t.collisionRadius || 20);
                if (dist(b.x, b.y, t.x, t.y) < r + (b.radius || 5)) {
                    t.takeHit(b.damage || 5);
                    hit = true;
                    particles.push(...createSpark(t.x, t.y, '#00d4ff', 5, 4));
                    break;
                }
            }
        }

        // 障碍碰撞
        if (!hit) {
            for (let j = obstacles.length - 1; j >= 0; j--) {
                const obs = obstacles[j];
                if (b.x >= obs.x && b.x <= obs.x + obs.width &&
                    b.y >= obs.y && b.y <= obs.y + obs.height) {
                    if (obs.health !== undefined) {
                        obs.health -= b.damage || 10;
                        if (obs.health <= 0) {
                            particles.push(...createSpark(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.isTree ? '#2a5a2a' : '#888', 8, 4));
                            obstacles.splice(j, 1);
                        }
                    }
                    hit = true;
                    break;
                }
            }
        }

        if (hit) {
            if (b.explode) b.explode();
            bullets.splice(i, 1);
            playHitSound();
            continue;
        }

        if (b.life <= 0) {
            if (b.explode) b.explode();
            bullets.splice(i, 1);
        }
    }
}
