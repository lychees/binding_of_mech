import { world } from './WorldState.js?v=2';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../config.js?v=2';

const CELL_SIZE = 100;

export class SpatialGrid {
    constructor(cellSize = CELL_SIZE) {
        this.cellSize = cellSize;
        this.cells = new Map();
    }

    clear() {
        this.cells.clear();
    }

    _key(cx, cy) {
        return `${cx},${cy}`;
    }

    insert(entity) {
        const cx = Math.floor(entity.x / this.cellSize);
        const cy = Math.floor(entity.y / this.cellSize);
        const key = this._key(cx, cy);
        if (!this.cells.has(key)) this.cells.set(key, []);
        this.cells.get(key).push(entity);
    }

    query(x, y, radius) {
        const result = [];
        const minCX = Math.floor((x - radius) / this.cellSize);
        const maxCX = Math.floor((x + radius) / this.cellSize);
        const minCY = Math.floor((y - radius) / this.cellSize);
        const maxCY = Math.floor((y + radius) / this.cellSize);
        for (let cx = minCX; cx <= maxCX; cx++) {
            for (let cy = minCY; cy <= maxCY; cy++) {
                const list = this.cells.get(this._key(cx, cy));
                if (!list) continue;
                for (const e of list) {
                    const dx = e.x - x;
                    const dy = e.y - y;
                    if (dx * dx + dy * dy <= radius * radius) result.push(e);
                }
            }
        }
        return result;
    }

    queryRect(x, y, width, height) {
        const result = [];
        const minCX = Math.floor(x / this.cellSize);
        const maxCX = Math.floor((x + width) / this.cellSize);
        const minCY = Math.floor(y / this.cellSize);
        const maxCY = Math.floor((y + height) / this.cellSize);
        for (let cx = minCX; cx <= maxCX; cx++) {
            for (let cy = minCY; cy <= maxCY; cy++) {
                const list = this.cells.get(this._key(cx, cy));
                if (!list) continue;
                for (const e of list) {
                    if (e.x >= x && e.x <= x + width && e.y >= y && e.y <= y + height) result.push(e);
                }
            }
        }
        return result;
    }
}

function teamOf(entity) {
    if (entity.playerTag || entity.isPilot) return 'player';
    if (entity.templateKey) return 'enemy';
    return 'neutral';
}

export function resolveEntityCollision(a, b) {
    if (a.isDead || b.isDead) return;
    if (a.health <= 0 || b.health <= 0) return;
    if (teamOf(a) === teamOf(b) && teamOf(a) !== 'neutral') return;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const rA = a.collisionRadius || 20;
    const rB = b.collisionRadius || 20;
    const minDist = rA + rB;

    if (dist >= minDist || dist <= 0) return;

    const overlap = minDist - dist;
    const nx = dx / dist;
    const ny = dy / dist;

    a.x -= nx * overlap * 0.5;
    a.y -= ny * overlap * 0.5;
    b.x += nx * overlap * 0.5;
    b.y += ny * overlap * 0.5;

    const rvx = (b.velocityX || 0) - (a.velocityX || 0);
    const rvy = (b.velocityY || 0) - (a.velocityY || 0);
    const velAlongNormal = rvx * nx + rvy * ny;

    if (velAlongNormal >= 0) return;

    const aCooldown = a.lastCollisionTime ?? 0;
    const bCooldown = b.lastCollisionTime ?? 0;
    if (aCooldown > 0 || bCooldown > 0) return;

    const restitution = 0.5;
    const impulse = -(1 + restitution) * velAlongNormal / 2;
    a.velocityX -= impulse * nx;
    a.velocityY -= impulse * ny;
    b.velocityX += impulse * nx;
    b.velocityY += impulse * ny;

    const relativeSpeed = Math.abs(velAlongNormal);
    const multA = a.collisionDamageMultiplier || 0.6;
    const multB = b.collisionDamageMultiplier || 0.6;
    const damage = relativeSpeed * (multA + multB) * 0.5;
    if (damage >= 1) {
        if (a.takeHit) a.takeHit(damage);
        if (b.takeHit) b.takeHit(damage);
        a.lastCollisionTime = a.collisionCooldown || 15;
        b.lastCollisionTime = b.collisionCooldown || 15;
    }
}

export function resolveObstacleCollision(entity, obstacle) {
    if (entity.isDead) return;
    const ew = entity.collisionRadius * 2;
    const eh = entity.collisionRadius * 2;
    const ex = entity.x - entity.collisionRadius;
    const ey = entity.y - entity.collisionRadius;

    if (ex + ew > obstacle.x && ex < obstacle.x + obstacle.width &&
        ey + eh > obstacle.y && ey < obstacle.y + obstacle.height) {
        const centerX = obstacle.x + obstacle.width / 2;
        const centerY = obstacle.y + obstacle.height / 2;
        const dx = entity.x - centerX;
        const dy = entity.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            entity.x += (dx / dist) * 3;
            entity.y += (dy / dist) * 3;
        }
        if (entity.angle !== undefined && entity.turnOnObstacle !== false) {
            entity.angle += Math.PI / 2;
        }
    }
}

export function updatePhysics() {
    const grid = new SpatialGrid();
    const all = [
        ...world.players,
        ...world.enemies,
        world.pilot
    ].filter(e => e && !e.isDead);

    for (const e of all) grid.insert(e);

    // 实体间碰撞
    for (const e of all) {
        const nearby = grid.query(e.x, e.y, (e.collisionRadius || 20) + CELL_SIZE);
        for (const other of nearby) {
            if (other === e) continue;
            resolveEntityCollision(e, other);
        }
    }

    // 实体与障碍
    for (const e of all) {
        for (const obs of world.obstacles) {
            resolveObstacleCollision(e, obs);
        }
        e.boundPosition(e.collisionRadius || 20, e.collisionRadius || 20,
            WORLD_WIDTH - (e.collisionRadius || 20), WORLD_HEIGHT - (e.collisionRadius || 20));
    }
}
