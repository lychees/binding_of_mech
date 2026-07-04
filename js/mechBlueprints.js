// 玩家机甲蓝图系统：可在研发中心花钱解锁新的机体框架

import { createDefaultMechInventory } from './inventory.js?v=2';

export const MECH_BLUEPRINTS = {
    MB_STANDARD: {
        id: 'MB_STANDARD',
        name: '标准框架',
        description: '均衡的通用机甲框架，适合新手驾驶员。',
        tier: 'COMMON',
        cost: 0,
        starting: true,
        color: '#00d4ff',
        mechBuild: {
            chassis: { moduleId: 'C_STANDARD', level: 1 },
            head: { moduleId: 'H_STANDARD', level: 1 },
            arms: { moduleId: 'A_STANDARD', level: 1 },
            legs: { moduleId: 'L_STANDARD', level: 1 },
            core: { moduleId: 'CO_STANDARD', level: 1 },
            weaponLeft: { moduleId: 'W_VULCAN', level: 1 },
            weaponRight: { moduleId: 'W_BEAM_SWORD', level: 1 }
        }
    },
    MB_ASSAULT: {
        id: 'MB_ASSAULT',
        name: '突击框架',
        description: '强化了近距离交战能力的机体，机动性与火力兼备。',
        tier: 'UNCOMMON',
        cost: 1500,
        color: '#ff6644',
        mechBuild: {
            chassis: { moduleId: 'C_ASSAULT', level: 1 },
            head: { moduleId: 'H_STANDARD', level: 1 },
            arms: { moduleId: 'A_POWER', level: 1 },
            legs: { moduleId: 'L_SPEED', level: 1 },
            core: { moduleId: 'CO_STANDARD', level: 1 },
            weaponLeft: { moduleId: 'W_SHOTGUN', level: 1 },
            weaponRight: { moduleId: 'W_BEAM_SWORD', level: 1 }
        }
    },
    MB_SNIPER: {
        id: 'MB_SNIPER',
        name: '狙击框架',
        description: '长距离精准射击特化，配备高精度传感器。',
        tier: 'UNCOMMON',
        cost: 1800,
        color: '#ff88cc',
        mechBuild: {
            chassis: { moduleId: 'C_LIGHT', level: 1 },
            head: { moduleId: 'H_SNIPER', level: 1 },
            arms: { moduleId: 'A_STANDARD', level: 1 },
            legs: { moduleId: 'L_STANDARD', level: 1 },
            core: { moduleId: 'CO_STANDARD', level: 1 },
            weaponLeft: { moduleId: 'W_LASER', level: 1 },
            weaponRight: { moduleId: 'W_VULCAN', level: 1 }
        }
    },
    MB_FORTRESS: {
        id: 'MB_FORTRESS',
        name: '要塞框架',
        description: '重型装甲平台，牺牲机动性换取极强的生存能力。',
        tier: 'RARE',
        cost: 3500,
        color: '#aa4444',
        mechBuild: {
            chassis: { moduleId: 'C_HEAVY', level: 1 },
            head: { moduleId: 'H_STANDARD', level: 1 },
            arms: { moduleId: 'A_POWER', level: 1 },
            legs: { moduleId: 'L_HEAVY', level: 1 },
            core: { moduleId: 'CO_SHIELD', level: 1 },
            weaponLeft: { moduleId: 'W_CANNON', level: 1 },
            weaponRight: { moduleId: 'W_BEAM_SWORD', level: 1 }
        }
    },
    MB_SUPPORT: {
        id: 'MB_SUPPORT',
        name: '支援框架',
        description: '搭载修复核心和电子战设备，适合持续作战。',
        tier: 'RARE',
        cost: 3200,
        color: '#44ff88',
        mechBuild: {
            chassis: { moduleId: 'C_STANDARD', level: 1 },
            head: { moduleId: 'H_EWAR', level: 1 },
            arms: { moduleId: 'A_RAPID', level: 1 },
            legs: { moduleId: 'L_STANDARD', level: 1 },
            core: { moduleId: 'CO_REPAIR', level: 1 },
            weaponLeft: { moduleId: 'W_VULCAN', level: 1 },
            weaponRight: { moduleId: 'W_LASER', level: 1 }
        }
    },
    MB_STRIKER: {
        id: 'MB_STRIKER',
        name: '强袭框架',
        description: '极限速度特化，如闪电般穿插战场。',
        tier: 'RARE',
        cost: 3800,
        color: '#ffaa00',
        mechBuild: {
            chassis: { moduleId: 'C_LIGHT', level: 1 },
            head: { moduleId: 'H_STANDARD', level: 1 },
            arms: { moduleId: 'A_RAPID', level: 1 },
            legs: { moduleId: 'L_SPEED', level: 1 },
            core: { moduleId: 'CO_OVERDRIVE', level: 1 },
            weaponLeft: { moduleId: 'W_VULCAN', level: 1 },
            weaponRight: { moduleId: 'W_BEAM_SWORD', level: 1 }
        }
    },
    MB_TITAN: {
        id: 'MB_TITAN',
        name: '泰坦框架',
        description: '传说级重型机甲，攻防一体，正面战场的绝对主宰。',
        tier: 'LEGENDARY',
        cost: 8000,
        color: '#ffaa00',
        mechBuild: {
            chassis: { moduleId: 'C_ASSAULT', level: 2 },
            head: { moduleId: 'H_EWAR', level: 1 },
            arms: { moduleId: 'A_POWER', level: 2 },
            legs: { moduleId: 'L_HEAVY', level: 2 },
            core: { moduleId: 'CO_OVERDRIVE', level: 1 },
            weaponLeft: { moduleId: 'W_CANNON', level: 1 },
            weaponRight: { moduleId: 'W_BEAM_SWORD', level: 2 }
        }
    }
};

