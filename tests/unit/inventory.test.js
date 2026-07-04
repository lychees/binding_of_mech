import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
    GridInventory,
    InventoryItem,
    ITEM_DEFS,
    getItemDef,
    createDefaultMechInventory,
    createDefaultPilotInventory
} from '../../js/inventory.js';

describe('背包系统', () => {
    describe('物品定义', () => {
        it('应该包含基础消耗品和材料', () => {
            assert.ok(getItemDef('repairKit'));
            assert.ok(getItemDef('firstAidKit'));
            assert.ok(getItemDef('energyCell'));
            assert.ok(getItemDef('alloySteel'));
            assert.ok(getItemDef('darkFuel'));
        });

        it('每种物品应该有完整属性', () => {
            for (const def of Object.values(ITEM_DEFS)) {
                assert.ok(def.id, `${def.id} 缺少 id`);
                assert.ok(def.name, `${def.id} 缺少 name`);
                assert.ok(def.type, `${def.id} 缺少 type`);
                assert.ok(def.width >= 1, `${def.id} width 不合法`);
                assert.ok(def.height >= 1, `${def.id} height 不合法`);
                assert.ok(def.maxStack >= 1, `${def.id} maxStack 不合法`);
                assert.ok(def.weight >= 0, `${def.id} weight 不合法`);
            }
        });
    });

    describe('GridInventory', () => {
        it('应该在指定位置放置物品', () => {
            const inv = new GridInventory(4, 4);
            const item = new InventoryItem('repairKit', 1, 0, 0);
            assert.strictEqual(inv.place(item, 0, 0), true);
            assert.strictEqual(inv.getItemAt(0, 0), item);
        });

        it('应该检测越界', () => {
            const inv = new GridInventory(4, 4);
            const item = new InventoryItem('repairKit', 1, 0, 0);
            assert.strictEqual(inv.place(item, 4, 0), false);
            assert.strictEqual(inv.place(item, 0, 4), false);
        });

        it('应该检测碰撞', () => {
            const inv = new GridInventory(4, 4);
            const item1 = new InventoryItem('repairKit', 1, 0, 0);
            const item2 = new InventoryItem('repairKit', 1, 0, 0);
            inv.place(item1, 0, 0);
            assert.strictEqual(inv.place(item2, 0, 0), false);
        });

        it('应该移动物品', () => {
            const inv = new GridInventory(4, 4);
            const item = new InventoryItem('repairKit', 1, 0, 0);
            inv.place(item, 0, 0);
            assert.strictEqual(inv.move(item, 2, 2), true);
            assert.strictEqual(inv.getItemAt(2, 2), item);
            assert.strictEqual(inv.getItemAt(0, 0), null);
        });

        it('应该自动堆叠', () => {
            const inv = new GridInventory(4, 4);
            const item1 = new InventoryItem('repairKit', 5);
            const item2 = new InventoryItem('repairKit', 10);
            inv.addItem(item1);
            const result = inv.addItem(item2);
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.remaining, 0);
            assert.strictEqual(inv.items.length, 1);
            assert.strictEqual(inv.items[0].amount, 15);
        });

        it('堆叠满后应该放到新格子', () => {
            const inv = new GridInventory(4, 4);
            const max = ITEM_DEFS.repairKit.maxStack;
            const item1 = new InventoryItem('repairKit', max);
            const item2 = new InventoryItem('repairKit', 5);
            inv.addItem(item1);
            const result = inv.addItem(item2);
            assert.strictEqual(result.success, true);
            assert.strictEqual(inv.items.length, 2);
        });

        it('背包满时应该返回剩余数量', () => {
            const inv = new GridInventory(1, 1);
            const item = new InventoryItem('dataCore', 1);
            const result = inv.addItem(item);
            assert.strictEqual(result.success, false);
            assert.strictEqual(result.remaining, 1);
        });

        it('应该拆分堆叠', () => {
            const inv = new GridInventory(4, 4);
            const item = new InventoryItem('repairKit', 10);
            inv.addItem(item);
            const split = inv.splitStack(item, 3);
            assert.ok(split);
            assert.strictEqual(split.amount, 3);
            assert.strictEqual(item.amount, 7);
            assert.strictEqual(inv.items.length, 2);
        });

        it('使用修理包应该恢复机甲生命值', () => {
            const inv = new GridInventory(4, 4);
            const item = new InventoryItem('repairKit', 2);
            inv.addItem(item);
            const mech = { health: 50, maxHealth: 100 };
            const result = inv.useItem(item, mech);
            assert.strictEqual(result.used, true);
            assert.strictEqual(result.heal, 30);
            assert.strictEqual(mech.health, 80);
            assert.strictEqual(item.amount, 1);
        });

        it('满血时不应使用', () => {
            const inv = new GridInventory(4, 4);
            const item = new InventoryItem('repairKit', 1);
            inv.addItem(item);
            const mech = { health: 100, maxHealth: 100 };
            const result = inv.useItem(item, mech);
            assert.strictEqual(result.used, false);
            assert.strictEqual(item.amount, 1);
        });

        it('序列化后应该能完整恢复', () => {
            const inv = new GridInventory(6, 10, 'mech');
            inv.addItem(new InventoryItem('repairKit', 5));
            inv.addItem(new InventoryItem('alloySteel', 30));
            const data = inv.toJSON();
            const restored = GridInventory.fromJSON(data);
            assert.strictEqual(restored.rows, inv.rows);
            assert.strictEqual(restored.cols, inv.cols);
            assert.strictEqual(restored.items.length, inv.items.length);
            assert.strictEqual(restored.totalWeight, inv.totalWeight);
        });
    });

    describe('默认背包', () => {
        it('机甲默认背包应该有修理包和材料', () => {
            const inv = createDefaultMechInventory();
            assert.ok(inv.items.some(i => i.defId === 'repairKit'));
            assert.ok(inv.items.some(i => i.defId === 'alloySteel'));
        });

        it('飞行员默认背包应该有急救包', () => {
            const inv = createDefaultPilotInventory();
            assert.ok(inv.items.some(i => i.defId === 'firstAidKit'));
        });
    });
});
