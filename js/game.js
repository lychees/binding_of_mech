// 游戏核心：关卡启动、主循环、绘制、掉落物、HUD、小地图、撤离点
import { keys, bullets, particles, footprints, hooks, obstacles, enemies, drops, inventory, setCamera, cameraX, cameraY, WORLD_WIDTH, WORLD_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT, setMechBag, setPilotBag, world } from './config.js?v=2';
import { ENEMY_TEMPLATES, LEVELS } from './enemies.js?v=2';
import { WEAPONS } from './weapons.js?v=2';
import { addMoneyExp } from '../data/save.js?v=2';
import { createPilot, applyPilotToMech, applyPilotToPilotEntity, addPilotExp } from './pilots.js?v=2';
import { recordEnemyKill } from './enemyMechs.js?v=2';
import Mech from './classes/Mech.js?v=2';
import Enemy from './classes/Enemy.js?v=2';
import Pilot from './classes/Pilot.js?v=2';
import Bullet from './classes/Bullet.js?v=2';
import LaserBeam from './classes/LaserBeam.js?v=2';
import Missile from './classes/Missile.js?v=2';
import Particle, { createSpark } from './classes/Particle.js?v=2';
import Fortress from './classes/Fortress.js?v=2';
import { initAudio, playExplosionSound, playHitSound, playRepairSound, playPickupSound, playBGM, stopBGM } from './audio.js?v=2';
import { ALL_MODULES, calculateMechBuild } from './modules.js?v=2';
import { rollBlueprintDrops } from './blueprints.js?v=2';
import { dist, normalize } from './utils.js?v=2';
import { getPlayerSave, setPlayerSave, getWeaponEditorData } from './ui.js?v=2';
import { updateInputs, resetInputs, getInputState } from './engine/InputSystem.js?v=2';
import { gameTick, updateParticles, updateHooks } from './engine/GameLoopSystem.js?v=2';
import {
    initOnlineGame, setNetworkManager, resetOnlineGame, handleNetworkMessage,
    isOnlineGame, isOnlineHost, getNetworkPing, syncLocalPlayer, syncWorldState,
    updateRemotePlayer, broadcastAction, getRemotePlayer
} from './net/OnlineGame.js?v=2';
import { GridInventory, InventoryItem, createDropFromItem } from './inventory.js?v=2';

let _currentPlayerSave = null;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.ctx = ctx;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (typeof setCamera === 'function') {
        const center = getCameraCenter();
        setCamera(
            Math.max(0, Math.min(WORLD_WIDTH - canvas.width, center.x - canvas.width / 2)),
            Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, center.y - canvas.height / 2))
        );
    }
}
window.addEventListener('resize', resizeCanvas);

window.enemies = world.enemies;
window.obstacles = world.obstacles;
window.bullets = world.bullets;
window.particles = world.particles;
window.hooks = world.hooks;
window.drops = world.drops;
window.inventory = inventory;

let players = world.players;
let mech;
let pilot = world.pilot;
let isPilotActive = world.isPilotActive;
let currentLevel = null;
let missionMoney = 0;
let missionExp = 0;
let missionMaterials = 0;
let gameRunning = false;
let animationId = null;
let fortress = world.fortress;
const floatingTexts = world.floatingTexts;
let isMultiplayer = false;

export function getMech() { return mech; }
export function isGameRunning() { return gameRunning; }

export function stopGame() {
    gameRunning = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    stopBGM();
}

