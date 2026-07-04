// 机甲模块化组件定义
// 灵感来自钢铁与咆哮风格的机甲组装

export const MODULE_SLOTS = {
    CHASSIS: 'chassis',
    HEAD: 'head',
    ARMS: 'arms',
    LEGS: 'legs',
    CORE: 'core',
    WEAPON_LEFT: 'weaponLeft',
    WEAPON_RIGHT: 'weaponRight'
};

export const MODULE_RARITY = {
    COMMON: { name: '普通', color: '#aaaaaa' },
    UNCOMMON: { name: '精良', color: '#44ff44' },
    RARE: { name: '稀有', color: '#4444ff' },
    EPIC: { name: '史诗', color: '#aa44ff' },
    LEGENDARY: { name: '传说', color: '#ffaa00' }
};

export const CHASSIS_MODULES = {
    C_STANDARD: {
        id: 'C_STANDARD',
        name: '标准型躯干',
        slot: 'chassis',
        rarity: 'COMMON',
        description: '均衡的机甲躯干，适合大多数任务。',
        stats: { maxHealth: 100, maxEnergy: 100, weight: 20, armor: 0 },
        cost: 0,
        level: 1,
        maxLevel: 5
    },
    C_HEAVY: {
        id: 'C_HEAVY',
        name: '重装型躯干',
        slot: 'chassis',
        rarity: 'UNCOMMON',
        description: '高血量高装甲，但消耗更多能量。',
        stats: { maxHealth: 150, maxEnergy: 80, weight: 35, armor: 0.15 },
        cost: 500,
        level: 1,
        maxLevel: 5
    },
    C_LIGHT: {
        id: 'C_LIGHT',
        name: '轻型躯干',
        slot: 'chassis',
        rarity: 'UNCOMMON',
        description: '牺牲血量换取高能量和机动性。',
        stats: { maxHealth: 70, maxEnergy: 130, weight: 12, armor: -0.05 },
        cost: 500,
        level: 1,
        maxLevel: 5
    },
    C_ASSAULT: {
        id: 'C_ASSAULT',
        name: '突击型躯干',
        slot: 'chassis',
        rarity: 'RARE',
        description: '为高强度战斗设计，拥有卓越的结构强度。',
        stats: { maxHealth: 180, maxEnergy: 110, weight: 30, armor: 0.1 },
        cost: 1200,
        level: 1,
        maxLevel: 5
    }
};

export const HEAD_MODULES = {
    H_STANDARD: {
        id: 'H_STANDARD',
        name: '标准传感器',
        slot: 'head',
        rarity: 'COMMON',
        description: '基础瞄准和探测系统。',
        stats: { aimBonus: 0, detectionRange: 0, cooldownReduction: 0, weight: 5 },
        cost: 0,
        level: 1,
        maxLevel: 5
    },
    H_SNIPER: {
        id: 'H_SNIPER',
        name: '狙击瞄准镜',
        slot: 'head',
        rarity: 'UNCOMMON',
        description: '提升武器精准度和射程。',
        stats: { aimBonus: 0.15, detectionRange: 100, cooldownReduction: 0, weight: 6 },
        cost: 400,
        level: 1,
        maxLevel: 5
    },
    H_EWAR: {
        id: 'H_EWAR',
        name: '电子战头部',
        slot: 'head',
        rarity: 'RARE',
        description: '减少技能冷却，提高探测范围。',
        stats: { aimBonus: 0, detectionRange: 150, cooldownReduction: 0.2, weight: 7 },
        cost: 1000,
        level: 1,
        maxLevel: 5
    }
};

