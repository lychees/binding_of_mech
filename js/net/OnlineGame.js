import NetworkManager from './NetworkManager.js?v=2';
import Enemy from '../classes/Enemy.js?v=2';
import { ENEMY_TEMPLATES } from '../enemies.js?v=2';

let net = null;
let isHost = false;
let remotePlayer = null;
let sendCounter = 0;
let worldStateCounter = 0;
let lastRemoteState = null;
let remoteTarget = { x: 0, y: 0, bodyAngle: 0, upperAngle: 0, weaponAngle: 0 };
let seed = 0;

export function initOnlineGame() {
    if (!net) net = new NetworkManager();
    return net;
}

export function getNetworkManager() {
    return net;
}

export function isOnlineGame() {
    return net !== null;
}

export function isOnlineHost() {
    return isHost;
}

export function setNetworkManager(manager, hostFlag) {
    net = manager;
    isHost = hostFlag;
}

export function resetOnlineGame() {
    net = null;
    isHost = false;
    remotePlayer = null;
    lastRemoteState = null;
    remoteTarget = { x: 0, y: 0, bodyAngle: 0, upperAngle: 0, weaponAngle: 0 };
}

export function createRemoteMech(MechClass, x, y, build, playerSave) {
    const m = new MechClass(x, y);
    m.playerTag = 'remote';
    Object.assign(m, {
        maxSpeed: build.maxSpeed,
        dashMaxCooldown: build.dashCooldown,
        maxHealth: build.maxHealth,
        health: build.maxHealth,
        armor: build.armor,
        maxEnergy: build.maxEnergy,
        currentEnergy: build.maxEnergy,
        damageBonus: build.damageBonus,
        reloadSpeed: build.reloadSpeed,
        meleeDamage: build.meleeDamage,
        aimBonus: build.aimBonus,
        cooldownReduction: build.cooldownReduction,
        energyRegen: build.energyRegen,
        maxShield: build.shield,
        shield: build.shield,
        repairRate: build.repairRate,
        isDead: false
    });
    if (window.setupWeapons) window.setupWeapons(build, playerSave, m);
    remotePlayer = m;
    return m;
}

export function handleNetworkMessage(msg, gameState) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
        case 'playerState': {
            lastRemoteState = msg;
            remoteTarget.x = msg.x || 0;
            remoteTarget.y = msg.y || 0;
            remoteTarget.bodyAngle = msg.bodyAngle || 0;
            remoteTarget.upperAngle = msg.upperAngle || 0;
            remoteTarget.weaponAngle = msg.weaponAngle || 0;
            if (remotePlayer) {
                remotePlayer.health = msg.health ?? remotePlayer.health;
                remotePlayer.currentWeapon = findWeapon(remotePlayer, msg.currentWeapon) || remotePlayer.currentWeapon;
            }
            break;
        }
        case 'playerAction': {
            if (!remotePlayer) return;
            if (msg.actionType === 'shoot') remotePlayer.shoot();
            if (msg.actionType === 'hook') remotePlayer.fireHook();
            if (msg.actionType === 'dash') {
                remotePlayer.isDashing = true;
                remotePlayer.dashDuration = remotePlayer.dashMaxDuration;
                remotePlayer.dashCooldown = remotePlayer.dashMaxCooldown;
                remotePlayer.dashDirectionX = msg.dx || 0;
                remotePlayer.dashDirectionY = msg.dy || 0;
            }
            if (msg.actionType === 'weaponSwitch') {
                const idx = msg.index || 0;
                if (idx >= 0 && idx < remotePlayer.weaponList.length) {
                    remotePlayer.currentWeapon = remotePlayer.weaponList[idx];
                }
            }
            break;
        }
        case 'worldState': {
            if (isHost) return;
            applyWorldState(msg, gameState);
            break;
        }
        case 'gameStarted': {
            seed = msg.seed || Date.now();
            startOnlineLevel(msg.levelId, gameState);
            break;
        }
        case 'peerDisconnected': {
            alert('对方已断开连接');
            if (gameState.stopGame) gameState.stopGame();
            if (window.showMainMenu) window.showMainMenu();
            resetOnlineGame();
            break;
        }
    }
}

