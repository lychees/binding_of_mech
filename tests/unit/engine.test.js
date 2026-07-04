import { describe, it } from 'node:test';
import assert from 'node:assert';

// 共享 keys 对象，让 engine 模块读取到按键状态
const { keys, world } = await import('../../js/config.js?v=2');
global.keys = keys;

const { resetWorld, addEntity, removeEntity, setCamera, getCamera } = await import('../../js/engine/WorldState.js?v=2');
const { createInputState, getInputState, updateInputs, resetInputs } = await import('../../js/engine/InputSystem.js?v=2');
const { resolveEntityCollision } = await import('../../js/engine/PhysicsSystem.js?v=2');

// DamageSystem 依赖浏览器音频 API，动态导入前先 mock 全局 window 与 AudioContext
const updateDamage = await (async () => {
    global.window = globalThis;
    globalThis.spawnDrops = () => {};
    globalThis.AudioContext = class {
        constructor() { this.destination = {}; this.sampleRate = 44100; this.currentTime = 0; }
        createGain() { return { gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
        createOscillator() { return { type: 'sine', frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }; }
        createBufferSource() { return { buffer: null, connect() {}, start() {}, stop() {} }; }
        createBuffer(ch, len, rate) { return { getChannelData: () => new Float32Array(len), length: len, sampleRate: rate }; }
        createBiquadFilter() { return { type: 'lowpass', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
        decodeAudioData() { return Promise.resolve({}); }
    };
    globalThis.webkitAudioContext = globalThis.AudioContext;
    const m = await import('../../js/engine/DamageSystem.js?v=2');
    return m.updateDamage;
})();

describe('WorldState', () => {
    it('resetWorld 清空所有数组与相机', () => {
        world.players.push({ x: 0 });
        world.enemies.push({ x: 0 });
        world.bullets.push({ x: 0 });
        setCamera(100, 200);
        resetWorld();
        assert.strictEqual(world.players.length, 0);
        assert.strictEqual(world.enemies.length, 0);
        assert.strictEqual(world.bullets.length, 0);
        assert.strictEqual(world.fortress, null);
        assert.deepStrictEqual(getCamera(), { x: 0, y: 0 });
    });

    it('addEntity 自动分配 id 与 tag', () => {
        const ent = addEntity({ name: 'test' }, 'unit');
        assert.ok(ent.id.startsWith('ent_'));
        assert.strictEqual(ent.tag, 'unit');
        assert.strictEqual(world.entities.has(ent.id), true);
        removeEntity(ent);
        assert.strictEqual(world.entities.has(ent.id), false);
    });
});

describe('InputSystem', () => {
    it('createInputState 默认全部 false', () => {
        const s = createInputState();
        assert.strictEqual(s.forward, false);
        assert.strictEqual(s.shoot, false);
        assert.strictEqual(s.weaponSwitch, null);
    });

    it('resetInputs 清空所有输入源', () => {
        keys['w'] = true;
        updateInputs();
        assert.strictEqual(getInputState('p1').forward, true);
        resetInputs();
        assert.strictEqual(getInputState('p1').forward, false);
        assert.strictEqual(getInputState('p2').forward, false);
        keys['w'] = false;
    });

    it('P1 侧移与转向键互不干扰', () => {
        resetInputs();
        keys['a'] = true;
        keys['q'] = true;
        updateInputs();
        const p1 = getInputState('p1');
        assert.strictEqual(p1.strafeLeft, true);
        assert.strictEqual(p1.turnLeft, true);
        assert.strictEqual(p1.forward, false);
        keys['a'] = false;
        keys['q'] = false;
    });
});

describe('PhysicsSystem', () => {
    it('resolveEntityCollision 推开重叠实体并反弹', () => {
        const a = { x: 0, y: 0, velocityX: 10, velocityY: 0, collisionRadius: 10, health: 100, takeHit: () => {} };
        const b = { x: 15, y: 0, velocityX: -10, velocityY: 0, collisionRadius: 10, health: 100, takeHit: () => {} };
        resolveEntityCollision(a, b);
        assert.ok(Math.abs(a.x - b.x) >= 19);
        assert.ok(a.velocityX < 10);
        assert.ok(b.velocityX > -10);
    });

    it('同队实体不发生碰撞', () => {
        const a = { x: 0, y: 0, velocityX: 10, collisionRadius: 10, health: 100, playerTag: 'p1' };
        const b = { x: 15, y: 0, velocityX: -10, collisionRadius: 10, health: 100, playerTag: 'p2' };
        resolveEntityCollision(a, b);
        assert.strictEqual(a.x, 0);
        assert.strictEqual(b.x, 15);
    });
});

describe('DamageSystem', () => {
    it('玩家子弹命中敌人后双方被移除', () => {
        resetWorld();
        let hit = false;
        const enemy = {
            x: 100, y: 100, health: 10, isDead: false, collisionRadius: 10, templateKey: 'scout',
            takeHit(dmg) { this.health -= dmg; hit = true; }
        };
        const bullet = {
            x: 100, y: 100, life: 10, damage: 10, radius: 5,
            update() {}
        };
        world.enemies.push(enemy);
        world.bullets.push(bullet);
        updateDamage();
        assert.strictEqual(hit, true);
        assert.strictEqual(world.enemies.length, 0);
        assert.strictEqual(world.bullets.length, 0);
    });

    it('敌人子弹命中玩家造成伤害', () => {
        resetWorld();
        let hit = false;
        const player = {
            x: 50, y: 50, health: 100, isDead: false, collisionRadius: 20, playerTag: 'p1',
            takeHit(dmg) { this.health -= dmg; hit = true; }
        };
        const bullet = {
            x: 50, y: 50, life: 10, damage: 5, radius: 5, isEnemyBullet: true,
            update() {}
        };
        world.players.push(player);
        world.bullets.push(bullet);
        updateDamage();
        assert.strictEqual(hit, true);
        assert.strictEqual(player.health, 95);
        assert.strictEqual(world.bullets.length, 0);
    });
});
