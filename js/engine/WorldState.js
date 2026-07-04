// 统一世界状态容器：替代 config.js 中分散的全局可变数组

export const world = {
    entities: new Map(),
    players: [],
    enemies: [],
    bullets: [],
    particles: [],
    footprints: [],
    hooks: [],
    obstacles: [],
    drops: [],
    floatingTexts: [],
    camera: { x: 0, y: 0 },
    fortress: null,
    localPlayerId: 'p1',
    pilot: null,
    isPilotActive: false
};

export function resetWorld() {
    world.entities.clear();
    world.players.length = 0;
    world.enemies.length = 0;
    world.bullets.length = 0;
    world.particles.length = 0;
    world.footprints.length = 0;
    world.hooks.length = 0;
    world.obstacles.length = 0;
    world.drops.length = 0;
    world.floatingTexts.length = 0;
    world.camera.x = 0;
    world.camera.y = 0;
    world.fortress = null;
    world.pilot = null;
    world.isPilotActive = false;
}

export function addEntity(entity, tag = null) {
    if (entity && entity.id === undefined) entity.id = generateId();
    if (tag) entity.tag = tag;
    world.entities.set(entity.id, entity);
    return entity;
}

export function removeEntity(entity) {
    if (!entity) return;
    world.entities.delete(entity.id);
}

let _idCounter = 0;
export function generateId(prefix = 'ent') {
    return `${prefix}_${++_idCounter}_${Date.now().toString(36)}`;
}

export function setCamera(x, y) {
    world.camera.x = x;
    world.camera.y = y;
}

export function getCamera() {
    return world.camera;
}
