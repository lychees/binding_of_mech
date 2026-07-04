import { GridInventory, createDefaultMechInventory, createDefaultPilotInventory } from '../js/inventory.js';
import { createPilot } from '../js/pilots.js';
import { createDefaultPlayerMech } from '../js/enemyMechs.js';

// 存档系统
const SAVE_KEY = 'mech_game_save';

export function loadSave() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
        try {
            const data = JSON.parse(raw);
            return migrateSave(data);
        } catch (e) {
            console.error('存档读取失败', e);
        }
    }
    return createDefaultSave();
}

export function saveGame(data) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

// 旧存档迁移
export function migrateSave(data) {
    if (!data.mechBuild) {
        data.mechBuild = createDefaultMechBuild();
    } else {
        // 确保机甲组装武器槽位有装备
        if (!data.mechBuild.weaponLeft || !data.mechBuild.weaponLeft.moduleId) {
            data.mechBuild.weaponLeft = { moduleId: 'W_VULCAN', level: 1 };
        }
        if (!data.mechBuild.weaponRight || !data.mechBuild.weaponRight.moduleId) {
            data.mechBuild.weaponRight = { moduleId: 'W_BEAM_SWORD', level: 1 };
        }
    }
    if (!data.partsInventory) {
        data.partsInventory = createDefaultPartsInventory();
    } else {
        // 确保拥有所有武器模块各一个
        const defaultInv = createDefaultPartsInventory();
        for (const moduleId in defaultInv) {
            if (!data.partsInventory[moduleId]) {
                data.partsInventory[moduleId] = { level: 1, count: defaultInv[moduleId].count };
            }
        }
    }
    if (!data.mechInventory) {
        data.mechInventory = createDefaultMechInventory().toJSON();
    }
    if (!data.pilotInventory) {
        data.pilotInventory = createDefaultPilotInventory().toJSON();
    }
    if (!data.enemyKillRecord) {
        data.enemyKillRecord = {};
    }
    if (!data.enemyMechsUnlocked) {
        data.enemyMechsUnlocked = [];
    }
    if (!data.pilots) {
        data.pilots = [createPilot('rookie', '阿尔法')];
    }
    if (!data.activePilotId) {
        data.activePilotId = data.pilots[0].id;
    }
    if (!data.mechs) {
        const defaultMech = createDefaultPlayerMech();
        data.mechs = [defaultMech];
        data.activeMechId = defaultMech.id;
    }
    if (!data.activeMechId && data.mechs.length > 0) {
        data.activeMechId = data.mechs[0].id;
    }
    if (!data.researchedModules) {
        data.researchedModules = ['C_STANDARD', 'H_STANDARD', 'A_STANDARD', 'L_STANDARD', 'CO_STANDARD', 'W_VULCAN', 'W_SHOTGUN', 'W_CANNON', 'W_LASER', 'W_BEAM_SWORD'];
    } else {
        // 确保所有武器模块已解锁
        const allWeapons = ['W_VULCAN', 'W_SHOTGUN', 'W_CANNON', 'W_LASER', 'W_BEAM_SWORD'];
        for (const w of allWeapons) {
            if (!data.researchedModules.includes(w)) data.researchedModules.push(w);
        }
    }
    if (!data.blueprints) {
        data.blueprints = [];
    }
    if (!data.materials) {
        data.materials = 0;
    }
    if (!data.weapons) {
        data.weapons = {
            VULCAN: { unlocked: true, level: 1 },
            SHOTGUN: { unlocked: true, level: 1 },
            CANNON: { unlocked: true, level: 1 },
            LASER: { unlocked: true, level: 1 },
            BEAM_SWORD: { unlocked: true, level: 1 }
        };
    } else {
        // 确保旧版所有武器已解锁
        const weaponKeys = ['VULCAN', 'SHOTGUN', 'CANNON', 'LASER', 'BEAM_SWORD'];
        for (const w of weaponKeys) {
            if (!data.weapons[w]) data.weapons[w] = { unlocked: true, level: 1 };
            else {
                data.weapons[w].unlocked = true;
                if (!data.weapons[w].level) data.weapons[w].level = 1;
            }
        }
    }
    return data;
}

export function createDefaultMechBuild() {
    return {
        chassis: { moduleId: 'C_STANDARD', level: 1 },
        head: { moduleId: 'H_STANDARD', level: 1 },
        arms: { moduleId: 'A_STANDARD', level: 1 },
        legs: { moduleId: 'L_STANDARD', level: 1 },
        core: { moduleId: 'CO_STANDARD', level: 1 },
        weaponLeft: { moduleId: 'W_VULCAN', level: 1 },
        weaponRight: { moduleId: 'W_BEAM_SWORD', level: 1 }
    };
}

export function createDefaultPartsInventory() {
    return {
        C_STANDARD: { level: 1, count: 1 },
        H_STANDARD: { level: 1, count: 1 },
        A_STANDARD: { level: 1, count: 1 },
        L_STANDARD: { level: 1, count: 1 },
        CO_STANDARD: { level: 1, count: 1 },
        W_VULCAN: { level: 1, count: 2 },
        W_SHOTGUN: { level: 1, count: 1 },
        W_CANNON: { level: 1, count: 1 },
        W_LASER: { level: 1, count: 1 },
        W_BEAM_SWORD: { level: 1, count: 1 }
    };
}

export function createDefaultSave() {
    const defaultMech = createDefaultPlayerMech();
    const defaultPilot = createPilot('rookie', '阿尔法');
    return {
        money: 1000,
        exp: 0,
        level: 1,
        expToNext: 100,
        materials: 0,
        mechBuild: defaultMech.mechBuild,
        partsInventory: createDefaultPartsInventory(),
        mechInventory: createDefaultMechInventory().toJSON(),
        pilotInventory: createDefaultPilotInventory().toJSON(),
        pilots: [defaultPilot],
        activePilotId: defaultPilot.id,
        mechs: [defaultMech],
        activeMechId: defaultMech.id,
        enemyKillRecord: {},
        enemyMechsUnlocked: [],
        researchedModules: ['C_STANDARD', 'H_STANDARD', 'A_STANDARD', 'L_STANDARD', 'CO_STANDARD', 'W_VULCAN', 'W_SHOTGUN', 'W_CANNON', 'W_LASER', 'W_BEAM_SWORD'],
        blueprints: [],
        // 保留旧版字段用于兼容
        mech: {
            maxHealth: 100,
            armorLevel: 0,
            speedLevel: 0,
            healthLevel: 0,
            dashLevel: 0
        },
        weapons: {
            VULCAN: { unlocked: true, level: 1 },
            SHOTGUN: { unlocked: true, level: 1 },
            CANNON: { unlocked: true, level: 1 },
            LASER: { unlocked: true, level: 1 },
            BEAM_SWORD: { unlocked: true, level: 1 }
        },
        levelsCompleted: [],
        highestLevel: 0
    };
}

export function addMoneyExp(save, money, exp, materials = 0) {
    save.money += money;
    save.exp += exp;
    save.materials += materials;
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

// 机甲升级效果（旧版兼容）
export function getMechStats(save) {
    const m = save.mech;
    return {
        maxHealth: 100 + m.healthLevel * 20,
        armor: m.armorLevel * 0.1,
        maxSpeed: 2.5 + m.speedLevel * 0.15,
        dashCooldown: Math.max(20, 60 - m.dashLevel * 5)
    };
}