export const ARMS_MODULES = {
    A_STANDARD: {
        id: 'A_STANDARD',
        name: '标准手臂',
        slot: 'arms',
        rarity: 'COMMON',
        description: '均衡的手臂单元。',
        stats: { damageBonus: 0, reloadSpeed: 1, meleeDamage: 10, weight: 8 },
        cost: 0,
        level: 1,
        maxLevel: 5
    },
    A_POWER: {
        id: 'A_POWER',
        name: '动力手臂',
        slot: 'arms',
        rarity: 'UNCOMMON',
        description: '提升武器伤害和近战威力。',
        stats: { damageBonus: 0.15, reloadSpeed: 1, meleeDamage: 20, weight: 12 },
        cost: 450,
        level: 1,
        maxLevel: 5
    },
    A_RAPID: {
        id: 'A_RAPID',
        name: '速射手臂',
        slot: 'arms',
        rarity: 'UNCOMMON',
        description: '提升射击速度，但略微降低单发伤害。',
        stats: { damageBonus: -0.05, reloadSpeed: 1.25, meleeDamage: 8, weight: 9 },
        cost: 450,
        level: 1,
        maxLevel: 5
    }
};

export const LEGS_MODULES = {
    L_STANDARD: {
        id: 'L_STANDARD',
        name: '标准腿部',
        slot: 'legs',
        rarity: 'COMMON',
        description: '标准二足步行单元。',
        stats: { maxSpeed: 2.5, turnSpeed: 1, dashCooldown: 60, weight: 10 },
        cost: 0,
        level: 1,
        maxLevel: 5
    },
    L_SPEED: {
        id: 'L_SPEED',
        name: '高速腿部',
        slot: 'legs',
        rarity: 'UNCOMMON',
        description: '提升移动速度，但降低转向性能。',
        stats: { maxSpeed: 3.2, turnSpeed: 0.85, dashCooldown: 50, weight: 9 },
        cost: 500,
        level: 1,
        maxLevel: 5
    },
    L_HEAVY: {
        id: 'L_HEAVY',
        name: '重型腿部',
        slot: 'legs',
        rarity: 'RARE',
        description: '稳定性和装甲增强，牺牲机动性。',
        stats: { maxSpeed: 2.0, turnSpeed: 0.8, dashCooldown: 75, weight: 18, armor: 0.05 },
        cost: 1100,
        level: 1,
        maxLevel: 5
    }
};

export const CORE_MODULES = {
    CO_STANDARD: {
        id: 'CO_STANDARD',
        name: '标准核心',
        slot: 'core',
        rarity: 'COMMON',
        description: '基础能量核心。',
        stats: { energyRegen: 1, shield: 0, repairRate: 0, weight: 8 },
        cost: 0,
        level: 1,
        maxLevel: 5
    },
    CO_SHIELD: {
        id: 'CO_SHIELD',
        name: '护盾核心',
        slot: 'core',
        rarity: 'RARE',
        description: '为机甲提供额外能量护盾。',
        stats: { energyRegen: 0.8, shield: 30, repairRate: 0, weight: 10 },
        cost: 1000,
        level: 1,
        maxLevel: 5
    },
    CO_REPAIR: {
        id: 'CO_REPAIR',
        name: '自动修复核心',
        slot: 'core',
        rarity: 'EPIC',
        description: '战斗中缓慢恢复生命值。',
        stats: { energyRegen: 0.9, shield: 0, repairRate: 0.5, weight: 12 },
        cost: 1800,
        level: 1,
        maxLevel: 5
    },
    CO_OVERDRIVE: {
        id: 'CO_OVERDRIVE',
        name: '超载核心',
        slot: 'core',
        rarity: 'LEGENDARY',
        description: '极大提升能量回复，但降低结构强度。',
        stats: { energyRegen: 2, shield: 0, repairRate: 0, weight: 10, maxHealth: -20 },
        cost: 3000,
        level: 1,
        maxLevel: 5
    }
};

