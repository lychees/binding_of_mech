// 存档系统
const SAVE_KEY = 'mech_game_save';

export function loadSave() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
        try {
            return JSON.parse(raw);
        } catch (e) {
            console.error('存档读取失败', e);
        }
    }
    return createDefaultSave();
}

export function saveGame(data) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function createDefaultSave() {
    return {
        money: 1000,
        exp: 0,
        level: 1,
        expToNext: 100,
        mech: {
            maxHealth: 100,
            armorLevel: 0,
            speedLevel: 0,
            healthLevel: 0,
            dashLevel: 0
        },
        weapons: {
            VULCAN: { unlocked: true, level: 1 },
            SHOTGUN: { unlocked: false, level: 0 },
            CANNON: { unlocked: false, level: 0 },
            LASER: { unlocked: false, level: 0 },
            BEAM_SWORD: { unlocked: false, level: 0 }
        },
        levelsCompleted: [],
        highestLevel: 0
    };
}

export function addMoneyExp(save, money, exp) {
    save.money += money;
    save.exp += exp;
    while (save.exp >= save.expToNext) {
        save.exp -= save.expToNext;
        save.level++;
        save.expToNext = Math.floor(save.expToNext * 1.5);
    }
    saveGame(save);
    return save;
}

// 升级花费公式
export function upgradeCost(base, level) {
    return Math.floor(base * Math.pow(1.5, level));
}

// 机甲升级效果
export function getMechStats(save) {
    const m = save.mech;
    return {
        maxHealth: 100 + m.healthLevel * 20,
        armor: m.armorLevel * 0.1, // 10% per level
        maxSpeed: 2.5 + m.speedLevel * 0.15,
        dashCooldown: Math.max(20, 60 - m.dashLevel * 5)
    };
}