export function startLevel(level, playerSave, multiplayer = false) {
    _currentPlayerSave = playerSave;
    setPlayerSave(playerSave);
    window.__startLevelCalled = true;
    currentLevel = level;
    missionMoney = 0;
    missionExp = 0;
    missionMaterials = 0;
    isMultiplayer = multiplayer;

    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('levelSelect').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';

    resizeCanvas();
    updateControlHints(multiplayer);

    bullets.length = 0;
    particles.length = 0;
    footprints.length = 0;
    hooks.length = 0;
    obstacles.length = 0;
    enemies.length = 0;
    drops.length = 0;
    floatingTexts.length = 0;
    players.length = 0;
    world.fortress = null;
    world.pilot = null;
    world.isPilotActive = false;

    resetInputs();
    document.getElementById('missionResult').style.display = 'none';

    generateObstacles();
    generateTrees();
    generateCrates();
    generateEnemiesForLevel(level);

    fortress = null;
    world.fortress = null;
    if (level.id >= 3 && Math.random() < 0.3 + level.id * 0.1) {
        spawnFortress();
    }

    const activeMech = playerSave.mechs?.find(m => m.id === playerSave.activeMechId) || playerSave.mechs?.[0];
    const activePilot = playerSave.pilots?.find(p => p.id === playerSave.activePilotId) || playerSave.pilots?.[0];
    if (activeMech) {
        playerSave.mechBuild = activeMech.mechBuild;
    }

    const build = calculateMechBuild(playerSave.mechBuild);
    const spawnX = WORLD_WIDTH / 2;
    const spawnY = WORLD_HEIGHT / 2;

    const mechBag = GridInventory.fromJSON(activeMech?.mechInventory || playerSave.mechInventory || {});
    const pilotBag = GridInventory.fromJSON(playerSave.pilotInventory || {});
    setMechBag(mechBag);
    setPilotBag(pilotBag);

    mech = createPlayerMech(spawnX - (multiplayer ? 60 : 0), spawnY, build, playerSave, 'p1');
    mech.inventory = mechBag;
    if (activeMech?.color) mech.color = activeMech.color;
    if (activePilot) applyPilotToMech(mech, activePilot);
    players.push(mech);
    window.mech = mech;

    if (multiplayer) {
        const mech2 = createPlayerMech(spawnX + 60, spawnY, build, playerSave, 'p2');
        mech2.inventory = mechBag;
        players.push(mech2);
        window.mech2 = mech2;
    }

    pilot = null;
    isPilotActive = false;
    world.pilot = null;
    world.isPilotActive = false;

    import('./classes/Enemy.js').then(m => {
        m.setMechRef(mech);
        m.setPlayersRef(players);
    });
    import('./classes/Hook.js').then(m => m.setMechRef(mech));

    window.activePilot = activePilot || null;
    window.activeMech = activeMech || null;
    window.mechBag = mechBag;
    window.pilotBag = pilotBag;
    window.players = players;
    window.LEVELS = LEVELS;
    window.startLevel = startLevel;
    window.broadcastAction = broadcastAction;
    window.calculateMechBuild = calculateMechBuild;
    window.setupWeapons = setupWeapons;
    window.Mech = Mech;
    window.spawnDrops = spawnDrops;

    window.mouseX = canvas.width / 2;
    window.mouseY = canvas.height / 2;
    canvas.onmousemove = e => {
        const rect = canvas.getBoundingClientRect();
        window.mouseX = e.clientX - rect.left;
        window.mouseY = e.clientY - rect.top;
    };

    initAudio();
    playBGM();

    gameRunning = true;
    gameLoop();
}

function createPlayerMech(x, y, build, playerSave, tag) {
    const m = new Mech(x, y);
    m.playerTag = tag;
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
        isDead: false,

        variant: build.visualVariant || 'standard',
        color: build.visualColor || '#00d4ff',
        secondaryColor: build.visualSecondaryColor || '#4a5568',
        coreColor: build.coreColor || '#a0d0f0',
        legStyle: build.legStyle || 'biped',
        hasShoulderArmor: !!build.hasShoulderArmor,
        hasBackpack: !!build.hasBackpack,
        antennaCount: build.antennaCount || 0,
        extraPlating: build.extraPlating || 0,
        visorShape: build.visorShape || 'round'
    });
    setupWeapons(build, playerSave, m);
    return m;
}