export const WEAPON_MODULES = {
    W_VULCAN: {
        id: 'W_VULCAN',
        name: '火神炮模块',
        slot: 'weapon',
        rarity: 'COMMON',
        description: '高射速连发武器模块。',
        stats: { weight: 8 },
        weaponKey: 'VULCAN',
        cost: 0,
        level: 1,
        maxLevel: 10
    },
    W_SHOTGUN: {
        id: 'W_SHOTGUN',
        name: '霰弹枪模块',
        slot: 'weapon',
        rarity: 'UNCOMMON',
        description: '近距离高爆发武器。',
        stats: { weight: 10 },
        weaponKey: 'SHOTGUN',
        cost: 300,
        level: 1,
        maxLevel: 10
    },
    W_CANNON: {
        id: 'W_CANNON',
        name: '加农炮模块',
        slot: 'weapon',
        rarity: 'RARE',
        description: '高伤害单发武器。',
        stats: { weight: 15 },
        weaponKey: 'CANNON',
        cost: 800,
        level: 1,
        maxLevel: 10
    },
    W_LASER: {
        id: 'W_LASER',
        name: '激光炮模块',
        slot: 'weapon',
        rarity: 'RARE',
        description: '即时命中光束武器。',
        stats: { weight: 12 },
        weaponKey: 'LASER',
        cost: 1000,
        level: 1,
        maxLevel: 10
    },
    W_BEAM_SWORD: {
        id: 'W_BEAM_SWORD',
        name: '光束刀模块',
        slot: 'weapon',
        rarity: 'EPIC',
        description: '近战武器模块。',
        stats: { weight: 10 },
        weaponKey: 'BEAM_SWORD',
        cost: 1500,
        level: 1,
        maxLevel: 10
    }
};

export const ALL_MODULES = {
    ...CHASSIS_MODULES,
    ...HEAD_MODULES,
    ...ARMS_MODULES,
    ...LEGS_MODULES,
    ...CORE_MODULES,
    ...WEAPON_MODULES
};

export function getModuleStats(moduleId, level) {
    const m = ALL_MODULES[moduleId];
    if (!m) return null;
    const stats = {};
    for (const key in m.stats) {
        const base = m.stats[key];
        if (key === 'armor' || key === 'cooldownReduction') {
            stats[key] = base * (1 + (level - 1) * 0.2);
        } else if (key === 'weight') {
            stats[key] = base;
        } else if (key === 'maxHealth' && base < 0) {
            stats[key] = base * (1 + (level - 1) * 0.2);
        } else {
            stats[key] = base * (1 + (level - 1) * 0.15);
        }
    }
    return stats;
}

export function calculateMechBuild(mechBuild) {
    const result = {
        maxHealth: 0,
        maxEnergy: 0,
        armor: 0,
        maxSpeed: 0,
        turnSpeed: 0,
        dashCooldown: 60,
        damageBonus: 0,
        reloadSpeed: 1,
        meleeDamage: 0,
        aimBonus: 0,
        detectionRange: 0,
        cooldownReduction: 0,
        energyRegen: 0,
        shield: 0,
        repairRate: 0,
        totalWeight: 0,
        weapons: [],
        visualVariant: 'standard',
        visualColor: '#00d4ff',
        visualSecondaryColor: '#4a5568',
        coreColor: '#a0d0f0',
        visorShape: 'round',
        legStyle: 'biped',
        hasShoulderArmor: false,
        hasBackpack: false,
        antennaCount: 0,
        extraPlating: 0
    };

    const parts = [
        mechBuild.chassis,
        mechBuild.head,
        mechBuild.arms,
        mechBuild.legs,
        mechBuild.core,
        mechBuild.weaponLeft,
        mechBuild.weaponRight
    ];

    for (const part of parts) {
        if (!part || !part.moduleId) continue;
        const m = ALL_MODULES[part.moduleId];
        if (!m) continue;
        const stats = getModuleStats(part.moduleId, part.level || 1);
        result.totalWeight += stats.weight || 0;

        if (stats.maxHealth) result.maxHealth += stats.maxHealth;
        if (stats.maxEnergy) result.maxEnergy += stats.maxEnergy;
        if (stats.armor) result.armor += stats.armor;
        if (stats.maxSpeed) result.maxSpeed += stats.maxSpeed;
        if (stats.turnSpeed) result.turnSpeed += stats.turnSpeed;
        if (stats.dashCooldown) result.dashCooldown = stats.dashCooldown;
        if (stats.damageBonus) result.damageBonus += stats.damageBonus;
        if (stats.reloadSpeed) result.reloadSpeed *= stats.reloadSpeed;
        if (stats.meleeDamage) result.meleeDamage += stats.meleeDamage;
        if (stats.aimBonus) result.aimBonus += stats.aimBonus;
        if (stats.detectionRange) result.detectionRange += stats.detectionRange;
        if (stats.cooldownReduction) result.cooldownReduction += stats.cooldownReduction;
        if (stats.energyRegen) result.energyRegen += stats.energyRegen;
        if (stats.shield) result.shield += stats.shield;
        if (stats.repairRate) result.repairRate += stats.repairRate;

        if (m.weaponKey) {
            result.weapons.push(m.weaponKey);
        }
    }

    if (result.maxHealth <= 0) result.maxHealth = 50;
    if (result.maxEnergy <= 0) result.maxEnergy = 50;
    if (result.maxSpeed <= 0) result.maxSpeed = 1.5;
    if (result.armor < 0) result.armor = 0;
    if (result.armor > 0.8) result.armor = 0.8;
    if (result.dashCooldown < 15) result.dashCooldown = 15;

    const maxWeight = Math.max(50, result.maxEnergy * 0.8);
    if (result.totalWeight > maxWeight) {
        const penalty = (result.totalWeight - maxWeight) / maxWeight;
        result.maxSpeed *= Math.max(0.3, 1 - penalty);
        result.maxHealth *= Math.max(0.7, 1 - penalty * 0.3);
    }

    deriveVisualsFromBuild(result, mechBuild);

    return result;
}

