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
