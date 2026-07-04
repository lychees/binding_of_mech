// 暗黑破坏神风格背包与道具系统

export const ITEM_RARITY = {
    common: { color: '#aaaaaa', name: '普通' },
    uncommon: { color: '#00ff88', name: '优秀' },
    rare: { color: '#00d4ff', name: '稀有' },
    epic: { color: '#aa00ff', name: '史诗' },
    legendary: { color: '#ffaa44', name: '传说' }
};

export const ITEM_TYPES = {
    CONSUMABLE: 'consumable',
    MATERIAL: 'material',
    QUEST: 'quest',
    MODULE: 'module'
};

export const ITEM_DEFS = {
    repairKit: {
        id: 'repairKit',
        name: '修理包',
        type: ITEM_TYPES.CONSUMABLE,
        width: 1,
        height: 1,
        maxStack: 20,
        rarity: 'common',
        icon: '🔧',
        description: '恢复机甲 30 点生命值',
        effect: { heal: 30, target: 'mech' },
        weight: 0.5
    },
    firstAidKit: {
        id: 'firstAidKit',
        name: '急救包',
        type: ITEM_TYPES.CONSUMABLE,
        width: 1,
        height: 1,
        maxStack: 10,
        rarity: 'common',
        icon: '💊',
        description: '恢复飞行员 15 点生命值',
        effect: { heal: 15, target: 'pilot' },
        weight: 0.3
    },
    energyCell: {
        id: 'energyCell',
        name: '能量电池',
        type: ITEM_TYPES.CONSUMABLE,
        width: 1,
        height: 1,
        maxStack: 10,
        rarity: 'uncommon',
        icon: '🔋',
        description: '恢复机甲 30 点能量',
        effect: { energy: 30, target: 'mech' },
        weight: 0.4
    },
    ammoBox: {
        id: 'ammoBox',
        name: '弹药箱',
        type: ITEM_TYPES.CONSUMABLE,
        width: 1,
        height: 2,
        maxStack: 5,
        rarity: 'uncommon',
        icon: '💣',
        description: '重置当前武器过热/冷却状态',
        effect: { reload: true, target: 'mech' },
        weight: 1.0
    },
    alloySteel: {
        id: 'alloySteel',
        name: '合金钢材',
        type: ITEM_TYPES.MATERIAL,
        width: 1,
        height: 1,
        maxStack: 99,
        rarity: 'common',
        icon: '⛓️',
        description: '制造与升级机体模块的常用材料',
        weight: 0.1
    },
    darkFuel: {
        id: 'darkFuel',
        name: '暗星燃料',
        type: ITEM_TYPES.MATERIAL,
        width: 1,
        height: 1,
        maxStack: 99,
        rarity: 'rare',
        icon: '⚗️',
        description: '高级武器与核心研发材料',
        weight: 0.1
    },
    dataCore: {
        id: 'dataCore',
        name: '数据核心',
        type: ITEM_TYPES.QUEST,
        width: 2,
        height: 2,
        maxStack: 1,
        rarity: 'epic',
        icon: '💾',
        description: '敌军加密数据，可在格纳库出售',
        weight: 2.0
    },

    // 普通材料
    scrapMetal: {
        id: 'scrapMetal',
        name: '废金属',
        type: ITEM_TYPES.MATERIAL,
        width: 1,
        height: 1,
        maxStack: 99,
        rarity: 'common',
        icon: '🔩',
        description: '从残骸中回收的金属材料，可熔炼后使用',
        weight: 0.1
    },
    copperWire: {
        id: 'copperWire',
        name: '铜线束',
        type: ITEM_TYPES.MATERIAL,
        width: 1,
        height: 1,
        maxStack: 99,
        rarity: 'common',
        icon: '🧵',
        description: '基础电子元件材料',
        weight: 0.05
    },
    glassShard: {
        id: 'glassShard',
        name: '光学玻璃碎片',
        type: ITEM_TYPES.MATERIAL,
        width: 1,
        height: 1,
        maxStack: 99,
        rarity: 'common',
        icon: '🔍',
        description: '破损的光学传感器残片，可回收镀膜',
        weight: 0.05
    },
    plasticSheet: {
        id: 'plasticSheet',
        name: '聚合物板材',
        type: ITEM_TYPES.MATERIAL,
        width: 1,
        height: 1,
        maxStack: 99,
        rarity: 'common',
        icon: '📄',
        description: '轻型护甲与绝缘层的原料',
        weight: 0.05
    },
    rubberPad: {
        id: 'rubberPad',
        name: '减震橡胶',
        type: ITEM_TYPES.MATERIAL,
        width: 1,
        height: 1,
        maxStack: 99,
        rarity: 'common',
        icon: '🛞',
        description: '用于缓冲关节冲击',
        weight: 0.08
    },
    lubricant: {
        id: 'lubricant',
        name: '合成润滑油',
        type: ITEM_TYPES.MATERIAL,
        width: 1,
        height: 1,
        maxStack: 99,
        rarity: 'common',
        icon: '🛢️',
        description: '保持机械关节运转顺滑',
        weight: 0.1
    },

    // 优秀材料
    ceramicPlate: {
        id: 'ceramicPlate',
        name: '陶瓷装甲板',
        type: ITEM_TYPES.MATERIAL,
        width: 1,
        height: 2,
        maxStack: 50,
        rarity: 'uncommon',
        icon: '🛡️',
        description: '轻质高硬度装甲材料',
        weight: 0.4
    },
    carbonFiber: {
        id: 'carbonFiber',
        name: '碳纤束',
        type: ITEM_TYPES.MATERIAL,
        width: 1,
        height: 1,
        maxStack: 99,
        rarity: 'uncommon',
        icon: '🧶',
        description: '高强度轻量化结构材料',
        weight: 0.05
    },
    thermalGel: {
        id: 'thermalGel',
        name: '导热凝胶',
        type: ITEM_TYPES.MATERIAL,
        width: 1,
        height: 1,
        maxStack: 99,
        rarity: 'uncommon',
        icon: '🧴',
        description: '辅助武器散热的重要材料',
        weight: 0.1
    },
    hydraulicFluid: {
        id: 'hydraulicFluid',
        name: '液压油',
        type: ITEM_TYPES.MATERIAL,
        width: 1,
        height: 1,
        maxStack: 99,
        rarity: 'uncommon',
        icon: '🧪',
        description: '驱动重型机甲关节的流体',
        weight: 0.12
    },
    opticsLens: {
        id: 'opticsLens',
        name: '精密透镜',
        type: ITEM_TYPES.MATERIAL,
        width: 1,
        height: 1,
        maxStack: 50,
        rarity: 'uncommon',
        icon: '🔎',
        description: '传感器与激光武器的聚焦元件',
        weight: 0.1
    },

    // 稀有材料
    nanoMesh: {
        id: 'nanoMesh',
        name: '纳米编织网',
        type: ITEM_TYPES.MATERIAL,
        width: 1,
        height: 1,
        maxStack: 99,
        rarity: 'rare',
        icon: '🕸️',
        description: '自修复涂层的关键材料',
        weight: 0.05
    },
    superconductor: {
        id: 'superconductor',
        name: '超导线圈',
        type: ITEM_TYPES.MATERIAL,
        width: 1,
        height: 2,
        maxStack: 50,
        rarity: 'rare',
        icon: '🌀',
        description: '能量核心与电磁武器的必需品',
        weight: 0.3
    },
    plasteelBar: {
        id: 'plasteelBar',
        name: '塑钢锭',
        type: ITEM_TYPES.MATERIAL,
        width: 1,
        height: 1,
        maxStack: 99,
        rarity: 'rare',
        icon: '🧱',
        description: '合金钢材的高级形态',
        weight: 0.15
    },
    quantumChip: {
        id: 'quantumChip',
        name: '量子芯片',
        type: ITEM_TYPES.MATERIAL,
        width: 1,
        height: 1,
        maxStack: 50,
        rarity: 'rare',
        icon: '💠',
        description: '高级火控与AI计算模块',
        weight: 0.05
    },
    magneticCore: {
        id: 'magneticCore',
        name: '磁约束核心',
        type: ITEM_TYPES.MATERIAL,
        width: 2,
        height: 2,
        maxStack: 10,
        rarity: 'rare',
        icon: '🧲',
        description: '微型反应堆的稳定组件',
        weight: 1.0
    },

    // 史诗材料
    fusionCell: {
        id: 'fusionCell',
        name: '聚变电池',
        type: ITEM_TYPES.MATERIAL,
        width: 2,
        height: 1,
        maxStack: 20,
        rarity: 'epic',
        icon: '☢️',
        description: '高密度能量源，传说级武器的核心',
        weight: 0.8
    },
    titaniumAlloy: {
        id: 'titaniumAlloy',
        name: '泰坦合金',
        type: ITEM_TYPES.MATERIAL,
        width: 2,
        height: 1,
        maxStack: 50,
        rarity: 'epic',
        icon: '⚙️',
        description: '超高强度的航天级合金',
        weight: 0.4
    },
    neuralProcessor: {
        id: 'neuralProcessor',
        name: '神经处理器',
        type: ITEM_TYPES.MATERIAL,
        width: 2,
        height: 2,
        maxStack: 5,
        rarity: 'epic',
        icon: '🧠',
        description: '模拟驾驶员神经反射的尖端芯片',
        weight: 0.6
    },
    phaseCrystal: {
        id: 'phaseCrystal',
        name: '相位水晶',
        type: ITEM_TYPES.MATERIAL,
        width: 1,
        height: 1,
        maxStack: 30,
        rarity: 'epic',
        icon: '💎',
        description: '激光武器的能量聚焦晶体',
        weight: 0.2
    },

    // 传说材料
    starFragment: {
        id: 'starFragment',
        name: '星陨碎片',
        type: ITEM_TYPES.MATERIAL,
        width: 2,
        height: 2,
        maxStack: 5,
        rarity: 'legendary',
        icon: '🌠',
        description: '来自外太空的未知金属，极其稀有',
        weight: 1.5
    },
    voidEssence: {
        id: 'voidEssence',
        name: '虚空精华',
        type: ITEM_TYPES.MATERIAL,
        width: 1,
        height: 1,
        maxStack: 10,
        rarity: 'legendary',
        icon: '🔮',
        description: '暗星燃料提纯后的终极形态',
        weight: 0.2
    },

    // 消耗品
    coolantCanister: {
        id: 'coolantCanister',
        name: '冷却剂罐',
        type: ITEM_TYPES.CONSUMABLE,
        width: 1,
        height: 2,
        maxStack: 5,
        rarity: 'uncommon',
        icon: '🧊',
        description: '立即将火神炮温度降至 0',
        effect: { resetHeat: true, target: 'mech' },
        weight: 0.8
    },
    adrenalineShot: {
        id: 'adrenalineShot',
        name: '肾上腺素',
        type: ITEM_TYPES.CONSUMABLE,
        width: 1,
        height: 1,
        maxStack: 10,
        rarity: 'uncommon',
        icon: '💉',
        description: '飞行员 10 秒内移动速度 +30%',
        effect: { speedBoost: 0.3, duration: 600, target: 'pilot' },
        weight: 0.2
    },
    shieldBooster: {
        id: 'shieldBooster',
        name: '护盾增幅器',
        type: ITEM_TYPES.CONSUMABLE,
        width: 1,
        height: 1,
        maxStack: 5,
        rarity: 'rare',
        icon: '🛡️',
        description: '机甲 8 秒内受到的伤害 -50%',
        effect: { damageReduction: 0.5, duration: 480, target: 'mech' },
        weight: 0.5
    },
    targetingChip: {
        id: 'targetingChip',
        name: '目标锁定芯片',
        type: ITEM_TYPES.CONSUMABLE,
        width: 1,
        height: 1,
        maxStack: 5,
        rarity: 'rare',
        icon: '🎯',
        description: '12 秒内武器散布 -50%',
        effect: { accuracyBoost: 0.5, duration: 720, target: 'mech' },
        weight: 0.3
    },
    overclockUnit: {
        id: 'overclockUnit',
        name: '超频单元',
        type: ITEM_TYPES.CONSUMABLE,
        width: 2,
        height: 1,
        maxStack: 3,
        rarity: 'epic',
        icon: '⚡',
        description: '机甲 6 秒内射速 +50%，但持续过热',
        effect: { fireRateBoost: 0.5, heatGain: true, duration: 360, target: 'mech' },
        weight: 0.8
    },
    naniteCanister: {
        id: 'naniteCanister',
        name: '纳米修复罐',
        type: ITEM_TYPES.CONSUMABLE,
        width: 1,
        height: 2,
        maxStack: 5,
        rarity: 'epic',
        icon: '🧬',
        description: '30 秒内缓慢恢复 100 点机甲生命值',
        effect: { regen: 100, duration: 1800, target: 'mech' },
        weight: 0.9
    },

    // 任务/杂物收集品
    dogTag: {
        id: 'dogTag',
        name: '士兵铭牌',
        type: ITEM_TYPES.QUEST,
        width: 1,
        height: 1,
        maxStack: 20,
        rarity: 'common',
        icon: '🪖',
        description: '阵亡士兵的身份识别牌',
        weight: 0.1
    },
    brokenCircuit: {
        id: 'brokenCircuit',
        name: '烧毁电路板',
        type: ITEM_TYPES.QUEST,
        width: 1,
        height: 1,
        maxStack: 20,
        rarity: 'common',
        icon: '🔌',
        description: '敌人机甲上的损坏电子元件',
        weight: 0.1
    },
    enemyInsignia: {
        id: 'enemyInsignia',
        name: '敌军徽章',
        type: ITEM_TYPES.QUEST,
        width: 1,
        height: 1,
        maxStack: 10,
        rarity: 'uncommon',
        icon: '🎖️',
        description: '敌方精锐部队的身份证明',
        weight: 0.1
    },
    commandSeal: {
        id: 'commandSeal',
        name: '指挥印章',
        type: ITEM_TYPES.QUEST,
        width: 1,
        height: 1,
        maxStack: 5,
        rarity: 'rare',
        icon: '🔏',
        description: '敌军指挥官持有的加密印章',
        weight: 0.1
    },
    battlefieldPhoto: {
        id: 'battlefieldPhoto',
        name: '战场照片',
        type: ITEM_TYPES.QUEST,
        width: 1,
        height: 1,
        maxStack: 1,
        rarity: 'epic',
        icon: '📷',
        description: '记录着某个重要时刻的照片',
        weight: 0.1
    },

    // 值钱回收品
    goldBullion: {
        id: 'goldBullion',
        name: '金条',
        type: ITEM_TYPES.MATERIAL,
        width: 2,
        height: 1,
        maxStack: 10,
        rarity: 'epic',
        icon: '🏆',
        description: '可直接出售换取大量金币',
        weight: 2.0
    },
    encryptedDrive: {
        id: 'encryptedDrive',
        name: '加密硬盘',
        type: ITEM_TYPES.QUEST,
        width: 1,
        height: 1,
        maxStack: 5,
        rarity: 'rare',
        icon: '💽',
        description: '存有敌军情报，价值不菲',
        weight: 0.2
    },
    mechEmblem: {
        id: 'mechEmblem',
        name: '机甲徽记',
        type: ITEM_TYPES.QUEST,
        width: 1,
        height: 1,
        maxStack: 3,
        rarity: 'legendary',
        icon: '🎗️',
        description: '击败强大机甲后获得的荣誉象征',
        weight: 0.1
    },

    // 大型/重型收集品
    engineBlock: {
        id: 'engineBlock',
        name: '机甲引擎总成',
        type: ITEM_TYPES.MATERIAL,
        width: 3,
        height: 2,
        maxStack: 1,
        rarity: 'rare',
        icon: '🚜',
        description: '一台完整的机甲引擎，极其沉重，但价值很高',
        weight: 25.0
    },
    armorPlating: {
        id: 'armorPlating',
        name: '重型装甲板',
        type: ITEM_TYPES.MATERIAL,
        width: 2,
        height: 3,
        maxStack: 2,
        rarity: 'uncommon',
        icon: '🧱',
        description: '大块的复合装甲板，需要机甲协助搬运',
        weight: 18.0
    },
    artilleryBarrel: {
        id: 'artilleryBarrel',
        name: '炮管残骸',
        type: ITEM_TYPES.MATERIAL,
        width: 1,
        height: 4,
        maxStack: 1,
        rarity: 'rare',
        icon: '🔫',
        description: '一根扭曲但仍可回收的合金炮管',
        weight: 22.0
    },
    reactorCore: {
        id: 'reactorCore',
        name: '微型反应堆',
        type: ITEM_TYPES.MATERIAL,
        width: 3,
        height: 3,
        maxStack: 1,
        rarity: 'epic',
        icon: '⚛️',
        description: '仍在低功率运转的反应堆核心，极其危险且沉重',
        weight: 40.0
    },
    trackedChassis: {
        id: 'trackedChassis',
        name: '履带底盘',
        type: ITEM_TYPES.MATERIAL,
        width: 4,
        height: 2,
        maxStack: 1,
        rarity: 'uncommon',
        icon: '⛓️',
        description: '一组完整的履带底盘，可改装为重型载具',
        weight: 30.0
    },
    sensorDish: {
        id: 'sensorDish',
        name: '雷达天线盘',
        type: ITEM_TYPES.MATERIAL,
        width: 3,
        height: 3,
        maxStack: 1,
        rarity: 'rare',
        icon: '📡',
        description: '大型抛物面天线，占据大量背包空间',
        weight: 15.0
    },
    fuelDrum: {
        id: 'fuelDrum',
        name: '燃料桶',
        type: ITEM_TYPES.MATERIAL,
        width: 2,
        height: 2,
        maxStack: 3,
        rarity: 'common',
        icon: '🛢️',
        description: '装满暗星燃料衍生物的大桶，搬运会拖慢速度',
        weight: 12.0
    },
    mechLeg: {
        id: 'mechLeg',
        name: '机甲腿部组件',
        type: ITEM_TYPES.MATERIAL,
        width: 2,
        height: 4,
        maxStack: 1,
        rarity: 'uncommon',
        icon: '🦿',
        description: '一条完整的二足机甲腿，长而笨重',
        weight: 20.0
    },
    cargoContainer: {
        id: 'cargoContainer',
        name: '物资集装箱',
        type: ITEM_TYPES.QUEST,
        width: 4,
        height: 3,
        maxStack: 1,
        rarity: 'epic',
        icon: '📦',
        description: '未开启的战地物资箱，体积巨大但可能内含高价值物品',
        weight: 35.0
    },
    turretBase: {
        id: 'turretBase',
        name: '炮塔基座',
        type: ITEM_TYPES.MATERIAL,
        width: 3,
        height: 3,
        maxStack: 1,
        rarity: 'rare',
        icon: '🏰',
        description: '旋转炮台的厚重基座，内含精密传动结构',
        weight: 28.0
    },
    gyroStabilizer: {
        id: 'gyroStabilizer',
        name: '重型陀螺仪',
        type: ITEM_TYPES.MATERIAL,
        width: 2,
        height: 2,
        maxStack: 2,
        rarity: 'rare',
        icon: '🎯',
        description: '维持大型机甲平衡的核心部件，密度极高',
        weight: 16.0
    },
    spentBattery: {
        id: 'spentBattery',
        name: '报废动力电池组',
        type: ITEM_TYPES.MATERIAL,
        width: 2,
        height: 3,
        maxStack: 1,
        rarity: 'common',
        icon: '🔋',
        description: '一组失去活性但仍可回收的大型电池',
        weight: 14.0
    },
    commsTower: {
        id: 'commsTower',
        name: '通讯塔段',
        type: ITEM_TYPES.MATERIAL,
        width: 1,
        height: 4,
        maxStack: 1,
        rarity: 'uncommon',
        icon: '🗼',
        description: '细长的通讯塔金属段，携带时很占空间',
        weight: 10.0
    },
    salvageAnchor: {
        id: 'salvageAnchor',
        name: '打捞锚',
        type: ITEM_TYPES.QUEST,
        width: 3,
        height: 2,
        maxStack: 1,
        rarity: 'legendary',
        icon: '⚓',
        description: '重型打捞用的合金锚，极其沉重，收藏家愿意出高价收购',
        weight: 50.0
    }
};