function setupWeapons(build, playerSave, targetMech) {
    const weaponEditorData = getWeaponEditorData();
    const weaponList = [];
    const equipped = [];
    if (playerSave.mechBuild.weaponLeft?.moduleId) equipped.push(playerSave.mechBuild.weaponLeft.moduleId);
    if (playerSave.mechBuild.weaponRight?.moduleId && playerSave.mechBuild.weaponRight.moduleId !== playerSave.mechBuild.weaponLeft?.moduleId) {
        equipped.push(playerSave.mechBuild.weaponRight.moduleId);
    }
    const loadedKeys = new Set();
    equipped.forEach(moduleId => {
        const m = ALL_MODULES[moduleId];
        if (!m?.weaponKey) return;
        loadedKeys.add(m.weaponKey);
        const w = weaponEditorData[m.weaponKey];
        const slot = moduleId === playerSave.mechBuild.weaponLeft?.moduleId ? 'weaponLeft' : 'weaponRight';
        const partLevel = playerSave.mechBuild[slot]?.level || 1;
        const multiplier = 1 + (partLevel - 1) * 0.1;
        weaponList.push({
            ...w,
            damage: w.damage * multiplier * (1 + build.damageBonus),
            fireRate: Math.max(1, w.fireRate * (1 - (partLevel - 1) * 0.05)) / build.reloadSpeed,
            spread: w.spread * (1 - (partLevel - 1) * 0.1) * (1 - build.aimBonus)
        });
    });

    Object.keys(WEAPONS).forEach(key => {
        if (loadedKeys.has(key)) return;
        const w = weaponEditorData[key];
        weaponList.push({
            ...w,
            damage: w.damage * (1 + build.damageBonus),
            fireRate: Math.max(1, w.fireRate) / build.reloadSpeed,
            spread: w.spread * (1 - build.aimBonus)
        });
    });
    if (weaponList.length === 0) weaponList.push(weaponEditorData.VULCAN);

    targetMech.weaponList = weaponList;
    targetMech.currentWeapon = weaponList[0];
    targetMech.weaponKeys = ['1', '2', '3', '4', '5', '6', '7'].slice(0, weaponList.length);
}

function spawnFortress() {
    fortress = new Fortress(200 + Math.random() * (WORLD_WIDTH - 400), 200 + Math.random() * (WORLD_HEIGHT - 400));
    world.fortress = fortress;
    const guardCount = 6 + Math.floor(Math.random() * 6);
    for (let i = 0; i < guardCount; i++) {
        const minion = fortress.spawnMinion();
        enemies.push(new Enemy(minion.x, minion.y, minion.type));
    }
}

function generateObstacles() {
    for (let i = 0; i < 30; i++) {
        const type = Math.random() < 0.5 ? 'rock' : 'building';
        const width = 30 + Math.random() * 80;
        const height = 30 + Math.random() * 80;
        obstacles.push({
            x: Math.random() * (WORLD_WIDTH - width - 100) + 50,
            y: Math.random() * (WORLD_HEIGHT - height - 100) + 50,
            width, height, type,
            color: type === 'rock' ? '#555' : '#3a3a4a',
            health: type === 'rock' ? 50 : 100,
            maxHealth: type === 'rock' ? 50 : 100
        });
    }
}

function generateTrees() {
    for (let i = 0; i < 60; i++) {
        const size = 15 + Math.random() * 25;
        obstacles.push({
            x: Math.random() * (WORLD_WIDTH - size * 2 - 100) + 50,
            y: Math.random() * (WORLD_HEIGHT - size * 2 - 100) + 50,
            width: size, height: size,
            type: 'tree',
            color: '#2a5a2a',
            trunkColor: '#5a3a2a',
            health: 20, maxHealth: 20,
            isTree: true
        });
    }
}

function generateCrates() {
    for (let i = 0; i < 5 + Math.floor(Math.random() * 6); i++) {
        const type = Math.random() < 0.6 ? 'alloySteel' : 'darkFuel';
        drops.push({
            x: Math.random() * (WORLD_WIDTH - 200) + 100,
            y: Math.random() * (WORLD_HEIGHT - 200) + 100,
            type: 'crate',
            crateType: type,
            amount: type === 'alloySteel' ? 10 + Math.floor(Math.random() * 6) : 5 + Math.floor(Math.random() * 4),
            radius: 12,
            color: type === 'alloySteel' ? '#a0a0a0' : '#4a0080',
            life: 1200
        });
    }
}

