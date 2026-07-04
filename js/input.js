import { keys } from './config.js?v=2';

const PLAYER_BINDINGS = {
    p1: {
        forward: ['w', 'W'],
        backward: ['s', 'S'],
        left: ['a', 'A'],
        right: ['d', 'D'],
        turnLeft: ['q', 'Q'],
        turnRight: ['e', 'E'],
        shoot: [' '],
        hook: ['f', 'F'],
        dash: ['Shift'],
        weapon1: ['1'],
        weapon2: ['2'],
        weapon3: ['3'],
        weapon4: ['4'],
        weapon5: ['5']
    },
    p2: {
        forward: ['ArrowUp'],
        backward: ['ArrowDown'],
        left: ['ArrowLeft'],
        right: ['ArrowRight'],
        turnLeft: ['o', 'O'],
        turnRight: ['p', 'P'],
        shoot: ['Enter'],
        hook: ['l', 'L'],
        dash: ['Shift'],
        weapon1: ['7'],
        weapon2: ['8'],
        weapon3: ['9'],
        weapon4: ['0'],
        weapon5: ['-']
    }
};

export function createInputState() {
    return {
        forward: false,
        backward: false,
        left: false,
        right: false,
        turnLeft: false,
        turnRight: false,
        shoot: false,
        hook: false,
        dash: false,
        weaponSwitch: null
    };
}

function updateFromKeys(input, bindings) {
    input.forward = bindings.forward.some(k => keys[k]);
    input.backward = bindings.backward.some(k => keys[k]);
    input.left = bindings.left.some(k => keys[k]);
    input.right = bindings.right.some(k => keys[k]);
    input.turnLeft = bindings.turnLeft.some(k => keys[k]);
    input.turnRight = bindings.turnRight.some(k => keys[k]);
    input.shoot = bindings.shoot.some(k => keys[k]);
    input.hook = bindings.hook.some(k => keys[k]);
    input.dash = bindings.dash.some(k => keys[k]);

    const weaponKeys = [bindings.weapon1[0], bindings.weapon2[0], bindings.weapon3[0], bindings.weapon4[0], bindings.weapon5[0]];
    input.weaponSwitch = weaponKeys.findIndex(k => keys[k]) + 1;
    if (input.weaponSwitch > 0) {
        keys[weaponKeys[input.weaponSwitch - 1]] = false;
    }
}

export const p1Input = createInputState();
export const p2Input = createInputState();

export function updateInputs() {
    updateFromKeys(p1Input, PLAYER_BINDINGS.p1);
    updateFromKeys(p2Input, PLAYER_BINDINGS.p2);
}

export function resetInputs() {
    Object.assign(p1Input, createInputState());
    Object.assign(p2Input, createInputState());
}

export function isAnyDashPressed() {
    return p1Input.dash || p2Input.dash;
}