export function getItemDef(defId) {
    return ITEM_DEFS[defId] || null;
}

let itemIdCounter = 0;
export function generateItemId() {
    return `item_${Date.now()}_${itemIdCounter++}`;
}

export class InventoryItem {
    constructor(defId, amount = 1, x = -1, y = -1) {
        const def = getItemDef(defId);
        if (!def) throw new Error(`Unknown item def: ${defId}`);
        this.id = generateItemId();
        this.defId = defId;
        this.amount = Math.min(amount, def.maxStack);
        this.x = x;
        this.y = y;
    }

    get def() {
        return getItemDef(this.defId);
    }

    get width() { return this.def.width; }
    get height() { return this.def.height; }
    get maxStack() { return this.def.maxStack; }
    get weight() { return this.def.weight * this.amount; }
    get name() { return this.def.name; }
    get rarity() { return this.def.rarity; }
    get type() { return this.def.type; }

    occupies(x, y) {
        return x >= this.x && x < this.x + this.width &&
               y >= this.y && y < this.y + this.height;
    }

    toJSON() {
        return {
            id: this.id,
            defId: this.defId,
            amount: this.amount,
            x: this.x,
            y: this.y
        };
    }

    static fromJSON(data) {
        const item = new InventoryItem(data.defId, data.amount, data.x, data.y);
        item.id = data.id || generateItemId();
        return item;
    }
}

