import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WEAPONS, WEAPON_UPGRADES, getWeaponStats } from '../../js/weapons.js';

describe('武器系统', () => {
    describe('WEAPONS', () => {
        it('应该包含所有基础武器', () => {
            assert.ok(WEAPONS.VULCAN);
            assert.ok(WEAPONS.SHOTGUN);
            assert.ok(WEAPONS.CANNON);
            assert.ok(WEAPONS.LASER);
            assert.ok(WEAPONS.BEAM_SWORD);
        });

        it('每种武器应该有完整属性', () => {
            for (const key in WEAPONS) {
                const w = WEAPONS[key];
                assert.ok(w.name, `${key} 缺少 name`);
                assert.ok(w.color, `${key} 缺少 color`);
                assert.ok(typeof w.damage === 'number', `${key} damage 不是数字`);
                assert.ok(typeof w.fireRate === 'number', `${key} fireRate 不是数字`);
                assert.ok(typeof w.barrelLength === 'number', `${key} barrelLength 不是数字`);
            }
        });

        it('火神炮应该有温度机制', () => {
            const v = WEAPONS.VULCAN;
            assert.ok(typeof v.heatPerShot === 'number');
            assert.ok(typeof v.overheatThreshold === 'number');
            assert.ok(typeof v.overheatCooldown === 'number');
        });

        it('光束刀应该有挥动参数', () => {
            const s = WEAPONS.BEAM_SWORD;
            assert.ok(typeof s.swingRange === 'number');
            assert.ok(typeof s.swingSpeed === 'number');
            assert.ok(typeof s.swingDuration === 'number');
        });
    });

    describe('WEAPON_UPGRADES', () => {
        it('每种武器都应该有升级配置', () => {
            for (const key in WEAPONS) {
                assert.ok(WEAPON_UPGRADES[key], `${key} 缺少升级配置`);
            }
        });
    });

    describe('getWeaponStats', () => {
        it('等级提升应该增加伤害', () => {
            const base = getWeaponStats('VULCAN', 1);
            const high = getWeaponStats('VULCAN', 10);
            assert.ok(high.damage > base.damage);
        });

        it('等级提升应该降低射击间隔', () => {
            const base = getWeaponStats('VULCAN', 1);
            const high = getWeaponStats('VULCAN', 10);
            assert.ok(high.fireRate < base.fireRate);
        });

        it('等级提升应该降低散布', () => {
            const base = getWeaponStats('SHOTGUN', 1);
            const high = getWeaponStats('SHOTGUN', 10);
            assert.ok(high.spread < base.spread);
        });

        it('fireRate 不应该小于 1', () => {
            const stats = getWeaponStats('VULCAN', 100);
            assert.ok(stats.fireRate >= 1);
        });
    });
});