function deriveVisualsFromBuild(result, mechBuild) {
    const chassis = ALL_MODULES[mechBuild.chassis?.moduleId];
    const head = ALL_MODULES[mechBuild.head?.moduleId];
    const legs = ALL_MODULES[mechBuild.legs?.moduleId];
    const core = ALL_MODULES[mechBuild.core?.moduleId];

    if (chassis) {
        switch (chassis.id) {
            case 'C_HEAVY':
                result.visualVariant = 'heavy';
                result.visualColor = '#aa4444';
                result.visualSecondaryColor = '#4a2a2a';
                result.coreColor = '#ff8888';
                break;
            case 'C_LIGHT':
                result.visualVariant = 'light';
                result.visualColor = '#00d4ff';
                result.visualSecondaryColor = '#2a4a5a';
                result.coreColor = '#a0f0ff';
                break;
            case 'C_ASSAULT':
                result.visualVariant = 'assault';
                result.visualColor = '#ff6644';
                result.visualSecondaryColor = '#5a2a1a';
                result.coreColor = '#ffaa88';
                break;
            default:
                result.visualVariant = 'standard';
                result.visualColor = '#00d4ff';
                result.visualSecondaryColor = '#4a5568';
                result.coreColor = '#a0d0f0';
        }
    }

    if (head) {
        switch (head.id) {
            case 'H_SNIPER':
                result.visorShape = 'visor';
                break;
            case 'H_EWAR':
                result.visorShape = 'dome';
                break;
            default:
                result.visorShape = 'round';
        }
    }

    if (legs) {
        switch (legs.id) {
            case 'L_HEAVY':
                result.legStyle = 'tracked';
                break;
            case 'L_SPEED':
                result.legStyle = 'reverseJoint';
                break;
            default:
                result.legStyle = 'biped';
        }
    }

    if (core) {
        switch (core.id) {
            case 'CO_SHIELD':
                result.hasShoulderArmor = true;
                break;
            case 'CO_REPAIR':
                result.hasBackpack = true;
                break;
            case 'CO_OVERDRIVE':
                result.antennaCount = 2;
                break;
        }
    }

    if (result.armor >= 0.25) result.extraPlating = 1;
    if (result.armor >= 0.4) result.extraPlating = 2;
}

export function moduleUpgradeCost(moduleId, currentLevel) {
    const m = ALL_MODULES[moduleId];
    if (!m) return Infinity;
    return Math.floor(m.cost * 0.5 * Math.pow(1.5, currentLevel));
}

export function moduleResearchCost(moduleId) {
    const m = ALL_MODULES[moduleId];
    if (!m) return Infinity;
    return Math.floor(m.cost * 1.5);
}

export function salvageModule(moduleId, level) {
    const m = ALL_MODULES[moduleId];
    if (!m) return 0;
    return Math.floor(m.cost * 0.3 * (1 + (level - 1) * 0.2));
}
