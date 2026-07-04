// 游戏核心：关卡启动、主循环、绘制、掉落物、HUD、小地图、撤离点
import { keys, bullets, particles, footprints, hooks, obstacles, enemies, drops, inventory, setCamera, cameraX, cameraY, WORLD_WIDTH, WORLD_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT, setMechBag, setPilotBag } from './config.js?v=2';
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
import Particle, { createSpark } from './classes/Particle.js?v=2';
import Fortress from './classes/Fortress.js?v=2';
import { initAudio, playExplosionSound, playHitSound, playRepairSound, playPickupSound, playBGM, stopBGM } from './audio.js?v=2';
import { ALL_MODULES, calculateMechBuild } from './modules.js?v=2';
import { rollBlueprintDrops } from './blueprints.js?v=2';
import { dist, normalize } from './utils.js?v=2';
import { getPlayerSave, setPlayerSave, getWeaponEditorData } from './ui.js?v=2';
import { updateInputs, p1Input, p2Input, resetInputs } from './input.js?v=2';
import {
    initOnlineGame, setNetworkManager, resetOnlineGame, handleNetworkMessage,
    isOnlineGame, isOnlineHost, getNetworkPing, syncLocalPlayer, syncWorldState,
    updateRemotePlayer, broadcastAction, getRemotePlayer
} from './net/OnlineGame.js?v=2';
import { GridInventory, InventoryItem, createDropFromItem, ITEM_RARITY } from './inventory.js?v=2';

let _currentPlayerSave = null;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
window.ctx = ctx;

window.enemies = enemies;
window.obstacles = obstacles;
window.bullets = bullets;
window.particles = particles;
window.hooks = hooks;
window.drops = drops;
window.inventory = inventory;

let players = [];
let mech;
let pilot = null;
let isPilotActive = false;
let currentLevel = null;
let missionMoney = 0;
let missionExp = 0;
let missionMaterials = 0;
let gameRunning = false;
let animationId = null;
let fortress = null;
const floatingTexts = [];
let evacuationPoint = null;
let evacuationHoldTime = 0;
const EVACUATION_HOLD_REQUIRED = 90;
let evacuationPromptShown = false;
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
    window.evacuationPoint = null;
    currentLevel = level;
    missionMoney = 0;
    missionExp = 0;
    missionMaterials = 0;
    isMultiplayer = multiplayer;

    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('levelSelect').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';

    bullets.length = 0;
    particles.length = 0;
    footprints.length = 0;
    hooks.length = 0;
    obstacles.length = 0;
    enemies.length = 0;
    drops.length = 0;
    floatingTexts.length = 0;
    players = [];
    evacuationPoint = null;
    evacuationHoldTime = 0;
    evacuationPromptShown = false;

    resetInputs();
    document.getElementById('missionResult').style.display = 'none';

    generateObstacles();
    generateTrees();
    generateCrates();
    generateEvacuationPoint();
    generateEnemiesForLevel(level);

    fortress = null;
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
    if (activeMech?.color) mech.bodyColor = activeMech.color;
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
        isDead: false
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
    targetMech.weaponKeys = ['1', '2', '3', '4', '5'].slice(0, weaponList.length);
}