function generateEnemiesForLevel(level) {
    let types = level.enemyTypes;
    if (types.includes('all')) types = Object.keys(ENEMY_TEMPLATES);
    for (let i = 0; i < level.enemyCount; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        enemies.push(new Enemy(Math.random() * (WORLD_WIDTH - 200) + 100, Math.random() * (WORLD_HEIGHT - 200) + 100, type));
    }
}

function gameLoop() {
    if (!gameRunning) return;
    gameTick(ctx, {
        camera: updateCamera,
        fortress: updateFortress,
        ai: updateEnemies,
        player: updatePlayers,
        online: updateOnline,
        pilot: updatePilot,
        particles: updateParticles,
        hooks: updateHooks,
        drops: () => { updateDrops(); updateFloatingTexts(); },
        hud: () => {
            if (isOnlineGame()) {
                const remote = getRemotePlayer();
                if (remote && !remote.isDead) remote.draw();
            }
            drawWeaponUI();
            drawMinimap();
            updateHUD();
        }
    });
    if (checkGameOver()) return;
    checkMissionEnd();
    animationId = requestAnimationFrame(gameLoop);
}

function updateCamera() {
    const cameraTarget = isPilotActive && pilot && !pilot.isDead ? pilot : getCameraCenter();
    setCamera(
        Math.max(0, Math.min(WORLD_WIDTH - canvas.width, cameraTarget.x - canvas.width / 2)),
        Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, cameraTarget.y - canvas.height / 2))
    );
}

function updateFortress() {
    if (!fortress) return;
    const minion = fortress.update(mech, pilot, isPilotActive);
    if (minion) enemies.push(new Enemy(minion.x, minion.y, minion.type));
    if (fortress.isDead) {
        missionMoney += 500;
        missionExp += 200;
        getPlayerSave().materials += 50;
        particles.push(...createSpark(fortress.x, fortress.y, '#ff8800', 100, 8));
        spawnFortressWreckage(fortress.x, fortress.y);
        fortress = null;
        world.fortress = null;
    }
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].update();
        if (enemies[i].isDead || enemies[i].health <= 0) {
            const template = ENEMY_TEMPLATES[enemies[i].templateKey];
            if (template) spawnDrops(enemies[i].x, enemies[i].y, template, 'enemy');
            enemies.splice(i, 1);
        }
    }
}

function updatePlayers() {
    if (!isPilotActive) {
        if (getInputState('p1').eject) {
            ejectPilot();
        }
    }
    for (const p of players) {
        if (p.isDead) continue;
        if (isOnlineGame() && p.playerTag === 'remote') continue;
        const input = p === players[0] ? getInputState('p1') : getInputState('p2');
        if (!input) continue;
        p.update(input);
    }
}

function updateOnline() {
    if (!isOnlineGame()) return;
    updateRemotePlayer();
    syncLocalPlayer(mech);
    syncWorldState({ enemies, drops });
}

function updatePilot() {
    if (!isPilotActive || !pilot) return;
    pilot.update();
    for (const p of players) {
        if (p.isDead) continue;
        const distToMech = dist(pilot.x, pilot.y, p.x, p.y);
        if (distToMech < 40 && getInputState('p1').useItem) {
            if (p.health <= 0) p.health = p.maxHealth * 0.3;
            p.isDead = false;
            p.alreadyExploded = false;
            p.isPilotEjected = false;
            p.x = pilot.x;
            p.y = pilot.y;
            isPilotActive = false;
            pilot = null;
            world.isPilotActive = false;
            world.pilot = null;
            break;
        }
    }
}

function checkGameOver() {
    if (!isPilotActive) {
        const alivePlayers = players.filter(p => !p.isDead);
        if (alivePlayers.length === 0) {
            for (const p of players) destroyMech(p);
            gameRunning = false;
            showMissionResult(false);
            return true;
        }
    } else {
        for (const p of players) {
            if (p.isDead) destroyMech(p);
        }
        if (pilot?.isDead) {
            gameRunning = false;
            showMissionResult(false);
            return true;
        }
    }
    return false;
}

