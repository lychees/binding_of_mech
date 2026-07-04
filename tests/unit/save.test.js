import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupBrowserMocks, resetBrowserMocks } from '../helpers/mock-browser.js';
import {
    loadSave,
    saveGame,
    createDefaultSave,
    createDefaultMechBuild,
    createDefaultPartsInventory,
    migrateSave,
    addMoneyExp,
    upgradeCost,
    getMechStats
} from '../../data/save.js';

describe('存档系统', () => {
    beforeEach(() => {
        setupBrowserMocks();
        resetBrowserMocks();
    });

    describe('createDefaultSave', () => {
        it('应该创建包含默认金币 1000 的存档', () => {
            const save = createDefaultSave();
            assert.equal(save.money, 1000);
        });

        it('默认应该解锁所有武器', () => {
            const save = createDefaultSave();
            const weapons = save.weapons;
            assert.equal(weapons.VULCAN.unlocked, true);
            assert.equal(weapons.SHOTGUN.unlocked, true);
            assert.equal(weapons.CANNON.unlocked, true);
            assert.equal(weapons.LASER.unlocked, true);
            assert.equal(weapons.BEAM_SWORD.unlocked, true);
        });

        it('默认机甲应该装备火神炮和光束刀', () => {
            const save = createDefaultSave();
            assert.equal(save.mechBuild.weaponLeft.moduleId, 'W_VULCAN');
            assert.equal(save.mechBuild.weaponRight.moduleId, 'W_BEAM_SWORD');
        });

        it('默认应该拥有所有武器模块库存', () => {
            const save = createDefaultSave();
            const inv = save.partsInventory;
            assert.ok(inv.W_VULCAN);
            assert.ok(inv.W_SHOTGUN);
            assert.ok(inv.W_CANNON);
            assert.ok(inv.W_LASER);
            assert.ok(inv.W_BEAM_SWORD);
        });
    });

    describe('loadSave / saveGame', () => {
        it('没有存档时应该返回默认存档', () => {
            const save = loadSave();
            assert.equal(save.money, 1000);
        });

        it('应该能保存和读取自定义存档', () => {
            const save = createDefaultSave();
            save.money = 5000;
            saveGame(save);
            const loaded = loadSave();
            assert.equal(loaded.money, 5000);
        });
    });

    describe('migrateSave', () => {
        it('旧存档应该自动补全武器解锁', () => {
            const oldSave = {
                money: 100,
                exp: 0,
                level: 1,
                expToNext: 100,
                materials: 0,
                mechBuild: createDefaultMechBuild(),
                partsInventory: createDefaultPartsInventory(),
                researchedModules: ['C_STANDARD', 'H_STANDARD', 'A_STANDARD', 'L_STANDARD', 'CO_STANDARD', 'W_VULCAN'],
                blueprints: [],
                weapons: {
                    VULCAN: { unlocked: true, level: 1 },
                    SHOTGUN: { unlocked: false, level: 0 },
                    CANNON: { unlocked: false, level: 0 },
                    LASER: { unlocked: false, level: 0 },
                    BEAM_SWORD: { unlocked: false, level: 0 }
                }
            };
            const migrated = migrateSave(oldSave);
            assert.equal(migrated.weapons.SHOTGUN.unlocked, true);
            assert.equal(migrated.weapons.BEAM_SWORD.unlocked, true);
            assert.ok(migrated.researchedModules.includes('W_BEAM_SWORD'));
        });

        it('缺少 partsInventory 时应该补全所有模块', () => {
            const partialSave = {
                money: 100,
                mechBuild: createDefaultMechBuild(),
                researchedModules: ['W_VULCAN'],
                weapons: { VULCAN: { unlocked: true, level: 1 } }
            };
            const migrated = migrateSave(partialSave);
            assert.ok(migrated.partsInventory.W_BEAM_SWORD);
            assert.ok(migrated.partsInventory.W_LASER);
        });

        it('缺少 mechBuild 武器槽位时应该补全', () => {
            const partialSave = {
                money: 100,
                mechBuild: {
                    chassis: { moduleId: 'C_STANDARD', level: 1 }
                },
                researchedModules: ['W_VULCAN'],
                weapons: { VULCAN: { unlocked: true, level: 1 } }
            };
            const migrated = migrateSave(partialSave);
            assert.equal(migrated.mechBuild.weaponLeft.moduleId, 'W_VULCAN');
            assert.equal(migrated.mechBuild.weaponRight.moduleId, 'W_BEAM_SWORD');
        });
    });

    describe('addMoneyExp', () => {
        it('应该正确增加金币和经验', () => {
            const save = createDefaultSave();
            addMoneyExp(save, 500, 50, 30);
            assert.equal(save.money, 1500);
            assert.equal(save.exp, 50);
            assert.equal(save.materials, 30);
        });

        it('经验满时应该升级', () => {
            const save = createDefaultSave();
            addMoneyExp(save, 0, 150, 0);
            assert.equal(save.level, 2);
            assert.equal(save.exp, 50);
            assert.equal(save.expToNext, 150);
        });
    });

    describe('upgradeCost', () => {
        it('升级花费应该随等级指数增长', () => {
            assert.equal(upgradeCost(100, 0), 100);
            assert.equal(upgradeCost(100, 1), 150);
            assert.equal(upgradeCost(100, 2), 225);
        });
    });

    describe('getMechStats', () => {
        it('应该根据旧版升级等级计算属性', () => {
            const save = createDefaultSave();
            save.mech.healthLevel = 5;
            save.mech.armorLevel = 3;
            save.mech.speedLevel = 2;
            save.mech.dashLevel = 4;
            const stats = getMechStats(save);
            assert.equal(stats.maxHealth, 200);
            assert.ok(Math.abs(stats.armor - 0.3) < 0.0001);
            assert.equal(stats.maxSpeed, 2.8);
            assert.equal(stats.dashCooldown, 40);
        });
    });
});
