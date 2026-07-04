import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMY_TEMPLATES, LEVELS } from '../../js/enemies.js';

describe('杂兵与关卡系统', () => {
    describe('ENEMY_TEMPLATES', () => {
        it('应该包含多种杂兵类型', () => {
            assert.ok(Object.keys(ENEMY_TEMPLATES).length >= 6);
        });

        it('每种杂兵应该有完整属性', () => {
            for (const key in ENEMY_TEMPLATES) {
                const t = ENEMY_TEMPLATES[key];
                assert.ok(t.name, `${key} 缺少 name`);
                assert.ok(typeof t.size === 'number', `${key} size 不是数字`);
                assert.ok(t.color, `${key} 缺少 color`);
                assert.ok(typeof t.health === 'number', `${key} health 不是数字`);
                assert.ok(typeof t.speed === 'number', `${key} speed 不是数字`);
                assert.ok(typeof t.fireRate === 'number', `${key} fireRate 不是数字`);
                assert.ok(typeof t.detectionRange === 'number', `${key} detectionRange 不是数字`);
                assert.ok(t.weapon, `${key} 缺少 weapon`);
                assert.ok(t.drawType, `${key} 缺少 drawType`);
                assert.ok(typeof t.money === 'number', `${key} money 不是数字`);
                assert.ok(typeof t.exp === 'number', `${key} exp 不是数字`);
            }
        });

        it('重装兵应该比侦察兵血量高', () => {
            assert.ok(ENEMY_TEMPLATES.heavy.health > ENEMY_TEMPLATES.scout.health);
        });

        it('侦察兵应该比重装兵速度快', () => {
            assert.ok(ENEMY_TEMPLATES.scout.speed > ENEMY_TEMPLATES.heavy.speed);
        });
    });

    describe('LEVELS', () => {
        it('应该包含多个关卡', () => {
            assert.ok(LEVELS.length >= 5);
        });

        it('每个关卡应该有正确配置', () => {
            for (const level of LEVELS) {
                assert.ok(typeof level.id === 'number', `关卡缺少 id`);
                assert.ok(level.name, `关卡 ${level.id} 缺少 name`);
                assert.ok(typeof level.enemyCount === 'number', `关卡 ${level.id} enemyCount 不是数字`);
                assert.ok(Array.isArray(level.enemyTypes), `关卡 ${level.id} enemyTypes 不是数组`);
                assert.ok(typeof level.reward === 'number', `关卡 ${level.id} reward 不是数字`);
            }
        });

        it('所有关卡默认应该解锁', () => {
            for (const level of LEVELS) {
                assert.equal(level.unlocked, true, `关卡 ${level.id} 未解锁`);
            }
        });

        it('关卡 id 应该连续递增', () => {
            for (let i = 0; i < LEVELS.length; i++) {
                assert.equal(LEVELS[i].id, i + 1);
            }
        });

        it('关卡奖励应该随关卡增加', () => {
            for (let i = 1; i < LEVELS.length; i++) {
                assert.ok(LEVELS[i].reward >= LEVELS[i - 1].reward);
            }
        });
    });
});