function checkMissionEnd() {
    if (enemies.length === 0 && !fortress && gameRunning) {
        gameRunning = false;
        showMissionResult(true);
    }
}

function getCameraCenter() {
    if (players.length === 0) return { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };
    const remote = getRemotePlayer();
    const list = [...players];
    if (isOnlineGame() && remote) list.push(remote);
    const alive = list.filter(p => !p.isDead);
    const targets = alive.length > 0 ? alive : list;
    const x = targets.reduce((s, p) => s + p.x, 0) / targets.length;
    const y = targets.reduce((s, p) => s + p.y, 0) / targets.length;
    return { x, y };
}

function updateControlHints(showP2) {
    const p2Controls = document.getElementById('p2Controls');
    const p2ActionControls = document.getElementById('p2ActionControls');
    if (p2Controls) p2Controls.style.display = showP2 ? 'block' : 'none';
    if (p2ActionControls) p2ActionControls.style.display = showP2 ? 'block' : 'none';
}

export function resizeGameCanvas() {
    resizeCanvas();
}

function spawnDrops(x, y, template, source) {
    missionExp += template.exp || 0;
    drops.push({
        x, y,
        type: 'money',
        amount: template.money || 0,
        radius: 8,
        color: '#ffaa44',
        life: 600
    });
    if (source === 'enemy') {
        recordEnemyKill(_currentPlayerSave, template.drawType);

        if (Math.random() < 0.3) {
            const repairAmount = Math.floor(Math.random() * 2) + 1;
            const item = new InventoryItem('repairKit', repairAmount);
            drops.push(createDropFromItem(item, x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 20));
        }
        if (Math.random() < 0.15) {
            const type = Math.random() < 0.6 ? 'alloySteel' : 'darkFuel';
            const amount = type === 'alloySteel' ? 5 + Math.floor(Math.random() * 6) : 3 + Math.floor(Math.random() * 4);
            const item = new InventoryItem(type, amount);
            drops.push(createDropFromItem(item, x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30));
        }
        if (Math.random() < 0.08) {
            const item = new InventoryItem('firstAidKit', 1);
            drops.push(createDropFromItem(item, x + (Math.random() - 0.5) * 25, y + (Math.random() - 0.5) * 25));
        }
        if (Math.random() < 0.05) {
            const item = new InventoryItem('energyCell', 1);
            drops.push(createDropFromItem(item, x + (Math.random() - 0.5) * 25, y + (Math.random() - 0.5) * 25));
        }
    }
}

function spawnFortressWreckage(x, y) {
    obstacles.push({
        x: x - 60, y: y - 60,
        width: 120, height: 120,
        type: 'wreckage',
        color: '#3a2a2a',
        health: 0, maxHealth: 1,
        isWreckage: true
    });

    for (let i = 0; i < 5; i++) {
        const type = Math.random() < 0.5 ? 'alloySteel' : 'darkFuel';
        const amount = type === 'alloySteel' ? 15 + Math.floor(Math.random() * 11) : 8 + Math.floor(Math.random() * 7);
        const item = new InventoryItem(type, amount);
        drops.push(createDropFromItem(item, x + (Math.random() - 0.5) * 80, y + (Math.random() - 0.5) * 80));
    }

    if (Math.random() < 0.5) {
        const item = new InventoryItem('dataCore', 1);
        drops.push(createDropFromItem(item, x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 60));
    }

    if (Math.random() < 0.25) {
        const item = new InventoryItem('ammoBox', 1);
        drops.push(createDropFromItem(item, x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 60));
    }

    const repairItem = new InventoryItem('repairKit', 3 + Math.floor(Math.random() * 4));
    drops.push(createDropFromItem(repairItem, x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 60));
}

