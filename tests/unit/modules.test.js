import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    ALL_MODULES,
    MODULE_SLOTS,
    MODULE_RARITY,
    getModuleStats,
    calculateMechBuild,
    moduleUpgradeCost,
    moduleResearchCost,
    salvageModule
} from '../../js/modules.js';

describe('机甲模块系统', () => {
    describe('ALL_MODULES', () => {
        it('应该包含所有模块类型', () => {
            assert.ok(ALL_MODULES.C_STANDARD);
            assert.ok(ALL_MODULES.H_STANDARD);
            assert.ok(ALL_MODULES.A_STANDARD);
            assert.ok(ALL_MODULES.L_STANDARD);
            assert.ok(ALL_MODULES.CO_STANDARD);
            assert.ok(ALL_MODULES.W_VULCAN);
            assert.ok(ALL_MODULES.W_BEAM_SWORD);
        });

        it('每个模块应该有基本属性', () => {
            for (const id in ALL_MODULES) {
                const m = ALL_MODULES[id];
                assert.ok(m.id, `${id} 缺少 id`);
                assert.ok(m.name, `${id} 缺少 name`);
                assert.ok(m.slot, `${id} 缺少 slot`);
                assert.ok(m.rarity, `${id} 缺少 rarity`);
                assert.ok(m.description, `${id} 缺少 description`);
                assert.ok(m.stats, `${id} 缺少 stats`);
            }
        });

        it('稀有度应该在 MODULE_RARITY 中定义', () => {
            for (const id in ALL_MODULES) {
                const m = ALL_MODULES[id];
                assert.ok(MODULE_RARITY[m.rarity], `${id} 的稀有度 ${m.rarity} 未定义`);
            }
        });

        it('武器模块应该关联 weaponKey', () => {
            assert.equal(ALL_MODULES.W_VULCAN.weaponKey, 'VULCAN');
            assert.equal(ALL_MODULES.W_BEAM_SWORD.weaponKey, 'BEAM_SWORD');
        });
    });

    describe('MODULE_SLOTS', () => {
        it('应该包含所有槽位常量', () => {
            assert.equal(MODULE_SLOTS.CHASSIS, 'chassis');
            assert.equal(MODULE_SLOTS.WEAPON_LEFT, 'weaponLeft');
            assert.equal(MODULE_SLOTS.WEAPON_RIGHT, 'weaponRight');
        });
    });

    describe('getModuleStats', () => {
        it('等级 1 时应该返回基础属性', () => {
            const stats = getModuleStats('C_STANDARD', 1);
            assert.equal(stats.maxHealth, 100);
            assert.equal(stats.maxEnergy, 100);
            assert.equal(stats.weight, 20);
        });

        it('高等级应该提升属性', () => {
            const stats = getModuleStats('C_STANDARD', 5);
            assert.ok(stats.maxHealth > 100);
            assert.equal(stats.weight, 20);
        });

        it('装甲类属性应该按百分比提升', () => {
            const stats = getModuleStats('C_HEAVY', 1);
            assert.equal(stats.armor, 0.15);
            const stats5 = getModuleStats('C_HEAVY', 5);
            assert.ok(stats5.armor > 0.15);
        });
    });

    describe('calculateMechBuild', () => {
        it('默认构建应该有合理的基础属性', () => {
            const build = {
                chassis: { moduleId: 'C_STANDARD', level: 1 },
                head: { moduleId: 'H_STANDARD', level: 1 },
                arms: { moduleId: 'A_STANDARD', level: 1 },
                legs: { moduleId: 'L_STANDARD', level: 1 },
                core: { moduleId: 'CO_STANDARD', level: 1 },
                weaponLeft: { moduleId: 'W_VULCAN', level: 1 },
                weaponRight: { moduleId: 'W_BEAM_SWORD', level: 1 }
            };
            const result = calculateMechBuild(build);
            assert.ok(result.maxHealth > 0);
            assert.ok(result.maxEnergy > 0);
            assert.ok(result.maxSpeed > 0);
            assert.equal(result.weapons.length, 2);
            assert.deepEqual(result.weapons, ['VULCAN', 'BEAM_SWORD']);
        });

        it('空构建应该使用兜底属性', () => {
            const result = calculateMechBuild({});
            assert.ok(result.maxHealth >= 50);
            assert.ok(result.maxEnergy >= 50);
            assert.ok(result.maxSpeed >= 1.5);
        });

        it('超重应该导致速度和血量惩罚', () => {
            const build = {
                chassis: { moduleId: 'C_HEAVY', level: 1 },
                head: { moduleId: 'H_STANDARD', level: 1 },
                arms: { moduleId: 'A_STANDARD', level: 1 },
                legs: { moduleId: 'L_HEAVY', level: 1 },
                core: { moduleId: 'CO_STANDARD', level: 1 },
                weaponLeft: { moduleId: 'W_CANNON', level: 1 },
                weaponRight: { moduleId: 'W_CANNON', level: 1 }
            };
            const result = calculateMechBuild(build);
            // C_HEAVY 35 + H 5 + A 8 + L_HEAVY 18 + CO 8 + W_CANNON 15*2 = 104
            // maxEnergy = 80, maxWeight = 64, 超重
            assert.ok(result.totalWeight > result.maxEnergy * 0.8);
            assert.ok(result.maxSpeed < 2.5);
        });
    });

    describe('moduleUpgradeCost', () => {
        it('等级越高升级越贵', () => {
            const c1 = moduleUpgradeCost('W_BEAM_SWORD', 1);
            const c5 = moduleUpgradeCost('W_BEAM_SWORD', 5);
            assert.ok(c5 > c1);
            assert.ok(c1 > 0);
        });
    });

    describe('moduleResearchCost', () => {
        it('史诗模块研究应该更贵', () => {
            const common = moduleResearchCost('W_VULCAN');
            const epic = moduleResearchCost('W_BEAM_SWORD');
            assert.ok(epic > common);
        });
    });

    describe('salvageModule', () => {
        it('拆解应该返还材料', () => {
            const materials = salvageModule('W_VULCAN', 1);
            assert.equal(materials, 0);
            const materialsEpic = salvageModule('W_BEAM_SWORD', 1);
            assert.ok(materialsEpic > 0);
        });
    });
});