function spawnFortress() {
    fortress = new Fortress(200 + Math.random() * (WORLD_WIDTH - 400), 200 + Math.random() * (WORLD_HEIGHT - 400));
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

function generateEvacuationPoint() {
    window.__evacGenCalled = true;
    const margin = 150;
    evacuationPoint = {
        x: margin + Math.random() * (WORLD_WIDTH - margin * 2),
        y: margin + Math.random() * (WORLD_HEIGHT - margin * 2),
        radius: 40,
        active: true,
        pulse: 0
    };
    window.evacuationPoint = evacuationPoint;
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
    updateInputs();

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cameraTarget = isPilotActive && pilot && !pilot.isDead ? pilot : getCameraCenter();
    setCamera(
        Math.max(0, Math.min(WORLD_WIDTH - canvas.width, cameraTarget.x - canvas.width / 2)),
        Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, cameraTarget.y - canvas.height / 2))
    );

    drawGrid();
    drawObstacles();

    if (fortress) {
        fortress.draw();
        const minion = fortress.update(mech, pilot, isPilotActive);
        if (minion) enemies.push(new Enemy(minion.x, minion.y, minion.type));
        if (fortress.isDead) {
            missionMoney += 500;
            missionExp += 200;
            getPlayerSave().materials += 50;
            particles.push(...createSpark(fortress.x, fortress.y, '#ff8800', 100, 8));
            fortress = null;
        }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].update();
        enemies[i].draw();
        if (enemies[i].isDead || enemies[i].health <= 0) {
            const template = ENEMY_TEMPLATES[enemies[i].templateKey];
            if (template) spawnDrops(enemies[i].x, enemies[i].y, template, 'enemy');
            enemies.splice(i, 1);
        }
    }

    if (!isPilotActive) {
        for (const p of players) {
            for (const enemy of enemies) p.resolveCollision(enemy);
        }
        if (keys['x'] || keys['X']) {
            ejectPilot();
            keys['x'] = false;
            keys['X'] = false;
        }
        const alivePlayers = players.filter(p => !p.isDead);
        if (alivePlayers.length === 0) {
            for (const p of players) destroyMech(p);
            gameRunning = false;
            showMissionResult(false);
            return;
        }
    } else {
        for (const p of players) {
            if (p.isDead) destroyMech(p);
        }
    }

    for (const p of players) {
        if (p.isDead) continue;
        if (isOnlineGame() && p.playerTag === 'remote') continue;
        const input = isOnlineGame() ? p1Input : (p === players[0] ? p1Input : p2Input);
        if (!input) continue;
        p.update(input);
        p.draw();
    }

    if (isOnlineGame()) {
        updateRemotePlayer();
        const remote = getRemotePlayer();
        if (remote && !remote.isDead) {
            remote.draw();
        }
        syncLocalPlayer(mech);
        syncWorldState({ enemies, drops, evacuationPoint });
    }

    // 玩家之间碰撞
    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            if (!players[i].isDead && !players[j].isDead) {
                players[i].resolveCollision(players[j]);
            }
        }
    }

    if (isPilotActive && pilot) {
        pilot.update();
        pilot.draw();
        for (const p of players) {
            if (p.isDead) continue;
            const distToMech = dist(pilot.x, pilot.y, p.x, p.y);
            if (distToMech < 40 && (keys['g'] || keys['G'])) {
                if (p.health <= 0) p.health = p.maxHealth * 0.3;
                p.isDead = false;
                p.alreadyExploded = false;
                p.isPilotEjected = false;
                p.x = pilot.x;
                p.y = pilot.y;
                isPilotActive = false;
                pilot = null;
                keys['g'] = false;
                keys['G'] = false;
                break;
            }
        }
        if (pilot?.isDead) {
            gameRunning = false;
            showMissionResult(false);
            return;
        }
    }

    for (let i = 0; i < enemies.length; i++) {
        for (let j = i + 1; j < enemies.length; j++) {
            enemies[i].resolveCollision(enemies[j]);
        }
    }

    updateBullets();

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].life <= 0) particles.splice(i, 1);
    }

    for (let i = hooks.length - 1; i >= 0; i--) {
        hooks[i].update(hooks[i].owner);
        hooks[i].draw();
        if (hooks[i].state === 'done') hooks.splice(i, 1);
    }

    updateDrops();
    updateEvacuationPoint();
    checkEvacuation();
    updateFloatingTexts();
    drawWeaponUI();
    drawMinimap();
    updateHUD();

    if (enemies.length === 0 && !fortress && gameRunning) {
        gameRunning = false;
        showMissionResult(true);
        return;
    }

    animationId = requestAnimationFrame(gameLoop);
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

