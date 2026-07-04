// 驾驶员系统：培养、属性、天赋

export const PILOT_TEMPLATES = {
    rookie: {
        id: 'rookie',
        name: '新兵',
        description: '刚入伍的新人，成长空间很大。',
        color: '#e0e0e0',
        icon: '🎖️',
        baseStats: {
            maxHealth: 30,
            maxSpeed: 3.5,
            acceleration: 0.2,
            fireRate: 12,
            damage: 4,
            bulletSpeed: 10,
            aimBonus: 0,
            evasion: 0,
            repairBonus: 0,
            xpRate: 1.0
        },
        growth: {
            maxHealth: 3,
            maxSpeed: 0.05,
            damage: 0.3,
            aimBonus: 0.01,
            evasion: 0.005,
            repairBonus: 0.01
        },
        talent: { name: '求生本能', description: '受到致命伤害时有 10% 概率保留 1 点生命', type: 'survivor' }
    },
    veteran: {
        id: 'veteran',
        name: '老兵',
        description: '经历过多次战役的资深驾驶员。',
        color: '#88ccff',
        icon: '⭐',
        baseStats: {
            maxHealth: 40,
            maxSpeed: 3.6,
            acceleration: 0.22,
            fireRate: 11,
            damage: 5,
            bulletSpeed: 11,
            aimBonus: 0.05,
            evasion: 0.03,
            repairBonus: 0.05,
            xpRate: 1.1
        },
        growth: {
            maxHealth: 3.5,
            maxSpeed: 0.04,
            damage: 0.35,
            aimBonus: 0.012,
            evasion: 0.006,
            repairBonus: 0.012
        },
        talent: { name: '稳定输出', description: '机甲武器伤害 +5%', type: 'damage', value: 0.05 }
    },
    ace: {
        id: 'ace',
        name: '王牌',
        description: '空战王牌转行的精英驾驶员。',
        color: '#ffaa44',
        icon: '✈️',
        baseStats: {
            maxHealth: 35,
            maxSpeed: 4.0,
            acceleration: 0.25,
            fireRate: 10,
            damage: 5,
            bulletSpeed: 12,
            aimBonus: 0.08,
            evasion: 0.05,
            repairBonus: 0,
            xpRate: 1.2
        },
        growth: {
            maxHealth: 2.5,
            maxSpeed: 0.07,
            damage: 0.4,
            aimBonus: 0.015,
            evasion: 0.008,
            repairBonus: 0.005
        },
        talent: { name: '精准打击', description: '机甲瞄准 +8%，暴击概率 +3%', type: 'aim', value: 0.08 }
    },
    scout: {
        id: 'scout',
        name: '侦察专家',
        description: '擅长快速移动和侦察。',
        color: '#00ff88',
        icon: '👁️',
        baseStats: {
            maxHealth: 28,
            maxSpeed: 4.2,
            acceleration: 0.28,
            fireRate: 13,
            damage: 3.5,
            bulletSpeed: 11,
            aimBonus: 0.03,
            evasion: 0.08,
            repairBonus: 0,
            xpRate: 1.15
        },
        growth: {
            maxHealth: 2,
            maxSpeed: 0.08,
            damage: 0.25,
            aimBonus: 0.008,
            evasion: 0.01,
            repairBonus: 0
        },
        talent: { name: '极速反应', description: '冲刺冷却 -10%', type: 'dashCooldown', value: 0.1 }
    },
    engineer: {
        id: 'engineer',
        name: '技师',
        description: '能在战场上快速修复机甲。',
        color: '#ffcc44',
        icon: '🔧',
        baseStats: {
            maxHealth: 32,
            maxSpeed: 3.3,
            acceleration: 0.18,
            fireRate: 13,
            damage: 3.5,
            bulletSpeed: 9,
            aimBonus: 0,
            evasion: 0.02,
            repairBonus: 0.2,
            xpRate: 1.0
        },
        growth: {
            maxHealth: 3,
            maxSpeed: 0.03,
            damage: 0.2,
            aimBonus: 0.005,
            evasion: 0.004,
            repairBonus: 0.02
        },
        talent: { name: '战场维修', description: '修理包和自动修复效果 +20%', type: 'repair', value: 0.2 }
    },
    sniper: {
        id: 'sniper',
        name: '狙击专家',
        description: '远程射击的专家，擅长精准打击。',
        color: '#cc88ff',
        icon: '🎯',
        baseStats: {
            maxHealth: 28,
            maxSpeed: 3.4,
            acceleration: 0.2,
            fireRate: 14,
            damage: 6,
            bulletSpeed: 14,
            aimBonus: 0.12,
            evasion: 0.02,
            repairBonus: 0,
            xpRate: 1.1
        },
        growth: {
            maxHealth: 2,
            maxSpeed: 0.03,
            damage: 0.5,
            aimBonus: 0.018,
            evasion: 0.003,
            repairBonus: 0
        },
        talent: { name: '超距感知', description: '探测距离 +100，激光/狙击武器伤害 +5%', type: 'range', value: 100 }
    }
};