export class GridInventory {
    constructor(rows, cols, owner = 'mech') {
        this.rows = rows;
        this.cols = cols;
        this.owner = owner;
        this.items = [];
        this.grid = Array.from({ length: cols }, () => Array(rows).fill(null));
        this.maxWeight = owner === 'mech' ? 200 : 60;
    }

    get totalCells() {
        return this.rows * this.cols;
    }

    get usedCells() {
        return this.items.reduce((sum, item) => sum + item.width * item.height, 0);
    }

    get totalWeight() {
        return this.items.reduce((sum, item) => sum + item.weight, 0);
    }

    inBounds(item, x, y) {
        return x >= 0 && y >= 0 && x + item.width <= this.cols && y + item.height <= this.rows;
    }

    canPlace(item, x, y, ignoreItem = null) {
        if (!this.inBounds(item, x, y)) return false;
        for (let ix = 0; ix < item.width; ix++) {
            for (let iy = 0; iy < item.height; iy++) {
                const occupant = this.grid[x + ix][y + iy];
                if (occupant && occupant !== ignoreItem) {
                    return false;
                }
            }
        }
        return true;
    }

    place(item, x, y) {
        if (!this.canPlace(item, x, y, item)) return false;
        this.remove(item);
        item.x = x;
        item.y = y;
        this.items.push(item);
        for (let ix = 0; ix < item.width; ix++) {
            for (let iy = 0; iy < item.height; iy++) {
                this.grid[x + ix][y + iy] = item;
            }
        }
        return true;
    }