function ejectPilot() {
    if (isPilotActive || !mech) return;
    isPilotActive = true;
    world.isPilotActive = true;
    mech.isPilotEjected = true;
    pilot = new Pilot(mech.x, mech.y);
    world.pilot = pilot;
    pilot.inventory = window.pilotBag;
    if (window.activePilot) applyPilotToPilotEntity(pilot, window.activePilot);
    particles.push(...createSpark(mech.x, mech.y, '#ffcc00', 10, 4));
}

function destroyMech(target) {
    if (!target) return;
    if (target.alreadyExploded) return;
    target.alreadyExploded = true;
    playExplosionSound('large');
    particles.push(...createSpark(target.x, target.y, '#ff4444', 60, 7));
    particles.push(...createSpark(target.x, target.y, '#ff8800', 40, 5));
    particles.push(...createSpark(target.x, target.y, '#ffcc00', 30, 4));
    target.health = 0;
    target.isDead = true;
    target.velocityX = 0;
    target.velocityY = 0;
}

function drawWeaponUI() {
    if (isPilotActive) return;
    if (players.length === 0) return;
    const active = players.find(p => !p.isDead) || players[0];
    const startX = canvas.width - 150;
    const startY = 20;
    const itemHeight = 35;
    for (let i = 0; i < active.weaponList.length; i++) {
        const w = active.weaponList[i];
        const isActive = w === active.currentWeapon;
        const y = startY + i * itemHeight;
        ctx.fillStyle = isActive ? 'rgba(0, 200, 255, 0.3)' : 'rgba(50, 50, 50, 0.5)';
        ctx.fillRect(startX, y, 130, 30);
        ctx.strokeStyle = isActive ? '#00d4ff' : '#555';
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.strokeRect(startX, y, 130, 30);
        ctx.fillStyle = w.color;
        ctx.fillRect(startX + 5, y + 8, 14, 14);
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.fillText((i + 1) + '. ' + w.name, startX + 24, y + 20);
    }
}

function updateHUD() {
    document.getElementById('hudMoney').textContent = missionMoney;
    document.getElementById('hudExp').textContent = missionExp;
    document.getElementById('hudMaterials').textContent = missionMaterials;
    document.getElementById('hudEnemies').textContent = enemies.length;
    const activeBag = isPilotActive && pilot ? window.pilotBag : window.mechBag;
    const used = activeBag ? activeBag.usedCells : 0;
    const total = activeBag ? activeBag.totalCells : 0;
    const weight = activeBag ? activeBag.totalWeight.toFixed(1) : 0;
    const maxWeight = activeBag ? activeBag.maxWeight : 0;
    const repairEl = document.getElementById('hudRepair');
    if (repairEl) {
        repairEl.textContent = `${used}/${total} 格 ${weight}/${maxWeight}kg`;
        repairEl.parentElement.title = `按 I 打开背包，按 R 快速使用${isPilotActive ? '急救包' : '修理包'}`;
    }

    const onlineStatus = document.getElementById('onlineStatus');
    const netPing = document.getElementById('netPing');
    if (onlineStatus && isOnlineGame()) {
        onlineStatus.style.display = 'block';
        netPing.textContent = getNetworkPing();
    } else if (onlineStatus) {
        onlineStatus.style.display = 'none';
    }

    const hudEvac = document.getElementById('hudEvac');
    if (hudEvac) {
        hudEvac.style.display = 'none';
    }

    drawPlayerHealthBars();
    drawLaserChargeBar();
}

function drawLaserChargeBar() {
    const active = isPilotActive && pilot ? null : (players.find(p => !p.isDead) || players[0]);
    if (!active || active.isDead) return;
    if (active.currentWeapon?.drawType !== 'laser' || !active.isChargingLaser) return;

    const barWidth = 120;
    const barHeight = 10;
    const x = 10;
    const y = 110;
    const ratio = active.laserCharge / active.maxLaserCharge;
    const ready = ratio >= active.laserChargeThreshold / active.maxLaserCharge;

    ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.fillStyle = ready ? '#ff66cc' : '#ffaa44';
    ctx.fillRect(x, y, barWidth * ratio, barHeight);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText(ready ? 'CHARGE MAX' : 'CHARGING', x, y + 22);
}