export const PILOT_RECRUIT_COST = {
    rookie: 200,
    veteran: 800,
    ace: 2000,
    scout: 1000,
    engineer: 1200,
    sniper: 1500
};

export function getPilotTemplate(templateId) {
    return PILOT_TEMPLATES[templateId] || PILOT_TEMPLATES.rookie;
}

export function generatePilotId() {
    return `pilot_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

export function createPilot(templateId, name = null) {
    const template = getPilotTemplate(templateId);
    return {
        id: generatePilotId(),
        templateId,
        name: name || template.name,
        level: 1,
        exp: 0,
        expToNext: 100,
        kills: 0,
        missions: 0
    };
}

export function pilotExpToNext(level) {
    return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function addPilotExp(pilot, exp) {
    const template = getPilotTemplate(pilot.templateId);
    const gained = Math.floor(exp * template.baseStats.xpRate);
    pilot.exp += gained;
    while (pilot.exp >= pilot.expToNext) {
        pilot.exp -= pilot.expToNext;
        pilotLevelUp(pilot);
    }
    return gained;
}

export function pilotLevelUp(pilot) {
    pilot.level++;
    pilot.expToNext = pilotExpToNext(pilot.level);
    return pilot;
}

export function calculatePilotStats(pilot) {
    const template = getPilotTemplate(pilot.templateId);
    const base = template.baseStats;
    const growth = template.growth;
    const lvl = pilot.level;
    const stats = {
        maxHealth: base.maxHealth + (growth.maxHealth || 0) * (lvl - 1),
        maxSpeed: base.maxSpeed + (growth.maxSpeed || 0) * (lvl - 1),
        acceleration: base.acceleration,
        fireRate: base.fireRate,
        damage: base.damage + (growth.damage || 0) * (lvl - 1),
        bulletSpeed: base.bulletSpeed,
        aimBonus: base.aimBonus + (growth.aimBonus || 0) * (lvl - 1),
        evasion: base.evasion + (growth.evasion || 0) * (lvl - 1),
        repairBonus: base.repairBonus + (growth.repairBonus || 0) * (lvl - 1),
        xpRate: base.xpRate
    };

    // 应用天赋加成
    const talent = template.talent;
    if (talent.type === 'damage') {
        stats.damageBonus = talent.value;
    } else if (talent.type === 'aim') {
        stats.aimBonus += talent.value;
        stats.damageBonus = (stats.damageBonus || 0) + 0.03;
    } else if (talent.type === 'repair') {
        stats.repairBonus += talent.value;
    } else if (talent.type === 'dashCooldown') {
        stats.dashCooldownBonus = talent.value;
    } else if (talent.type === 'range') {
        stats.detectionRange = talent.value;
    }

    return stats;
}

export function applyPilotToMech(mech, pilot) {
    if (!mech || !pilot) return;
    const stats = calculatePilotStats(pilot);
    mech.damageBonus = (mech.damageBonus || 0) + (stats.damageBonus || 0);
    mech.aimBonus = (mech.aimBonus || 0) + stats.aimBonus;
    mech.repairBonus = (mech.repairBonus || 0) + stats.repairBonus;
    mech.maxHealth += (stats.maxHealth || 0) * 0.5; // 驾驶员血量只部分加成给机甲
    mech.health = Math.min(mech.health, mech.maxHealth);
    if (stats.dashCooldownBonus) {
        mech.dashMaxCooldown = Math.max(15, mech.dashMaxCooldown * (1 - stats.dashCooldownBonus));
    }
}

export function applyPilotToPilotEntity(entity, pilot) {
    if (!entity || !pilot) return;
    const stats = calculatePilotStats(pilot);
    entity.maxHealth = stats.maxHealth;
    entity.health = Math.min(entity.health || stats.maxHealth, stats.maxHealth);
    entity.maxSpeed = stats.maxSpeed;
    entity.acceleration = stats.acceleration;
    entity.fireRate = stats.fireRate;
    entity.damage = stats.damage;
    entity.bulletSpeed = stats.bulletSpeed;
    entity.aimBonus = stats.aimBonus;
}

export function getRecruitCost(templateId) {
    return PILOT_RECRUIT_COST[templateId] || PILOT_RECRUIT_COST.rookie;
}

export function getPilotDisplayInfo(pilot) {
    const template = getPilotTemplate(pilot.templateId);
    const stats = calculatePilotStats(pilot);
    return {
        ...pilot,
        templateName: template.name,
        description: template.description,
        color: template.color,
        icon: template.icon,
        talent: template.talent,
        stats
    };
}