    remove(item) {
        const idx = this.items.indexOf(item);
        if (idx === -1) return false;
        this.items.splice(idx, 1);
        for (let ix = 0; ix < item.width; ix++) {
            for (let iy = 0; iy < item.height; iy++) {
                const cx = item.x + ix;
                const cy = item.y + iy;
                if (cx >= 0 && cy >= 0 && cx < this.cols && cy < this.rows) {
                    this.grid[cx][cy] = null;
                }
            }
        }
        return true;
    }

    move(item, x, y) {
        return this.place(item, x, y);
    }

    findSpace(item) {
        for (let y = 0; y <= this.rows - item.height; y++) {
            for (let x = 0; x <= this.cols - item.width; x++) {
                if (this.canPlace(item, x, y)) return { x, y };
            }
        }
        return null;
    }

    findStackableSlot(defId) {
        for (const item of this.items) {
            if (item.defId === defId && item.amount < item.maxStack) {
                return item;
            }
        }
        return null;
    }

    addItem(item) {
        const def = item.def;
        let remaining = item.amount;

        if (def.maxStack > 1) {
            let stackable = this.findStackableSlot(item.defId);
            while (remaining > 0 && stackable) {
                const space = stackable.maxStack - stackable.amount;
                const add = Math.min(space, remaining);
                stackable.amount += add;
                remaining -= add;
                if (remaining > 0) stackable = this.findStackableSlot(item.defId);
                else stackable = null;
            }
        }

        if (remaining <= 0) return { success: true, remaining: 0 };

        const newItem = new InventoryItem(item.defId, remaining);
        const pos = this.findSpace(newItem);
        if (!pos) return { success: false, remaining };

        this.place(newItem, pos.x, pos.y);
        return { success: true, remaining: 0 };
    }

