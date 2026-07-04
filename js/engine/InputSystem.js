import { keys } from '../config.js?v=2';

const PLAYER_BINDINGS = {
    p1: {
        forward: ['w', 'W'],
        backward: ['s', 'S'],
        strafeLeft: ['a', 'A'],
        strafeRight: ['d', 'D'],
        turnLeft: ['q', 'Q'],
        turnRight: ['e', 'E'],
        weaponLeft: ['ArrowLeft'],
        weaponRight: ['ArrowRight'],
        shoot: [' '],
        hook: ['f', 'F'],
        dash: ['Shift'],
        weapon1: ['1'],
        weapon2: ['2'],
        weapon3: ['3'],
        weapon4: ['4'],
        weapon5: ['5'],
        weapon6: ['6'],
        weapon7: ['7'],
        eject: ['x', 'X'],
        inventory: ['i', 'I'],
        useItem: ['r', 'R']
    },
    p2: {
        forward: ['ArrowUp'],
        backward: ['ArrowDown'],
        strafeLeft: [],
        strafeRight: [],
        turnLeft: ['o', 'O'],
        turnRight: ['p', 'P'],
        weaponLeft: ['7'],
        weaponRight: ['8'],
        shoot: ['Enter'],
        hook: ['l', 'L'],
        dash: ['Shift'],
        weapon1: ['7'],
        weapon2: ['8'],
        weapon3: ['9'],
        weapon4: ['0'],
        weapon5: ['-'],
        weapon6: ['='],
        weapon7: ['Backspace'],
        eject: [],
        inventory: [],
        useItem: []
    }
};

export const DEFAULT_BINDINGS = PLAYER_BINDINGS;

export function createInputState() {
    return {
        forward: false,
        backward: false,
        left: false,
        right: false,
        strafeLeft: false,
        strafeRight: false,
        turnLeft: false,
        turnRight: false,
        weaponLeft: false,
        weaponRight: false,
        shoot: false,
        hook: false,
        dash: false,
        weaponSwitch: null,
        eject: false,
        inventory: false,
        useItem: false
    };
}

export function createKeyboardSource(bindings) {
    const state = createInputState();
    return {
        type: 'keyboard',
        state,
        update() { updateFromKeys(state, bindings); }
    };
}

export function createNetworkSource() {
    return {
        type: 'network',
        state: createInputState(),
        lastState: null,
        update() {
            // 网络状态由 OnlineGame.js 通过 setNetworkInput 设置
        },
        set(s) {
            Object.assign(this.state, s);
            this.lastState = { ...s };
        }
    };
}

function updateFromKeys(input, bindings) {
    input.forward = bindings.forward.some(k => keys[k]);
    input.backward = bindings.backward.some(k => keys[k]);
    input.strafeLeft = bindings.strafeLeft.some(k => keys[k]);
    input.strafeRight = bindings.strafeRight.some(k => keys[k]);
    input.left = input.strafeLeft;
    input.right = input.strafeRight;
    input.turnLeft = bindings.turnLeft.some(k => keys[k]);
    input.turnRight = bindings.turnRight.some(k => keys[k]);
    input.weaponLeft = bindings.weaponLeft.some(k => keys[k]);
    input.weaponRight = bindings.weaponRight.some(k => keys[k]);
    input.shoot = bindings.shoot.some(k => keys[k]);
    input.hook = bindings.hook.some(k => keys[k]);
    input.dash = bindings.dash.some(k => keys[k]);
    input.eject = bindings.eject?.some(k => keys[k]) || false;
    input.inventory = bindings.inventory?.some(k => keys[k]) || false;
    input.useItem = bindings.useItem?.some(k => keys[k]) || false;

    const weaponKeys = [
        bindings.weapon1?.[0],
        bindings.weapon2?.[0],
        bindings.weapon3?.[0],
        bindings.weapon4?.[0],
        bindings.weapon5?.[0],
        bindings.weapon6?.[0],
        bindings.weapon7?.[0]
    ];
    const idx = weaponKeys.findIndex(k => k && keys[k]);
    input.weaponSwitch = idx >= 0 ? idx + 1 : null;
    if (input.weaponSwitch) {
        keys[weaponKeys[input.weaponSwitch - 1]] = false;
    }
}

export const inputSources = {
    p1: createKeyboardSource(PLAYER_BINDINGS.p1),
    p2: createKeyboardSource(PLAYER_BINDINGS.p2),
    network: createNetworkSource()
};

export function getInputState(sourceId) {
    return inputSources[sourceId]?.state || createInputState();
}

export function updateInputs() {
    inputSources.p1.update();
    inputSources.p2.update();
}

export function resetInputs() {
    Object.assign(inputSources.p1.state, createInputState());
    Object.assign(inputSources.p2.state, createInputState());
    Object.assign(inputSources.network.state, createInputState());
}

export function setNetworkInput(state) {
    inputSources.network.set(state);
}

export function isAnyDashPressed() {
    return inputSources.p1.state.dash || inputSources.p2.state.dash;
}