export const MECH_BLUEPRINT_TIERS = {
    COMMON: { name: '普通', color: '#aaaaaa' },
    UNCOMMON: { name: '精良', color: '#44ff44' },
    RARE: { name: '稀有', color: '#4444ff' },
    EPIC: { name: '史诗', color: '#aa44ff' },
    LEGENDARY: { name: '传说', color: '#ffaa00' }
};

export function getMechBlueprint(id) {
    return MECH_BLUEPRINTS[id] || null;
}

export function getAllMechBlueprints() {
    return Object.values(MECH_BLUEPRINTS);
}

export function generateMechId() {
    return `mech_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

export function createMechFromBlueprint(blueprintId, name = null) {
    const bp = getMechBlueprint(blueprintId);
    if (!bp) return null;
    return {
        id: generateMechId(),
        blueprintId,
        name: name || bp.name,
        mechBuild: JSON.parse(JSON.stringify(bp.mechBuild)),
        mechInventory: createDefaultMechInventory().toJSON(),
        color: bp.color
    };
}

export function createDefaultPlayerMech() {
    return createMechFromBlueprint('MB_STANDARD', '标准机甲');
}

export function isMechBlueprintUnlocked(save, blueprintId) {
    const bp = getMechBlueprint(blueprintId);
    if (!bp) return false;
    if (bp.starting) return true;
    return save.mechBlueprintsUnlocked?.includes(blueprintId) || false;
}

export function unlockMechBlueprint(save, blueprintId) {
    const bp = getMechBlueprint(blueprintId);
    if (!bp || bp.starting) return { success: false, reason: '无需解锁' };
    if (isMechBlueprintUnlocked(save, blueprintId)) return { success: false, reason: '已解锁' };
    if (save.money < bp.cost) return { success: false, reason: '金币不足' };
    save.money -= bp.cost;
    if (!save.mechBlueprintsUnlocked) save.mechBlueprintsUnlocked = [];
    save.mechBlueprintsUnlocked.push(blueprintId);
    return { success: true };
}

export function buyMechFromBlueprint(save, blueprintId) {
    const bp = getMechBlueprint(blueprintId);
    if (!bp) return { success: false, reason: '未知蓝图' };
    if (!isMechBlueprintUnlocked(save, blueprintId)) return { success: false, reason: '蓝图未解锁' };
    const alreadyOwned = save.mechs.some(m => m.blueprintId === blueprintId);
    if (alreadyOwned) return { success: false, reason: '已拥有同类型机甲' };
    const mech = createMechFromBlueprint(blueprintId);
    save.mechs.push(mech);
    return { success: true, mech };
}