    splitStack(item, amount) {
        if (amount <= 0 || amount >= item.amount) return null;
        const newItem = new InventoryItem(item.defId, amount);
        const pos = this.findSpace(newItem);
        if (!pos) return null;
        item.amount -= amount;
        this.place(newItem, pos.x, pos.y);
        return newItem;
    }

    getItemAt(x, y) {
        if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return null;
        return this.grid[x][y];
    }

    useItem(item, target) {
        const def = item.def;
        if (def.type !== ITEM_TYPES.CONSUMABLE) return { used: false, reason: '不可使用' };

        let effectApplied = false;
        let result = {};

        if (def.effect.heal) {
            const isMechTarget = def.effect.target === 'mech';
            if (isMechTarget && target && target.maxHealth) {
                if (target.health >= target.maxHealth) return { used: false, reason: '生命值已满' };
                target.health = Math.min(target.maxHealth, target.health + def.effect.heal);
                effectApplied = true;
                result.heal = def.effect.heal;
            } else if (!isMechTarget && target && target.maxHealth) {
                if (target.health >= target.maxHealth) return { used: false, reason: '生命值已满' };
                target.health = Math.min(target.maxHealth, target.health + def.effect.heal);
                effectApplied = true;
                result.heal = def.effect.heal;
            } else {
                return { used: false, reason: '没有合适的使用目标' };
            }
        }

        if (def.effect.energy && target && target.maxEnergy) {
            if (target.currentEnergy >= target.maxEnergy) return { used: false, reason: '能量已满' };
            target.currentEnergy = Math.min(target.maxEnergy, target.currentEnergy + def.effect.energy);
            effectApplied = true;
            result.energy = def.effect.energy;
        }

        if (def.effect.reload && target && target.resetOverheat) {
            target.resetOverheat();
            effectApplied = true;
            result.reload = true;
        }

        if (!effectApplied) return { used: false, reason: '没有效果' };

        item.amount--;
        if (item.amount <= 0) {
            this.remove(item);
        }
        return { used: true, ...result };
    }

