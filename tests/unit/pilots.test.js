import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
    createPilot,
    addPilotExp,
    calculatePilotStats,
    getPilotDisplayInfo,
    getRecruitCost,
    PILOT_TEMPLATES
} from '../../js/pilots.js';
import {
    createDefaultPlayerMech,
    createPlayerMechFromTemplate,
    checkEnemyMechUnlock,
    recordEnemyKill,
    buyEnemyMech,
    getEnemyMechUnlockProgress
} from '../../js/enemyMechs.js';

describe('驾驶员系统', () => {
    it('应该创建默认新兵驾驶员', () => {
        const pilot = createPilot('rookie', '测试员');
        assert.strictEqual(pilot.templateId, 'rookie');
        assert.strictEqual(pilot.name, '测试员');
        assert.strictEqual(pilot.level, 1);
    });

    it('升级后属性应该成长', () => {
        const pilot = createPilot('ace');
        addPilotExp(pilot, 500);
        assert.ok(pilot.level > 1, '驾驶员应该升级');
        const stats = calculatePilotStats(pilot);
        assert.ok(stats.damage > PILOT_TEMPLATES.ace.baseStats.damage);
    });

    it('不同驾驶员模板应该有不同基础属性', () => {
        const rookie = calculatePilotStats(createPilot('rookie'));
        const sniper = calculatePilotStats(createPilot('sniper'));
        assert.ok(sniper.aimBonus > rookie.aimBonus);
        assert.ok(sniper.damage > rookie.damage);
    });

    it('王牌驾驶员天赋应该提供伤害加成', () => {
        const pilot = createPilot('ace');
        const stats = calculatePilotStats(pilot);
        assert.ok(stats.damageBonus > 0);
    });

    it('getPilotDisplayInfo 应该包含完整信息', () => {
        const pilot = createPilot('engineer');
        const info = getPilotDisplayInfo(pilot);
        assert.ok(info.templateName);
        assert.ok(info.talent);
        assert.ok(info.stats);
        assert.strictEqual(info.color, PILOT_TEMPLATES.engineer.color);
    });

    it('招募价格应该符合稀有度', () => {
        assert.ok(getRecruitCost('rookie') < getRecruitCost('ace'));
    });
});

describe('敌方机甲回收系统', () => {
    it('应该创建默认玩家机甲', () => {
        const mech = createDefaultPlayerMech();
        assert.ok(mech.id);
        assert.ok(mech.mechBuild.chassis);
    });

    it('应该从模板创建机甲', () => {
        const mech = createPlayerMechFromTemplate('EM_HEAVY');
        assert.ok(mech);
        assert.strictEqual(mech.templateId, 'EM_HEAVY');
        assert.strictEqual(mech.mechBuild.chassis.moduleId, 'C_HEAVY');
    });

    it('击败敌人应该记录击杀', () => {
        const save = { enemyKillRecord: {}, enemyMechsUnlocked: [] };
        recordEnemyKill(save, 'heavy');
        assert.strictEqual(save.enemyKillRecord.heavy, 1);
    });

    it('满足击杀条件后应该自动解锁', () => {
        const save = { enemyKillRecord: { heavy: 5 }, enemyMechsUnlocked: [] };
        recordEnemyKill(save, 'heavy');
        assert.ok(save.enemyMechsUnlocked.includes('EM_HEAVY'));
    });

    it('checkEnemyMechUnlock 应该正确判断', () => {
        const save = { enemyKillRecord: { scout: 3 }, enemyMechsUnlocked: [] };
        assert.strictEqual(checkEnemyMechUnlock(save, 'EM_SCOUT'), false);
        save.enemyKillRecord.scout = 5;
        assert.strictEqual(checkEnemyMechUnlock(save, 'EM_SCOUT'), true);
    });

    it('购买敌方机甲需要金币并加入机甲列表', () => {
        const save = {
            money: 3000,
            enemyMechsUnlocked: ['EM_HEAVY'],
            mechs: [createDefaultPlayerMech()]
        };
        const result = buyEnemyMech(save, 'EM_HEAVY');
        assert.strictEqual(result.success, true);
        assert.strictEqual(save.mechs.length, 2);
        assert.ok(save.money < 3000);
    });

    it('未解锁的敌方机甲不能购买', () => {
        const save = {
            money: 3000,
            enemyMechsUnlocked: [],
            mechs: []
        };
        const result = buyEnemyMech(save, 'EM_HEAVY');
        assert.strictEqual(result.success, false);
    });

    it('解锁进度应该正确计算', () => {
        const save = { enemyKillRecord: { sniper: 2 } };
        const progress = getEnemyMechUnlockProgress(save, 'EM_SNIPER');
        assert.strictEqual(progress.totalRequired, 5);
        assert.strictEqual(progress.totalCurrent, 2);
        assert.strictEqual(progress.ratio, 0.4);
    });
});