function ejectPilot() {
    if (isPilotActive || !mech) return;
    isPilotActive = true;
    mech.isPilotEjected = true;
    pilot = new Pilot(mech.x, mech.y);
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

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        bullets[i].draw();

        if (bullets[i] instanceof Bullet && !bullets[i].isEnemyBullet) {
            for (let j = enemies.length - 1; j >= 0; j--) {
                const d = dist(bullets[i].x, bullets[i].y, enemies[j].x, enemies[j].y);
                if (d < enemies[j].size + (bullets[i].radius || 5)) {
                    const template = ENEMY_TEMPLATES[enemies[j].templateKey];
                    enemies[j].takeHit(bullets[i].damage);
                    playHitSound();
                    if (enemies[j].health <= 0) {
                        spawnDrops(enemies[j].x, enemies[j].y, template, 'enemy');
                        playExplosionSound('small');
                        enemies.splice(j, 1);
                    }
                    bullets.splice(i, 1);
                    break;
                }
            }
        }

        if (bullets[i] instanceof Bullet && bullets[i].isEnemyBullet) {
            const targets = [];
            for (const p of players) {
                if (p.health > 0) targets.push({ t: p, r: 20 });
            }
            if (isPilotActive && pilot && !pilot.isDead) targets.push({ t: pilot, r: pilot.size + 4 });

            let hit = false;
            for (const { t, r } of targets) {
                if (dist(bullets[i].x, bullets[i].y, t.x, t.y) < r + (bullets[i].radius || 5)) {
                    t.takeHit(bullets[i].damage || 5);
                    playHitSound();
                    particles.push(...createSpark(t.x, t.y, '#00d4ff', 5, 4));
                    hit = true;

                    if (players.includes(t) && t.health <= 0) {
                        t.health = 0;
                        t.isDead = true;
                        destroyMech(t);
                        if (!isPilotActive && players.every(p => p.isDead)) {
                            gameRunning = false;
                            showMissionResult(false);
                            return;
                        }
                    }
                    if (t === pilot && pilot.isDead) {
                        gameRunning = false;
                        showMissionResult(false);
                        return;
                    }
                    break;
                }
            }
            if (hit) {
                bullets.splice(i, 1);
                continue;
            }
        }

        if (bullets[i] instanceof LaserBeam && !bullets[i].isEnemyBullet) {
            const cos = Math.cos(bullets[i].angle);
            const sin = Math.sin(bullets[i].angle);
            for (let j = enemies.length - 1; j >= 0; j--) {
                const dx = enemies[j].x - bullets[i].x;
                const dy = enemies[j].y - bullets[i].y;
                const proj = dx * sin + dy * (-cos);
                const clamped = Math.max(0, Math.min(bullets[i].length, proj));
                const cx = bullets[i].x + sin * clamped;
                const cy = bullets[i].y - cos * clamped;
                if (dist(enemies[j].x, enemies[j].y, cx, cy) < enemies[j].size + bullets[i].width) {
                    enemies[j].takeHit(bullets[i].damage);
                    if (enemies[j].health <= 0) {
                        const template = ENEMY_TEMPLATES[enemies[j].templateKey];
                        if (template) spawnDrops(enemies[j].x, enemies[j].y, template, 'enemy');
                        enemies.splice(j, 1);
                    }
                }
            }
        }

        if (bullets[i] && bullets[i].life <= 0) {
            bullets.splice(i, 1);
        }
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        if (!(bullets[i] instanceof Bullet || bullets[i] instanceof LaserBeam)) continue;
        for (let j = obstacles.length - 1; j >= 0; j--) {
            const obs = obstacles[j];
            if (bullets[i].x >= obs.x && bullets[i].x <= obs.x + obs.width &&
                bullets[i].y >= obs.y && bullets[i].y <= obs.y + obs.height) {
                if (obs.health !== undefined) {
                    obs.health -= bullets[i].damage || 10;
                    if (obs.health <= 0) {
                        particles.push(...createSpark(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.isTree ? '#2a5a2a' : '#888', 8, 4));
                        obstacles.splice(j, 1);
                    }
                }
                bullets.splice(i, 1);
                break;
            }
        }
    }
}

function drawGrid() {
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 0.5;
    const startX = Math.floor(cameraX / 40) * 40;
    const startY = Math.floor(cameraY / 40) * 40;
    for (let x = startX; x < cameraX + canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x - cameraX, 0);
        ctx.lineTo(x - cameraX, canvas.height);
        ctx.stroke();
    }
    for (let y = startY; y < cameraY + canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y - cameraY);
        ctx.lineTo(canvas.width, y - cameraY);
        ctx.stroke();
    }
}

