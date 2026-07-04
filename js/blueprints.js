// 蓝图系统 - 玩家可以通过收集/研究蓝图来解锁和制造高级模块

export const BLUEPRINT_TIERS = {
    COMMON: { name: '普通', color: '#aaaaaa', researchTime: 1, materialCost: 10 },
    UNCOMMON: { name: '精良', color: '#44ff44', researchTime: 2, materialCost: 25 },
    RARE: { name: '稀有', color: '#4444ff', researchTime: 3, materialCost: 60 },
    EPIC: { name: '史诗', color: '#aa44ff', researchTime: 5, materialCost: 150 },
    LEGENDARY: { name: '传说', color: '#ffaa00', researchTime: 8, materialCost: 400 }
};

// 蓝图掉落表：任务完成后有概率获得对应模块的蓝图
export const BLUEPRINT_DROPS = {
    C_STANDARD: { dropChance: 0, starting: true },
    C_HEAVY: { dropChance: 0.15, minLevel: 1 },
    C_LIGHT: { dropChance: 0.15, minLevel: 1 },
    C_ASSAULT: { dropChance: 0.08, minLevel: 3 },
    H_STANDARD: { dropChance: 0, starting: true },
    H_SNIPER: { dropChance: 0.12, minLevel: 1 },
    H_EWAR: { dropChance: 0.08, minLevel: 2 },
    A_STANDARD: { dropChance: 0, starting: true },
    A_POWER: { dropChance: 0.14, minLevel: 1 },
    A_RAPID: { dropChance: 0.14, minLevel: 1 },
    L_STANDARD: { dropChance: 0, starting: true },
    L_SPEED: { dropChance: 0.13, minLevel: 1 },
    L_HEAVY: { dropChance: 0.08, minLevel: 2 },
    CO_STANDARD: { dropChance: 0, starting: true },
    CO_SHIELD: { dropChance: 0.07, minLevel: 2 },
    CO_REPAIR: { dropChance: 0.05, minLevel: 4 },
    CO_OVERDRIVE: { dropChance: 0.03, minLevel: 5 },
    W_VULCAN: { dropChance: 0, starting: true },
    W_SHOTGUN: { dropChance: 0.18, minLevel: 1 },
    W_CANNON: { dropChance: 0.1, minLevel: 2 },
    W_LASER: { dropChance: 0.08, minLevel: 3 },
    W_BEAM_SWORD: { dropChance: 0.05, minLevel: 4 }
};

// 制造一个模块需要的材料和金钱
export function getManufactureCost(moduleId) {
    const drops = BLUEPRINT_DROPS[moduleId];
    if (!drops) return null;
    const tier = getTierFromModule(moduleId);
    const tierData = BLUEPRINT_TIERS[tier];
    return {
        materials: tierData.materialCost,
        money: Math.floor(tierData.materialCost * 2.5)
    };
}

function getTierFromModule(moduleId) {
    // 从 ALL_MODULES 中读取 rarity 需要传入，这里通过简单映射
    const rarityMap = {
        C_STANDARD: 'COMMON', C_HEAVY: 'UNCOMMON', C_LIGHT: 'UNCOMMON', C_ASSAULT: 'RARE',
        H_STANDARD: 'COMMON', H_SNIPER: 'UNCOMMON', H_EWAR: 'RARE',
        A_STANDARD: 'COMMON', A_POWER: 'UNCOMMON', A_RAPID: 'UNCOMMON',
        L_STANDARD: 'COMMON', L_SPEED: 'UNCOMMON', L_HEAVY: 'RARE',
        CO_STANDARD: 'COMMON', CO_SHIELD: 'RARE', CO_REPAIR: 'EPIC', CO_OVERDRIVE: 'LEGENDARY',
        W_VULCAN: 'COMMON', W_SHOTGUN: 'UNCOMMON', W_CANNON: 'RARE', W_LASER: 'RARE', W_BEAM_SWORD: 'EPIC'
    };
    return rarityMap[moduleId] || 'COMMON';
}

// 根据关卡计算蓝图掉落
export function rollBlueprintDrops(levelId) {
    const drops = [];
    for (const moduleId in BLUEPRINT_DROPS) {
        const drop = BLUEPRINT_DROPS[moduleId];
        if (drop.starting) continue;
        if (levelId < (drop.minLevel || 1)) continue;
        const chance = drop.dropChance * (1 + levelId * 0.05);
        if (Math.random() < chance) {
            drops.push(moduleId);
        }
    }
    return drops;
}

// 计算研究蓝图的花费（金钱+材料）
export function getBlueprintResearchCost(moduleId) {
    const tier = getTierFromModule(moduleId);
    const tierData = BLUEPRINT_TIERS[tier];
    return {
        money: Math.floor(tierData.materialCost * 5),
        materials: Math.floor(tierData.materialCost * 0.5)
    };
}
