// 敌方机甲回收系统

import { createDefaultMechInventory } from './inventory.js';

export const ENEMY_MECH_TEMPLATES = {
    EM_SCOUT: {
        id: 'EM_SCOUT',
        name: '侦察型机甲',
        description: '敌方轻型侦察机甲，拥有极高机动性。',
        color: '#ff6644',
        cost: 1200,
        requiredKills: { scout: 5 },
        dropChance: 0.12,
        mechBuild: {
            chassis: { moduleId: 'C_LIGHT', level: 1 },
            head: { moduleId: 'H_STANDARD', level: 1 },
            arms: { moduleId: 'A_RAPID', level: 1 },
            legs: { moduleId: 'L_SPEED', level: 1 },
            core: { moduleId: 'CO_STANDARD', level: 1 },
            weaponLeft: { moduleId: 'W_VULCAN', level: 1 },
            weaponRight: { moduleId: 'W_VULCAN', level: 1 }
        },
        unlockHint: '击败侦察兵 5 次'
    },
    EM_SOLDIER: {
        id: 'EM_SOLDIER',
        name: '量产型机甲',
        description: '敌方标准量产机甲，性能均衡。',
        color: '#ff4444',
        cost: 800,
        requiredKills: { soldier: 5 },
        dropChance: 0.1,
        mechBuild: {
            chassis: { moduleId: 'C_STANDARD', level: 1 },
            head: { moduleId: 'H_STANDARD', level: 1 },
            arms: { moduleId: 'A_STANDARD', level: 1 },
            legs: { moduleId: 'L_STANDARD', level: 1 },
            core: { moduleId: 'CO_STANDARD', level: 1 },
            weaponLeft: { moduleId: 'W_VULCAN', level: 1 },
            weaponRight: { moduleId: 'W_SHOTGUN', level: 1 }
        },
        unlockHint: '击败步兵 5 次'
    },
    EM_HEAVY: {
        id: 'EM_HEAVY',
        name: '重型机甲',
        description: '敌方重装单位改装的机甲，血厚甲高。',
        color: '#aa4444',
        cost: 2500,
        requiredKills: { heavy: 5 },
        dropChance: 0.08,
        mechBuild: {
            chassis: { moduleId: 'C_HEAVY', level: 2 },
            head: { moduleId: 'H_STANDARD', level: 1 },
            arms: { moduleId: 'A_POWER', level: 2 },
            legs: { moduleId: 'L_HEAVY', level: 1 },
            core: { moduleId: 'CO_SHIELD', level: 1 },
            weaponLeft: { moduleId: 'W_CANNON', level: 1 },
            weaponRight: { moduleId: 'W_BEAM_SWORD', level: 1 }
        },
        unlockHint: '击败重装兵 5 次'
    },
    EM_SNIPER: {
        id: 'EM_SNIPER',
        name: '狙击型机甲',
        description: '敌方狙击手使用的远程精准机甲。',
        color: '#ff88cc',
        cost: 2200,
        requiredKills: { sniper: 5 },
        dropChance: 0.08,
        mechBuild: {
            chassis: { moduleId: 'C_LIGHT', level: 1 },
            head: { moduleId: 'H_SNIPER', level: 2 },
            arms: { moduleId: 'A_STANDARD', level: 1 },
            legs: { moduleId: 'L_STANDARD', level: 1 },
            core: { moduleId: 'CO_STANDARD', level: 1 },
            weaponLeft: { moduleId: 'W_LASER', level: 2 },
            weaponRight: { moduleId: 'W_VULCAN', level: 1 }
        },
        unlockHint: '击败狙击手 5 次'
    },
    EM_SHOTGUN: {
        id: 'EM_SHOTGUN',
        name: '霰弹型机甲',
        description: '近距离高爆发机体，适合突击。',
        color: '#ffaa44',
        cost: 1800,
        requiredKills: { shotgunner: 5 },
        dropChance: 0.09,
        mechBuild: {
            chassis: { moduleId: 'C_ASSAULT', level: 1 },
            head: { moduleId: 'H_STANDARD', level: 1 },
            arms: { moduleId: 'A_POWER', level: 1 },
            legs: { moduleId: 'L_SPEED', level: 1 },
            core: { moduleId: 'CO_STANDARD', level: 1 },
            weaponLeft: { moduleId: 'W_SHOTGUN', level: 2 },
            weaponRight: { moduleId: 'W_BEAM_SWORD', level: 1 }
        },
        unlockHint: '击败霰弹手 5 次'
    },
    EM_MEDIC: {
        id: 'EM_MEDIC',
        name: '支援型机甲',
        description: '敌方医疗兵改装的支援机体，修复性能优秀。',
        color: '#44ff88',
        cost: 1600,
        requiredKills: { medic: 5 },
        dropChance: 0.1,
        mechBuild: {
            chassis: { moduleId: 'C_STANDARD', level: 1 },
            head: { moduleId: 'H_EWAR', level: 1 },
            arms: { moduleId: 'A_STANDARD', level: 1 },
            legs: { moduleId: 'L_STANDARD', level: 1 },
            core: { moduleId: 'CO_REPAIR', level: 1 },
            weaponLeft: { moduleId: 'W_VULCAN', level: 1 },
            weaponRight: { moduleId: 'W_LASER', level: 1 }
        },
        unlockHint: '击败医疗兵 5 次'
    }
};