function drawPlayerHealthBars() {
    const barWidth = 200;
    const barHeight = 16;
    const barX = 10;
    const gap = 24;

    const targets = isPilotActive && pilot ? [pilot] : players.filter(p => !p.isDead);
    if (targets.length === 0) targets.push(...players);
    const remote = getRemotePlayer();
    if (isOnlineGame() && remote) targets.push(remote);

    targets.forEach((target, idx) => {
        const barY = 10 + idx * (barHeight + gap + 8);
        const healthRatio = target.health / target.maxHealth;

        ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = healthRatio > 0.6 ? '#00ff88' : healthRatio > 0.3 ? '#ffaa00' : '#ff4444';
        ctx.fillRect(barX, barY, barWidth * healthRatio, barHeight);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px monospace';
        let tag = target.playerTag ? `P${target.playerTag === 'p1' ? '1' : target.playerTag === 'remote' ? '远程' : '2'}` : 'Pilot';
        ctx.fillText(`${tag}: ${Math.ceil(target.health)} / ${Math.ceil(target.maxHealth)}`, barX + barWidth / 2 - 45, barY + 12);

        if (target.armor > 0) {
            ctx.fillStyle = '#00d4ff';
            ctx.font = '11px monospace';
            ctx.fillText('装甲: ' + Math.floor(target.armor * 100) + '%', barX, barY + 28);
        }
    });
}

function updateDrops() {
    for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.life--;
        if (d.life <= 0) {
            drops.splice(i, 1);
            continue;
        }

        const pickupTargets = isPilotActive && pilot ? [pilot] : players.filter(p => !p.isDead);
        let picked = false;
        let picker = null;
        for (const t of pickupTargets) {
            if (dist(t.x, t.y, d.x, d.y) < 30) {
                picked = true;
                picker = t;
                break;
            }
        }
        if (picked) {
            if (d.type === 'money') {
                playPickupSound();
                missionMoney += d.amount;
                drops.splice(i, 1);
            } else if (d.type === 'item') {
                const bag = isPilotActive && pilot ? window.pilotBag : window.mechBag;
                const result = bag.addItem(d.item);
                if (result.success) {
                    playPickupSound();
                    showFloatingText(d.x, d.y - 20, `+${d.item.amount} ${d.item.def.name}`);
                    drops.splice(i, 1);
                } else {
                    if (picker === pickupTargets[0]) {
                        showFloatingText(d.x, d.y - 30, '背包已满');
                    }
                }
            } else if (d.type === 'repair') {
                playPickupSound();
                inventory.repairKits++;
                drops.splice(i, 1);
            } else if (d.type === 'crate') {
                playPickupSound();
                const materialName = d.crateType === 'alloySteel' ? '合金钢材' : '暗星燃料';
                showFloatingText(d.x, d.y - 20, `+${d.amount} ${materialName}`);
                missionMaterials += d.amount;
                drops.splice(i, 1);
            }
        }
    }
}

function showFloatingText(x, y, text) {
    floatingTexts.push({ x, y, text, life: 60, maxLife: 60, vy: -1 });
}

function updateFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.vy;
        ft.life--;
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }
}

function drawMinimap() {
    const mapSize = 150;
    const mapX = canvas.width - mapSize - 10;
    const mapY = canvas.height - mapSize - 10;
    const scaleX = mapSize / WORLD_WIDTH;
    const scaleY = mapSize / WORLD_HEIGHT;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize);

    for (const obs of obstacles) {
        ctx.fillStyle = obs.isTree ? '#2a5a2a' : '#555';
        ctx.fillRect(mapX + obs.x * scaleX, mapY + obs.y * scaleY, Math.max(2, obs.width * scaleX), Math.max(2, obs.height * scaleY));
    }

    for (const e of enemies) {
        ctx.fillStyle = e.color;
        ctx.fillRect(mapX + e.x * scaleX - 1, mapY + e.y * scaleY - 1, 3, 3);
    }

    for (const p of players) {
        ctx.fillStyle = p.playerTag === 'p1' ? '#00d4ff' : p.playerTag === 'remote' ? '#ffaa44' : '#00ff88';
        ctx.beginPath();
        ctx.arc(mapX + p.x * scaleX, mapY + p.y * scaleY, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX + cameraX * scaleX, mapY + cameraY * scaleY, canvas.width * scaleX, canvas.height * scaleY);
}