function findWeapon(mech, weaponName) {
    if (!weaponName || !mech.weaponList) return null;
    return mech.weaponList.find(w => w.name === weaponName || w.drawType === weaponName);
}

function applyWorldState(state, gameState) {
    if (!state) return;
    if (state.enemies && Array.isArray(state.enemies)) {
        gameState.enemies.length = 0;
        for (const e of state.enemies) {
            const enemy = new Enemy(e.x, e.y, e.templateKey);
            enemy.health = e.health;
            enemy.angle = e.angle;
            gameState.enemies.push(enemy);
        }
    }
    if (state.drops && Array.isArray(state.drops)) {
        gameState.drops.length = 0;
        gameState.drops.push(...state.drops);
    }
    if (state.evacuationPoint) {
        Object.assign(gameState.evacuationPoint || {}, state.evacuationPoint);
    }
}

function startOnlineLevel(levelId, gameState) {
    if (!window.startLevel || !window.LEVELS) return;
    const level = window.LEVELS.find(l => l.id === levelId) || window.LEVELS[0];
    if (!level) return;

    // 重置玩家列表，由 startLevel 创建本机机甲，随后追加远端机甲
    window.players = [];
    window.startLevel(level, gameState.playerSave, false);

    if (window.players.length > 0 && window.Mech) {
        const build = window.calculateMechBuild ? window.calculateMechBuild(gameState.playerSave.mechBuild) : {};
        const remoteX = (window.players[0]?.x || 0) + 120;
        const remoteY = (window.players[0]?.y || 0);
        const remote = createRemoteMech(window.Mech, remoteX, remoteY, build, gameState.playerSave);
        window.players.push(remote);
    }
}

export function updateRemotePlayer() {
    if (!remotePlayer) return;
    const t = 0.25;
    remotePlayer.x += (remoteTarget.x - remotePlayer.x) * t;
    remotePlayer.y += (remoteTarget.y - remotePlayer.y) * t;
    remotePlayer.bodyAngle += (remoteTarget.bodyAngle - remotePlayer.bodyAngle) * t;
    remotePlayer.upperAngle += (remoteTarget.upperAngle - remotePlayer.upperAngle) * t;
    remotePlayer.weaponAngle += (remoteTarget.weaponAngle - remotePlayer.weaponAngle) * t;
}

export function syncLocalPlayer(localMech) {
    if (!net || !localMech) return;
    sendCounter++;
    if (sendCounter % 3 !== 0) return; // ~20 fps at 60fps
    net.sendPlayerState({
        x: localMech.x,
        y: localMech.y,
        bodyAngle: localMech.bodyAngle,
        upperAngle: localMech.upperAngle,
        weaponAngle: localMech.weaponAngle,
        currentWeapon: localMech.currentWeapon?.name || localMech.currentWeapon?.drawType,
        health: localMech.health
    });
}

export function syncWorldState(gameState) {
    if (!net || !isHost) return;
    worldStateCounter++;
    if (worldStateCounter % 10 !== 0) return;
    net.sendWorldState({
        enemies: gameState.enemies.map(e => ({
            x: e.x, y: e.y, health: e.health, angle: e.angle,
            templateKey: e.templateKey, size: e.size
        })),
        drops: gameState.drops.map(d => ({ ...d })),
        evacuationPoint: gameState.evacuationPoint ? { ...gameState.evacuationPoint } : null
    });
}

export function broadcastAction(actionType, payload = {}) {
    if (!net) return;
    net.sendPlayerAction({ actionType, ...payload });
}

export function getRemotePlayer() {
    return remotePlayer;
}

export function getNetworkPing() {
    return net ? net.ping : 0;
}
