import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    BLUEPRINT_TIERS,
    BLUEPRINT_DROPS,
    getManufactureCost,
    getBlueprintResearchCost,
    rollBlueprintDrops
} from '../../js/blueprints.js';

describe('蓝图系统', () => {
    describe('BLUEPRINT_TIERS', () => {
        it('应该包含所有稀有度等级', () => {
            assert.ok(BLUEPRINT_TIERS.COMMON);
            assert.ok(BLUEPRINT_TIERS.LEGENDARY);
        });

        it('稀有度越高，材料和研发成本应该越高', () => {
            assert.ok(BLUEPRINT_TIERS.LEGENDARY.materialCost > BLUEPRINT_TIERS.COMMON.materialCost);
        });
    });

    describe('BLUEPRINT_DROPS', () => {
        it('起始模块应该有 starting 标记', () => {
            assert.equal(BLUEPRINT_DROPS.C_STANDARD.starting, true);
            assert.equal(BLUEPRINT_DROPS.W_VULCAN.starting, true);
        });

        it('高级模块应该有最小关卡要求', () => {
            assert.ok(BLUEPRINT_DROPS.W_LASER.minLevel > 1);
            assert.ok(BLUEPRINT_DROPS.W_BEAM_SWORD.minLevel > 1);
        });
    });

    describe('getManufactureCost', () => {
        it('起始模块制造应该花费', () => {
            const cost = getManufactureCost('W_VULCAN');
            assert.ok(cost);
            assert.ok(cost.materials >= 0);
            assert.ok(cost.money >= 0);
        });

        it('史诗模块制造应该更贵', () => {
            const common = getManufactureCost('W_VULCAN');
            const epic = getManufactureCost('W_BEAM_SWORD');
            assert.ok(epic.materials > common.materials);
            assert.ok(epic.money > common.money);
        });

        it('未知模块应该返回 null', () => {
            assert.equal(getManufactureCost('UNKNOWN'), null);
        });
    });

    describe('getBlueprintResearchCost', () => {
        it('研究成本应该符合稀有度', () => {
            const common = getBlueprintResearchCost('W_VULCAN');
            const legendary = getBlueprintResearchCost('CO_OVERDRIVE');
            assert.ok(legendary.money > common.money);
        });
    });

    describe('rollBlueprintDrops', () => {
        it('低等级关卡不应该掉落高等级蓝图', () => {
            for (let i = 0; i < 50; i++) {
                const drops = rollBlueprintDrops(1);
                assert.ok(!drops.includes('W_BEAM_SWORD'), '第一关不应该掉落光束刀蓝图');
                assert.ok(!drops.includes('CO_OVERDRIVE'), '第一关不应该掉落超载核心蓝图');
            }
        });

        it('掉落结果应该是模块 ID 数组', () => {
            const drops = rollBlueprintDrops(5);
            assert.ok(Array.isArray(drops));
            for (const id of drops) {
                assert.ok(typeof id === 'string');
                assert.ok(BLUEPRINT_DROPS[id], `${id} 不在掉落表中`);
            }
        });

        it('高等级关卡应该有更高概率掉落', () => {
            let countLow = 0;
            let countHigh = 0;
            for (let i = 0; i < 100; i++) {
                countLow += rollBlueprintDrops(1).length;
                countHigh += rollBlueprintDrops(10).length;
            }
            assert.ok(countHigh >= countLow, '高等级关卡平均掉落数不应少于低等级');
        });
    });
});