function showMissionResult(won) {
    const playerSave = getPlayerSave();
    if (!playerSave) {
        console.error('showMissionResult: playerSave is undefined');
        return;
    }
    const blueprintDrops = won ? rollBlueprintDrops(currentLevel ? currentLevel.id : 1) : [];
    const result = document.getElementById('missionResult');
    document.getElementById('resultTitle').textContent = won ? '任务完成' : '任务失败';
    document.getElementById('rewardMoney').textContent = missionMoney;
    document.getElementById('rewardExp').textContent = missionExp;
    document.getElementById('rewardMaterials').textContent = missionMaterials;

    if (blueprintDrops.length > 0) {
        for (const bp of blueprintDrops) {
            if (!playerSave.blueprints.includes(bp)) playerSave.blueprints.push(bp);
        }
        const bpNames = blueprintDrops.map(id => ALL_MODULES[id]?.name || id).join(', ');
        setTimeout(() => alert('获得蓝图: ' + bpNames), 100);
    }
    result.style.display = 'block';

    if (won) {
        addMoneyExp(playerSave, missionMoney, missionExp, missionMaterials);
        // 分配经验给出战驾驶员
        if (window.activePilot) {
            addPilotExp(window.activePilot, missionExp);
        }
        if (currentLevel && !playerSave.levelsCompleted.includes(currentLevel.id)) {
            playerSave.levelsCompleted.push(currentLevel.id);
            playerSave.highestLevel = Math.max(playerSave.highestLevel, currentLevel.id);
        }
        const nextLevel = LEVELS.find(l => l.id === currentLevel.id + 1);
        if (nextLevel) nextLevel.unlocked = true;
    }
    if (window.mechBag) playerSave.mechInventory = window.mechBag.toJSON();
    if (window.pilotBag) playerSave.pilotInventory = window.pilotBag.toJSON();
    // 同步当前出战机甲的 build 和 inventory
    if (window.activeMech) {
        const idx = playerSave.mechs.findIndex(m => m.id === window.activeMech.id);
        if (idx >= 0) {
            playerSave.mechs[idx].mechBuild = JSON.parse(JSON.stringify(window.activeMech.mechBuild || playerSave.mechBuild));
            playerSave.mechs[idx].mechInventory = window.mechBag.toJSON();
        }
    }
    saveGame(playerSave);
    setPlayerSave(playerSave);
    if (window.hideInventory) window.hideInventory();
}

// 输入处理
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
        e.preventDefault();
        // 激光炮在 Mech.update 中通过长按检测蓄力，这里不再直接调用 shoot
        const active = mech || players.find(p => !p.isDead);
        if (active && active.currentWeapon?.drawType !== 'laser') {
            if (!isMultiplayer && !isOnlineGame()) active.shoot();
            if (isOnlineGame()) {
                active.shoot();
                broadcastAction('shoot');
            }
        }
    }
    if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        if (mech && !isMultiplayer && !isOnlineGame()) mech.fireHook();
        if (mech && isOnlineGame()) {
            mech.fireHook();
            broadcastAction('hook');
        }
    }
    if (e.key === 'Shift') e.preventDefault();
    if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        if (window.toggleInventory) window.toggleInventory();
    }
    if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        const p1 = getInputState('p1');
        p1.useItem = true;
    }
    if (e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        const p1 = getInputState('p1');
        p1.eject = true;
    }
    if (e.key === 'Escape') {
        stopGame();
        if (isOnlineGame()) resetOnlineGame();
        window.showMainMenu();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    if (e.key === 'r' || e.key === 'R') {
        const p1 = getInputState('p1');
        if (p1) p1.useItem = false;
    }
    if (e.key === 'x' || e.key === 'X') {
        const p1 = getInputState('p1');
        if (p1) p1.eject = false;
    }
});
