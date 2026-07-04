// 加载外部 JSON 配置并暴露与旧代码兼容的接口

import rawWeapons from '../data/weapons.json' with { type: 'json' };
import rawEnemies from '../data/enemies.json' with { type: 'json' };

function freezeDeep(obj) {
    if (obj && typeof obj === 'object') {
        Object.values(obj).forEach(freezeDeep);
        Object.freeze(obj);
    }
    return obj;
}

export const WEAPONS = freezeDeep(rawWeapons);
export const ENEMY_TEMPLATES = freezeDeep(rawEnemies.ENEMY_TEMPLATES);
export const LEVELS = freezeDeep(rawEnemies.LEVELS);

// 武器升级配置（仍保留在 JS 中，因为涉及游戏平衡公式）
export const WEAPON_UPGRADES = Object.freeze({
    VULCAN: { baseCost: 100, maxLevel: 10 },
    SHOTGUN: { baseCost: 150, maxLevel: 10 },
    CANNON: { baseCost: 200, maxLevel: 10 },
    LASER: { baseCost: 250, maxLevel: 10 },
    BEAM_SWORD: { baseCost: 300, maxLevel: 10 },
    MISSILE: { baseCost: 300, maxLevel: 10 },
    HOMING_MISSILE: { baseCost: 400, maxLevel: 10 }
});

export function getWeaponStats(key, level) {
    const base = WEAPONS[key];
    if (!base) return null;
    const multiplier = 1 + (level - 1) * 0.1;
    return {
        ...base,
        damage: base.damage * multiplier,
        fireRate: Math.max(1, base.fireRate * (1 - (level - 1) * 0.05)),
        spread: base.spread * (1 - (level - 1) * 0.1)
    };
}