function drawObstacles() {
    for (const obs of obstacles) {
        const sx = obs.x - cameraX;
        const sy = obs.y - cameraY;
        if (sx + obs.width < 0 || sx > canvas.width || sy + obs.height < 0 || sy > canvas.height) continue;

        if (obs.isTree) {
            const cx = sx + obs.width / 2;
            const cy = sy + obs.height / 2;
            const radius = obs.width / 2;
            ctx.fillStyle = obs.trunkColor;
            ctx.fillRect(cx - 3, cy + radius * 0.3, 6, radius * 0.7);
            ctx.fillStyle = obs.health / obs.maxHealth > 0.5 ? obs.color : '#8a6a3a';
            ctx.beginPath();
            ctx.arc(cx, cy - radius * 0.2, radius * 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(100, 200, 100, 0.3)';
            ctx.beginPath();
            ctx.arc(cx - radius * 0.2, cy - radius * 0.4, radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = obs.color;
            ctx.fillRect(sx, sy, obs.width, obs.height);
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1;
            ctx.strokeRect(sx, sy, obs.width, obs.height);
        }
    }
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
        if (evacuationPoint?.active) {
            const targets = isPilotActive && pilot && !pilot.isDead ? [pilot] : players.filter(p => !p.isDead);
            const closest = targets.reduce((best, t) => {
                const d = dist(t.x, t.y, evacuationPoint.x, evacuationPoint.y);
                return d < best.d ? { t, d } : best;
            }, { d: Infinity });
            hudEvac.textContent = closest.d < evacuationPoint.radius ? '可撤离 (长按 E)' : '已标记';
            hudEvac.style.color = closest.d < evacuationPoint.radius ? '#00ff88' : '#00d4ff';
        } else {
            hudEvac.textContent = '未激活';
            hudEvac.style.color = '#888';
        }
    }

    drawPlayerHealthBars();
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
        const blink = Math.sin(Date.now() / 200) > 0;
        const alpha = d.life < 120 ? d.life / 120 : 1;
        ctx.globalAlpha = alpha;

        const sx = d.x - cameraX;
        const sy = d.y - cameraY;
        if (d.type === 'money') {
            ctx.fillStyle = blink ? '#ffcc00' : '#ffaa44';
            ctx.beginPath();
            ctx.arc(sx, sy, d.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px monospace';
            ctx.fillText('$', sx - 3, sy + 3);
        } else if (d.type === 'item') {
            const item = d.item;
            const def = item.def;
            const size = Math.max(10, Math.max(def.width, def.height) * 10);
            ctx.fillStyle = ITEM_RARITY[def.rarity].color;
            ctx.fillRect(sx - size / 2, sy - size / 2, size, size);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.strokeRect(sx - size / 2, sy - size / 2, size, size);
            ctx.fillStyle = '#000';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(def.icon, sx, sy + 4);
            ctx.textAlign = 'left';
            if (item.amount > 1) {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 9px monospace';
                ctx.fillText(item.amount, sx - size / 2 + 2, sy + size / 2 - 2);
            }
        } else if (d.type === 'repair') {
            ctx.fillStyle = blink ? '#00ffaa' : '#00ff88';
            ctx.beginPath();
            ctx.arc(sx, sy, d.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px monospace';
            ctx.fillText('+', sx - 3, sy + 3);
        } else if (d.type === 'crate') {
            const cx = sx - d.radius;
            const cy = sy - d.radius;
            ctx.fillStyle = d.crateType === 'alloySteel' ? '#6a6a6a' : '#2a004a';
            ctx.fillRect(cx, cy, d.radius * 2, d.radius * 2);
            ctx.strokeStyle = d.crateType === 'alloySteel' ? '#aaaaaa' : '#8a4aff';
            ctx.lineWidth = 2;
            ctx.strokeRect(cx, cy, d.radius * 2, d.radius * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(cx + 2, cy + 2, d.radius * 2 - 4, 4);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 9px monospace';
            ctx.fillText(d.crateType === 'alloySteel' ? '钢' : '燃', sx - 4, sy + 3);
        }
        ctx.globalAlpha = 1;

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
        const alpha = ft.life / ft.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#00ccff';
        ctx.font = 'bold 12px monospace';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        const sx = ft.x - cameraX;
        const sy = ft.y - cameraY;
        ctx.strokeText(ft.text, sx, sy);
        ctx.fillText(ft.text, sx, sy);
        ctx.globalAlpha = 1;
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }
}

function updateEvacuationPoint() {
    if (!evacuationPoint?.active) return;
    evacuationPoint.pulse += 0.08;
    const sx = evacuationPoint.x - cameraX;
    const sy = evacuationPoint.y - cameraY;
    if (sx + 60 < 0 || sx - 60 > canvas.width || sy + 60 < 0 || sy - 60 > canvas.height) return;

    const pulseRadius = evacuationPoint.radius + Math.sin(evacuationPoint.pulse) * 8;
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(sx, sy, pulseRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(0, 212, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(sx, sy, evacuationPoint.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#00d4ff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EVAC', sx, sy - evacuationPoint.radius - 12);
    ctx.textAlign = 'left';

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(evacuationPoint.pulse * 0.5);
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(evacuationPoint.radius * 0.4, 0);
        ctx.lineTo(evacuationPoint.radius * 0.7, 0);
        ctx.lineTo(evacuationPoint.radius * 0.55, -6);
        ctx.moveTo(evacuationPoint.radius * 0.7, 0);
        ctx.lineTo(evacuationPoint.radius * 0.55, 6);
        ctx.stroke();
    }
    ctx.restore();
}

function checkEvacuation() {
    if (!evacuationPoint?.active) return;
    const targets = isPilotActive && pilot && !pilot.isDead ? [pilot] : players.filter(p => !p.isDead);
    const inRange = targets.some(t => dist(t.x, t.y, evacuationPoint.x, evacuationPoint.y) < evacuationPoint.radius);
    if (inRange) {
        showEvacuationPrompt(true);
        if (keys['e'] || keys['E']) {
            evacuationHoldTime++;
            const target = targets.find(t => dist(t.x, t.y, evacuationPoint.x, evacuationPoint.y) < evacuationPoint.radius);
            if (target) drawEvacuationProgress(target.x, target.y);
            if (evacuationHoldTime >= EVACUATION_HOLD_REQUIRED) evacuateMission();
        } else {
            evacuationHoldTime = 0;
        }
    } else {
        showEvacuationPrompt(false);
        evacuationHoldTime = 0;
    }
}

function drawEvacuationProgress(x, y) {
    const ratio = evacuationHoldTime / EVACUATION_HOLD_REQUIRED;
    const sx = x - cameraX;
    const sy = y - cameraY - 35;
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(sx, sy, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#00d4ff';
    ctx.beginPath();
    ctx.arc(sx, sy, 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
    ctx.stroke();
}

function evacuateMission() {
    gameRunning = false;
    showEvacuationPrompt(false);
    if (evacuationPoint) evacuationPoint.active = false;
    showMissionResult(true);
    const resultTitle = document.getElementById('resultTitle');
    if (resultTitle) resultTitle.textContent = '撤离成功';
}

function showEvacuationPrompt(show) {
    let prompt = document.getElementById('evacuationPrompt');
    if (!prompt) {
        prompt = document.createElement('div');
        prompt.id = 'evacuationPrompt';
        prompt.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.85); color:#00d4ff; padding:20px 30px; border:2px solid #00d4ff; border-radius:8px; font-family:monospace; font-size:16px; z-index:300; display:none; text-align:center;';
        prompt.innerHTML = `
            <div style="font-size:20px; margin-bottom:10px;">撤离点已就绪</div>
            <div>长按 [E] 撤离战场</div>
            <div style="font-size:12px; color:#888; margin-top:8px;">保留当前获得的金币、经验和材料</div>`;
        document.getElementById('gameContainer').appendChild(prompt);
    }
    if (show && !evacuationPromptShown) {
        prompt.style.display = 'block';
        evacuationPromptShown = true;
    } else if (!show && evacuationPromptShown) {
        prompt.style.display = 'none';
        evacuationPromptShown = false;
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

    if (evacuationPoint?.active) {
        ctx.fillStyle = 'rgba(0, 212, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(mapX + evacuationPoint.x * scaleX, mapY + evacuationPoint.y * scaleY, 4, 0, Math.PI * 2);
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
        if (mech && !isMultiplayer && !isOnlineGame()) mech.shoot();
        if (mech && isOnlineGame()) {
            mech.shoot();
            broadcastAction('shoot');
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
        const bag = isPilotActive && pilot ? window.pilotBag : window.mechBag;
        const target = isPilotActive && pilot ? pilot : (players.find(p => !p.isDead) || mech);
        if (bag && target) {
            const item = bag.findBestUsable(target, 'heal');
            if (item) {
                const result = bag.useItem(item, target);
                if (result.used) {
                    playRepairSound();
                    particles.push(...createSpark(target.x, target.y, '#00ff88', 10, 3));
                    showFloatingText(target.x, target.y - 30, `+${result.heal || result.energy || ''} ${item.def.name}`);
                }
            }
        }
    }
    if (e.key === 'Escape') {
        stopGame();
        if (isOnlineGame()) resetOnlineGame();
        window.showMainMenu();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    if (e.key === 'e' || e.key === 'E') evacuationHoldTime = 0;
});