    findBestUsable(target, preferType = 'heal') {
        for (const item of this.items) {
            if (item.def.type !== ITEM_TYPES.CONSUMABLE) continue;
            const eff = item.def.effect;
            if (preferType === 'heal' && eff.heal) return item;
            if (preferType === 'energy' && eff.energy) return item;
            if (preferType === 'reload' && eff.reload) return item;
        }
        return null;
    }

    toJSON() {
        return {
            rows: this.rows,
            cols: this.cols,
            owner: this.owner,
            maxWeight: this.maxWeight,
            items: this.items.map(i => i.toJSON())
        };
    }

    static fromJSON(data) {
        const inv = new GridInventory(data.rows, data.cols, data.owner);
        inv.maxWeight = data.maxWeight || inv.maxWeight;
        for (const itemData of data.items || []) {
            try {
                const item = InventoryItem.fromJSON(itemData);
                inv.place(item, item.x, item.y);
            } catch (e) {
                console.warn('背包物品加载失败', itemData, e);
            }
        }
        return inv;
    }
}

export function createDefaultMechInventory() {
    const inv = new GridInventory(6, 10, 'mech');
    inv.addItem(new InventoryItem('repairKit', 5));
    inv.addItem(new InventoryItem('energyCell', 2));
    inv.addItem(new InventoryItem('alloySteel', 20));
    return inv;
}