export function getEnemyMechTemplate(id) {
    return ENEMY_MECH_TEMPLATES[id] || null;
}

export function getAllEnemyMechTemplates() {
    return Object.values(ENEMY_MECH_TEMPLATES);
}

export function generateMechId() {
    return `mech_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

export function createPlayerMechFromTemplate(templateId, name = null) {
    const template = getEnemyMechTemplate(templateId);
    if (!template) return null;
    return {
        id: generateMechId(),
        templateId,
        name: name || template.name,
        mechBuild: JSON.parse(JSON.stringify(template.mechBuild)),
        mechInventory: createDefaultMechInventory().toJSON(),
        color: template.color
    };
}

export function createDefaultPlayerMech() {
    return {
        id: generateMechId(),
        templateId: null,
        name: '标准机甲',
        mechBuild: {
            chassis: { moduleId: 'C_STANDARD', level: 1 },
            head: { moduleId: 'H_STANDARD', level: 1 },
            arms: { moduleId: 'A_STANDARD', level: 1 },
            legs: { moduleId: 'L_STANDARD', level: 1 },
            core: { moduleId: 'CO_STANDARD', level: 1 },
            weaponLeft: { moduleId: 'W_VULCAN', level: 1 },
            weaponRight: { moduleId: 'W_BEAM_SWORD', level: 1 }
        },
        mechInventory: createDefaultMechInventory().toJSON(),
        color: '#00d4ff'
    };
}

export function checkEnemyMechUnlock(save, templateId) {
    const template = getEnemyMechTemplate(templateId);
    if (!template) return false;
    if (save.enemyMechsUnlocked?.includes(templateId)) return true;

    const killRecord = save.enemyKillRecord || {};
    for (const enemyType in template.requiredKills) {
        const required = template.requiredKills[enemyType];
        const killed = killRecord[enemyType] || 0;
        if (killed < required) return false;
    }
    return true;
}

export function recordEnemyKill(save, enemyType) {
    if (!save.enemyKillRecord) save.enemyKillRecord = {};
    save.enemyKillRecord[enemyType] = (save.enemyKillRecord[enemyType] || 0) + 1;

    // 自动解锁满足条件的敌方机甲
    if (!save.enemyMechsUnlocked) save.enemyMechsUnlocked = [];
    for (const id in ENEMY_MECH_TEMPLATES) {
        if (save.enemyMechsUnlocked.includes(id)) continue;
        if (checkEnemyMechUnlock(save, id)) {
            save.enemyMechsUnlocked.push(id);
        }
    }
}

export function getEnemyMechUnlockProgress(save, templateId) {
    const template = getEnemyMechTemplate(templateId);
    if (!template) return null;
    const killRecord = save.enemyKillRecord || {};
    const entries = Object.entries(template.requiredKills);
    const progress = entries.map(([type, required]) => ({
        type,
        required,
        current: killRecord[type] || 0
    }));
    const totalRequired = entries.reduce((sum, [, r]) => sum + r, 0);
    const totalCurrent = progress.reduce((sum, p) => sum + p.current, 0);
    return { progress, totalRequired, totalCurrent, ratio: Math.min(1, totalCurrent / totalRequired) };
}

export function buyEnemyMech(save, templateId) {
    const template = getEnemyMechTemplate(templateId);
    if (!template) return { success: false, reason: '未知机体' };
    if (!save.enemyMechsUnlocked?.includes(templateId)) {
        return { success: false, reason: '尚未解锁' };
    }
    if (save.money < template.cost) {
        return { success: false, reason: '金币不足' };
    }
    save.money -= template.cost;
    const mech = createPlayerMechFromTemplate(templateId);
    save.mechs.push(mech);
    return { success: true, mech };
}

export function getEnemyMechDropChance(enemyType) {
    for (const id in ENEMY_MECH_TEMPLATES) {
        const template = ENEMY_MECH_TEMPLATES[id];
        if (template.requiredKills[enemyType]) {
            return template.dropChance;
        }
    }
    return 0;
}
