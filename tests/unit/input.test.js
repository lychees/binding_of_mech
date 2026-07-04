import { describe, it } from 'node:test';
import assert from 'node:assert';

// input.js 依赖浏览器 DOM keys 对象，这里模拟最小环境
await import('../../js/config.js').then(m => {
    global.keys = m.keys;
});

const { p1Input, p2Input, updateInputs, resetInputs } = await import('../../js/input.js');

describe('输入管理器', () => {
    it('P1 和 P2 输入状态默认全 false', () => {
        resetInputs();
        assert.strictEqual(p1Input.forward, false);
        assert.strictEqual(p2Input.forward, false);
        assert.strictEqual(p1Input.shoot, false);
        assert.strictEqual(p2Input.shoot, false);
    });

    it('P1 按 W 时 forward 为 true', () => {
        resetInputs();
        keys['w'] = true;
        updateInputs();
        assert.strictEqual(p1Input.forward, true);
        assert.strictEqual(p2Input.forward, false);
        keys['w'] = false;
    });

    it('P2 按上方向键时 forward 为 true，P1 不受影响', () => {
        resetInputs();
        keys['ArrowUp'] = true;
        updateInputs();
        assert.strictEqual(p2Input.forward, true);
        assert.strictEqual(p1Input.forward, false);
        keys['ArrowUp'] = false;
    });

    it('P1 和 P2 同时按键互不干扰', () => {
        resetInputs();
        keys['w'] = true;
        keys['ArrowDown'] = true;
        updateInputs();
        assert.strictEqual(p1Input.forward, true);
        assert.strictEqual(p2Input.backward, true);
        keys['w'] = false;
        keys['ArrowDown'] = false;
    });

    it('武器切换键映射正确', () => {
        resetInputs();
        keys['3'] = true;
        keys['9'] = true;
        updateInputs();
        assert.strictEqual(p1Input.weaponSwitch, 3);
        assert.strictEqual(p2Input.weaponSwitch, 3);
        keys['3'] = false;
        keys['9'] = false;
    });
});