export function createDefaultPilotInventory() {
    const inv = new GridInventory(4, 6, 'pilot');
    inv.addItem(new InventoryItem('firstAidKit', 3));
    return inv;
}

export function createModuleItem(moduleId, level = 1) {
    return {
        id: generateItemId(),
        defId: moduleId,
        moduleId,
        level,
        isModule: true,
        get def() {
            return ITEM_DEFS.modulePlaceholder || {
                id: 'module', name: '模块', type: ITEM_TYPES.MODULE,
                width: 2, height: 2, maxStack: 1, rarity: 'rare',
                icon: '🧩', description: '机体或武器模块', weight: 3
            };
        }
    };
}

// 占位，后续可从 ALL_MODULES 动态生成模块物品定义
ITEM_DEFS.modulePlaceholder = {
    id: 'module',
    name: '模块',
    type: ITEM_TYPES.MODULE,
    width: 2,
    height: 2,
    maxStack: 1,
    rarity: 'rare',
    icon: '🧩',
    description: '机体或武器模块',
    weight: 3
};

export function createDropFromItem(item, x, y) {
    return {
        x, y,
        type: 'item',
        item,
        radius: Math.max(8, Math.max(item.def.width, item.def.height) * 5),
        color: ITEM_RARITY[item.def.rarity].color,
        life: 600
    };
}
