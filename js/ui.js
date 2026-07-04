// 格纳库、页面切换、武器工坊 UI
import { ENEMY_TEMPLATES, LEVELS } from './enemies.js?v=2';
import { WEAPONS } from './weapons.js?v=2';
import { loadSave, saveGame, upgradeCost } from '../data/save.js';
import { ALL_MODULES, MODULE_RARITY, calculateMechBuild, moduleUpgradeCost, moduleResearchCost, salvageModule } from './modules.js?v=2';
import { getManufactureCost, getBlueprintResearchCost } from './blueprints.js?v=2';
import { stopGame, startLevel } from './game.js?v=2';
import { createFieldRow, createEditorSection, downloadJSON } from './utils.js?v=2';
import NetworkManager from './net/NetworkManager.js?v=2';
import { initOnlineGame, setNetworkManager, resetOnlineGame, handleNetworkMessage, isOnlineGame, isOnlineHost, getNetworkPing } from './net/OnlineGame.js?v=2';

import { GridInventory, InventoryItem, ITEM_RARITY } from './inventory.js?v=2';
import { PILOT_TEMPLATES, getPilotDisplayInfo, createPilot, getRecruitCost, pilotExpToNext, addPilotExp, calculatePilotStats } from './pilots.js?v=2';
import { ENEMY_MECH_TEMPLATES, getAllEnemyMechTemplates, getEnemyMechUnlockProgress, checkEnemyMechUnlock, buyEnemyMech, createPlayerMechFromTemplate, getEnemyMechTemplate } from './enemyMechs.js?v=2';

let playerSave = loadSave();
let selectedAssemblySlot = null;
let selectedFilter = 'all';
let weaponEditorData = JSON.parse(JSON.stringify(WEAPONS));
let netManager = null;
let isHostFlag = false;
let inventoryTab = 'mech';
let draggedItem = null;
let inventoryTooltip = null;
let inventoryContextMenu = null;
let hangarTab = 'mech';

export function getPlayerSave() { return playerSave; }
export function setPlayerSave(s) { playerSave = s; }
export function getWeaponEditorData() { return weaponEditorData; }

// ========== 页面切换 ==========
export function initUI() {
    window.showMainMenu = () => {
        ['mainMenu', 'levelSelect', 'hangar', 'weaponEditor', 'enemyEditorPage', 'levelEditorPage', 'lobbyPage', 'gameContainer', 'inventoryPage'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = id === 'mainMenu' ? 'flex' : 'none';
        });
        stopGame();
    };

    window.showLobby = () => {
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('lobbyPage').style.display = 'flex';
        resetLobbyUI();
    };

    window.createOnlineRoom = async () => {
        netManager = initOnlineGame();
        setupNetworkHandlers();
        try {
            await netManager.connect();
            netManager.createRoom('Host');
        } catch (e) {
            alert('连接服务器失败，请确认 npm run server 已启动');
        }
    };

    window.joinOnlineRoom = async () => {
        const roomId = document.getElementById('joinRoomId').value.trim().toUpperCase();
        if (!roomId) return alert('请输入房间号');
        netManager = initOnlineGame();
        setupNetworkHandlers();
        try {
            await netManager.connect();
            netManager.joinRoom(roomId, 'Guest');
        } catch (e) {
            alert('连接服务器失败，请确认 npm run server 已启动');
        }
    };

    window.startOnlineGame = () => {
        if (!netManager || !isHostFlag) return;
        netManager.startGame(1);
    };

    window.showLevelSelect = () => {
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('levelSelect').style.display = 'flex';
        renderLevelGrid(false);
    };

    window.showMultiplayerLevelSelect = () => {
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('levelSelect').style.display = 'flex';
        renderLevelGrid(true);
    };

    window.showHangar = () => {
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('hangar').style.display = 'flex';
        updateHangarUI();
    };

    window.showInventory = () => {
        inventoryTab = 'mech';
        document.getElementById('gameContainer').style.display = 'none';
        document.getElementById('inventoryPage').style.display = 'flex';
        renderInventory();
    };

    window.hideInventory = () => {
        document.getElementById('inventoryPage').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        if (gameRunning) {
            // 恢复游戏循环
        }
    };

    window.toggleInventory = () => {
        const inv = document.getElementById('inventoryPage');
        if (!inv) return;
        if (inv.style.display === 'flex') {
            window.hideInventory();
        } else {
            window.showInventory();
        }
    };

    window.switchInventoryTab = (tab) => {
        inventoryTab = tab;
        renderInventory();
    };

    window.showWeaponEditor = () => {
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('weaponEditor').style.display = 'flex';
        renderWeaponEditor();
    };

    window.showEnemyEditor = () => {
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('enemyEditorPage').style.display = 'flex';
        renderEnemyEditorPage();
    };

    window.showLevelEditor = () => {
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('levelEditorPage').style.display = 'flex';
        renderLevelEditorPage();
    };

    window.returnToMenu = window.showMainMenu;
}

function setupNetworkHandlers() {
    if (!netManager) return;
    netManager.onMessage = (msg) => {
        if (msg.type === 'roomCreated') {
            isHostFlag = true;
            setNetworkManager(netManager, true);
            document.getElementById('lobbyPanel').style.display = 'none';
            document.getElementById('roomPanel').style.display = 'flex';
            document.getElementById('roomIdDisplay').textContent = msg.roomId;
            document.getElementById('netStatus').textContent = '已连接 (host)';
        }
        if (msg.type === 'roomJoined') {
            isHostFlag = false;
            setNetworkManager(netManager, false);
            document.getElementById('lobbyPanel').style.display = 'none';
            document.getElementById('roomPanel').style.display = 'flex';
            document.getElementById('roomIdDisplay').textContent = msg.roomId;
            document.getElementById('roomStatus').textContent = '等待 host 开始任务...';
            document.getElementById('netStatus').textContent = '已连接 (guest)';
        }
        if (msg.type === 'peerJoined') {
            document.getElementById('roomStatus').textContent = '玩家已加入';
            document.getElementById('startOnlineBtn').style.display = 'block';
        }
        if (msg.type === 'gameStarted') {
            document.getElementById('lobbyPage').style.display = 'none';
            document.getElementById('gameContainer').style.display = 'block';
            const level = LEVELS.find(l => l.id === msg.levelId) || LEVELS[0];
            startLevel(level, playerSave, false);
        }
        if (msg.type === 'error') {
            alert(msg.message);
        }
        const gameState = { stopGame, enemies: window.enemies, drops: window.drops, evacuationPoint: window.evacuationPoint, playerSave };
        handleNetworkMessage(msg, gameState);
    };
    netManager.onClose = () => {
        document.getElementById('netStatus').textContent = '已断开';
    };
}

function resetLobbyUI() {
    document.getElementById('lobbyPanel').style.display = 'flex';
    document.getElementById('roomPanel').style.display = 'none';
    document.getElementById('startOnlineBtn').style.display = 'none';
    document.getElementById('roomStatus').textContent = '等待玩家加入...';
    document.getElementById('netStatus').textContent = '未连接';
    document.getElementById('joinRoomId').value = '';
    if (netManager) { netManager.disconnect(); netManager = null; }
    resetOnlineGame();
}

// ========== 背包 UI ==========
function getCurrentInventoryBag() {
    if (inventoryTab === 'pilot') {
        return window.pilotBag || (playerSave.pilotInventory ? GridInventory.fromJSON(playerSave.pilotInventory) : null);
    }
    return window.mechBag || (playerSave.mechInventory ? GridInventory.fromJSON(playerSave.mechInventory) : null);
}

function saveInventoryBag(bag) {
    if (!bag) return;
    if (bag.owner === 'pilot') {
        playerSave.pilotInventory = bag.toJSON();
        window.pilotBag = bag;
    } else {
        playerSave.mechInventory = bag.toJSON();
        window.mechBag = bag;
    }
    saveGame(playerSave);
}

function renderInventory() {
    const page = document.getElementById('inventoryPage');
    if (!page) return;
    const bag = getCurrentInventoryBag();
    if (!bag) return;

    const title = inventoryTab === 'pilot' ? '飞行员背包' : '机甲货仓';
    const gridHtml = buildInventoryGridHtml(bag);

    page.innerHTML = `
        <button class="back-btn" onclick="hideInventory()">返回</button>
        <h2 style="color:#00d4ff; font-size:32px; margin-bottom:10px;">${title}</h2>
        <div style="display:flex; gap:10px; margin-bottom:15px;">
            <button class="menu-btn ${inventoryTab === 'mech' ? 'active' : ''}" onclick="switchInventoryTab('mech')">机甲货仓</button>
            <button class="menu-btn ${inventoryTab === 'pilot' ? 'active' : ''}" onclick="switchInventoryTab('pilot')">飞行员背包</button>
        </div>
        <div style="color:#ffaa44; margin-bottom:15px; font-size:14px;">
            已用 ${bag.usedCells}/${bag.totalCells} 格 | 负重 ${bag.totalWeight.toFixed(1)}/${bag.maxWeight} kg
        </div>
        <div id="inventoryGridContainer" style="position:relative;">${gridHtml}</div>
        <div id="inventoryDetail" style="margin-top:15px; min-height:60px; color:#ccc; font-size:13px;">悬停或选择物品查看详情</div>
    `;
    bindInventoryEvents(bag);
}

function buildInventoryGridHtml(bag) {
    const cellSize = 36;
    const gap = 2;
    const width = bag.cols * (cellSize + gap);
    const height = bag.rows * (cellSize + gap);
    let html = `<div id="inventoryGrid" style="display:grid; grid-template-columns: repeat(${bag.cols}, ${cellSize}px); grid-template-rows: repeat(${bag.rows}, ${cellSize}px); gap:${gap}px; width:${width}px; height:${height}px;">`;
    for (let y = 0; y < bag.rows; y++) {
        for (let x = 0; x < bag.cols; x++) {
            html += `<div class="inventory-cell" data-x="${x}" data-y="${y}"></div>`;
        }
    }
    html += '</div>';

    // 物品层
    html += `<div id="inventoryItems" style="position:absolute; top:0; left:0; width:${width}px; height:${height}px; pointer-events:none;">`;
    for (const item of bag.items) {
        const def = item.def;
        const w = item.width * (cellSize + gap) - gap;
        const h = item.height * (cellSize + gap) - gap;
        const left = item.x * (cellSize + gap);
        const top = item.y * (cellSize + gap);
        html += `
            <div class="inventory-item rarity-${def.rarity}" data-id="${item.id}" draggable="true"
                 style="position:absolute; left:${left}px; top:${top}px; width:${w}px; height:${h}px; pointer-events:auto;">
                <span class="item-icon">${def.icon}</span>
                ${item.amount > 1 ? `<span class="item-stack">${item.amount}</span>` : ''}
            </div>`;
    }
    html += '</div>';
    return html;
}

function bindInventoryEvents(bag) {
    const grid = document.getElementById('inventoryGrid');
    const items = document.querySelectorAll('.inventory-item');
    const detail = document.getElementById('inventoryDetail');
    if (!grid) return;

    items.forEach(el => {
        el.addEventListener('dragstart', (e) => {
            draggedItem = bag.items.find(i => i.id === el.dataset.id);
            if (draggedItem) {
                e.dataTransfer.setData('text/plain', draggedItem.id);
                el.style.opacity = '0.5';
            }
        });
        el.addEventListener('dragend', () => {
            draggedItem = null;
            el.style.opacity = '1';
        });
        el.addEventListener('mouseenter', () => {
            const item = bag.items.find(i => i.id === el.dataset.id);
            if (item) showInventoryTooltip(item, el);
            if (item && detail) {
                const def = item.def;
                detail.innerHTML = `
                    <div style="color:${ITEM_RARITY[def.rarity].color}; font-weight:bold;">${def.name} ${item.amount > 1 ? `×${item.amount}` : ''}</div>
                    <div style="color:#888;">${def.description}</div>
                    <div style="color:#aaa; font-size:12px; margin-top:4px;">${def.width}×${def.height} 重量 ${def.weight}kg/个</div>
                `;
            }
        });
        el.addEventListener('mouseleave', () => hideInventoryTooltip());
        el.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const item = bag.items.find(i => i.id === el.dataset.id);
            if (item) showInventoryContextMenu(e, item, bag);
        });
    });

    grid.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    grid.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!draggedItem) return;
        const rect = grid.getBoundingClientRect();
        const cellSize = 36;
        const gap = 2;
        const x = Math.floor((e.clientX - rect.left) / (cellSize + gap));
        const y = Math.floor((e.clientY - rect.top) / (cellSize + gap));
        if (bag.move(draggedItem, x, y)) {
            saveInventoryBag(bag);
            renderInventory();
        } else {
            // 无法放置，回原位
        }
        draggedItem = null;
    });
}

function showInventoryTooltip(item, el) {
    if (inventoryTooltip) inventoryTooltip.remove();
    const def = item.def;
    inventoryTooltip = document.createElement('div');
    inventoryTooltip.className = 'inventory-tooltip';
    inventoryTooltip.innerHTML = `
        <div style="color:${ITEM_RARITY[def.rarity].color}; font-weight:bold;">${def.name}</div>
        <div>${def.description}</div>
        ${item.amount > 1 ? `<div>堆叠: ${item.amount}/${def.maxStack}</div>` : ''}
    `;
    document.body.appendChild(inventoryTooltip);
    const rect = el.getBoundingClientRect();
    inventoryTooltip.style.left = rect.left + 'px';
    inventoryTooltip.style.top = (rect.bottom + 5) + 'px';
}

function hideInventoryTooltip() {
    if (inventoryTooltip) {
        inventoryTooltip.remove();
        inventoryTooltip = null;
    }
}

function showInventoryContextMenu(e, item, bag) {
    if (inventoryContextMenu) inventoryContextMenu.remove();
    inventoryContextMenu = document.createElement('div');
    inventoryContextMenu.className = 'inventory-context-menu';
    inventoryContextMenu.style.left = e.clientX + 'px';
    inventoryContextMenu.style.top = e.clientY + 'px';

    const actions = [];
    if (item.def.type === 'consumable') {
        actions.push({ label: '使用', action: () => useInventoryItem(item, bag) });
    }
    if (item.amount > 1) {
        actions.push({ label: '拆分一半', action: () => splitInventoryItem(item, bag) });
    }
    actions.push({ label: '丢弃', action: () => dropInventoryItem(item, bag) });

    inventoryContextMenu.innerHTML = actions.map(a => `<div class="ctx-item" onclick="${a.action.toString()}">${a.label}</div>`).join('');
    // 实际绑定
    inventoryContextMenu.querySelectorAll('.ctx-item').forEach((el, idx) => {
        el.onclick = () => { actions[idx].action(); closeInventoryContextMenu(); };
    });

    document.body.appendChild(inventoryContextMenu);
    document.addEventListener('click', closeInventoryContextMenu, { once: true });
}

function closeInventoryContextMenu() {
    if (inventoryContextMenu) {
        inventoryContextMenu.remove();
        inventoryContextMenu = null;
    }
}

function useInventoryItem(item, bag) {
    const target = inventoryTab === 'pilot'
        ? (window.pilot || { health: 0, maxHealth: 1 })
        : (window.mech || { health: 0, maxHealth: 1 });
    const result = bag.useItem(item, target);
    if (result.used) {
        saveInventoryBag(bag);
        renderInventory();
    }
}

function splitInventoryItem(item, bag) {
    const half = Math.floor(item.amount / 2);
    if (half > 0 && bag.splitStack(item, half)) {
        saveInventoryBag(bag);
        renderInventory();
    }
}

function dropInventoryItem(item, bag) {
    bag.remove(item);
    saveInventoryBag(bag);
    renderInventory();
}

// ========== 关卡选择 ==========
function renderLevelGrid(multiplayer = false) {
    const grid = document.getElementById('levelGrid');
    grid.innerHTML = '';
    LEVELS.forEach(level => {
        const unlocked = level.unlocked || playerSave.levelsCompleted.includes(level.id - 1) || level.id === 1;
        const card = document.createElement('div');
        card.className = 'level-card' + (unlocked ? '' : ' locked');
        card.innerHTML = `
            <h3>第${level.id}关${multiplayer ? ' (双人)' : ''}</h3>
            <p>${level.name}</p>
            <p>敌人: ${level.enemyCount}</p>
            <p class="reward">奖励: ${level.reward}金币</p>
        `;
        if (unlocked) card.onclick = () => startLevel(level, playerSave, multiplayer);
        grid.appendChild(card);
    });
}

// ========== 格纳库 ==========
window.switchHangarTab = function(tab) {
    hangarTab = tab;
    document.querySelectorAll('.hangar-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    if (tab === 'assembly') renderAssemblyPanel();
    else if (tab === 'pilots') renderPilotsPanel();
    else if (tab === 'mechs') renderMechsPanel();
    else if (tab === 'enemyMechs') renderEnemyMechsPanel();
    else renderUpgradePanel(tab);
};

function updateHangarUI() {
    document.getElementById('resourceBar').textContent =
        `金币: ${playerSave.money} | 经验: ${playerSave.exp} | 材料: ${playerSave.materials} | 等级: ${playerSave.level}`;
    if (hangarTab === 'assembly') renderAssemblyPanel();
    else if (hangarTab === 'pilots') renderPilotsPanel();
    else if (hangarTab === 'mechs') renderMechsPanel();
    else if (hangarTab === 'enemyMechs') renderEnemyMechsPanel();
    else renderUpgradePanel(hangarTab);
}

function renderUpgradePanel(tab) {
    const panel = document.getElementById('upgradePanel');
    panel.innerHTML = '';

    if (tab === 'mech') {
        const upgrades = [
            { key: 'armor', name: '装甲强化', desc: '减伤+10%', level: playerSave.mech.armorLevel, max: 10, baseCost: 100 },
            { key: 'speed', name: '引擎强化', desc: '移速+5%', level: playerSave.mech.speedLevel, max: 10, baseCost: 100 },
            { key: 'health', name: '结构强化', desc: '血量+20', level: playerSave.mech.healthLevel, max: 10, baseCost: 100 },
            { key: 'dash', name: '冲刺系统', desc: '冷却-5', level: playerSave.mech.dashLevel, max: 10, baseCost: 150 }
        ];
        upgrades.forEach(u => {
            const cost = upgradeCost(u.baseCost, u.level);
            const canAfford = playerSave.money >= cost && u.level < u.max;
            panel.innerHTML += `
                <div class="upgrade-item">
                    <h4>${u.name}</h4>
                    <div class="level">等级: ${u.level}/${u.max} - ${u.desc}</div>
                    <div class="cost">升级花费: ${cost}金币</div>
                    <button ${canAfford ? '' : 'disabled'} onclick="upgradeMech('${u.key}')">升级</button>
                </div>`;
        });
    } else {
        const weaponKeys = ['VULCAN', 'SHOTGUN', 'CANNON', 'LASER', 'BEAM_SWORD'];
        weaponKeys.forEach(key => {
            const w = playerSave.weapons[key];
            const base = WEAPONS[key];
            const cost = w.unlocked ? upgradeCost(100, w.level) : 200;
            const canAfford = playerSave.money >= cost;
            panel.innerHTML += `
                <div class="upgrade-item">
                    <h4>${base.name}</h4>
                    <div class="level">${w.unlocked ? `等级: ${w.level}/10` : '未解锁'}</div>
                    <div class="cost">${w.unlocked ? `升级花费: ${cost}金币` : `解锁花费: ${cost}金币`}</div>
                    <button ${canAfford ? '' : 'disabled'} onclick="upgradeWeapon('${key}')">${w.unlocked ? '升级' : '解锁'}</button>
                </div>`;
        });
    }
}

window.upgradeMech = function(key) {
    const levels = { armor: 'armorLevel', speed: 'speedLevel', health: 'healthLevel', dash: 'dashLevel' };
    const prop = levels[key];
    const cost = upgradeCost(100, playerSave.mech[prop]);
    if (playerSave.money >= cost && playerSave.mech[prop] < 10) {
        playerSave.money -= cost;
        playerSave.mech[prop]++;
        saveGame(playerSave);
        updateHangarUI();
    }
};

window.upgradeWeapon = function(key) {
    const w = playerSave.weapons[key];
    const cost = w.unlocked ? upgradeCost(100, w.level) : 200;
    if (playerSave.money < cost) return;
    playerSave.money -= cost;
    if (w.unlocked) {
        if (w.level < 10) w.level++;
    } else {
        w.unlocked = true;
        w.level = 1;
    }
    saveGame(playerSave);
    updateHangarUI();
};

// ========== 武器工坊 ==========
function renderWeaponEditor() {
    const content = document.getElementById('weaponEditorContent');
    content.innerHTML = '';
    for (const key in weaponEditorData) {
        const w = weaponEditorData[key];
        content.innerHTML += createEditorSection(
            `<h3 style="color:#ffaa44; margin:0 0 10px 0; font-size:14px;">${w.name} (${key})</h3>`,
            [
                createFieldRow('伤害', `<input type="number" id="w_${key}_damage" value="${w.damage}" step="1">`),
                createFieldRow('射速', `<input type="number" id="w_${key}_fireRate" value="${w.fireRate}" step="1">`),
                createFieldRow('散布', `<input type="number" id="w_${key}_spread" value="${w.spread}" step="0.01">`),
                createFieldRow('弹速', `<input type="number" id="w_${key}_bulletSpeed" value="${w.bulletSpeed}" step="1">`),
                createFieldRow('弹径', `<input type="number" id="w_${key}_bulletRadius" value="${w.bulletRadius}" step="0.5">`)
            ].join(''),
            'margin-bottom:15px; padding:10px; background:rgba(0,0,0,0.3); border-radius:6px; border:1px solid #333;'
        );
    }
}

window.exportWeaponConfig = function() {
    downloadJSON('weapon_config.json', weaponEditorData);
};

window.importWeaponConfig = function() {
    document.getElementById('weaponImportFile').click();
};

window.handleWeaponImport = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        try {
            weaponEditorData = JSON.parse(ev.target.result);
            renderWeaponEditor();
            alert('导入成功！');
        } catch (err) {
            alert('导入失败: ' + err.message);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
};

// ========== 机甲组装 ==========
function renderAssemblyPanel() {
    const panel = document.getElementById('upgradePanel');
    panel.innerHTML = '';
    panel.className = 'assembly-container';

    const build = calculateMechBuild(playerSave.mechBuild);
    const maxWeight = Math.max(50, build.maxEnergy * 0.8);
    const isOverweight = build.totalWeight > maxWeight;

    panel.innerHTML = `
        <div class="assembly-mech">
            <h3>当前机甲</h3>
            <div id="mechSlots"></div>
            <div class="mech-stats">
                <h4>综合属性</h4>
                ${renderStatRow('血量上限', Math.floor(build.maxHealth))}
                ${renderStatRow('能量上限', Math.floor(build.maxEnergy))}
                ${renderStatRow('装甲减伤', Math.floor(build.armor * 100) + '%')}
                ${renderStatRow('移动速度', build.maxSpeed.toFixed(2))}
                ${renderStatRow('冲刺冷却', build.dashCooldown)}
                ${renderStatRow('伤害加成', Math.floor(build.damageBonus * 100) + '%')}
                ${renderStatRow('射速加成', Math.floor((build.reloadSpeed - 1) * 100) + '%')}
                ${renderStatRow('总重量', build.totalWeight.toFixed(1) + ' / ' + Math.floor(maxWeight))}
                ${renderStatRow('护盾', Math.floor(build.shield))}
                ${renderStatRow('自动修复', build.repairRate.toFixed(1) + '/秒')}
                <div id="overweightWarning" class="overweight" style="display:${isOverweight ? 'block' : 'none'}">警告：超重会导致速度和血量下降！</div>
            </div>
        </div>
        <div class="assembly-parts">
            <h3>零件库</h3>
            <div class="part-filters">
                ${['all', 'chassis', 'head', 'arms', 'legs', 'core', 'weapon'].map(f =>
                    `<div class="part-filter ${selectedFilter === f ? 'active' : ''}" onclick="filterParts('${f}')">${filterName(f)}</div>`
                ).join('')}
            </div>
            <div class="parts-list" id="partsList"></div>
            <div class="part-detail" id="partDetail">选择一个零件查看详情</div>
        </div>
    `;
    renderMechSlots();
    renderPartsList();
}

function renderStatRow(label, value) {
    return `<div class="stat-row"><span>${label}</span><span class="stat-value">${value}</span></div>`;
}

function filterName(f) {
    const names = { all: '全部', chassis: '躯干', head: '头部', arms: '手臂', legs: '腿部', core: '核心', weapon: '武器' };
    return names[f] || f;
}

function renderMechSlots() {
    const container = document.getElementById('mechSlots');
    if (!container) return;
    const slots = [
        { key: 'chassis', label: '躯干' },
        { key: 'head', label: '头部' },
        { key: 'arms', label: '手臂' },
        { key: 'legs', label: '腿部' },
        { key: 'core', label: '核心' },
        { key: 'weaponLeft', label: '左武器' },
        { key: 'weaponRight', label: '右武器' }
    ];
    container.innerHTML = slots.map(s => {
        const part = playerSave.mechBuild[s.key];
        const m = part ? ALL_MODULES[part.moduleId] : null;
        const selected = selectedAssemblySlot === s.key ? 'selected' : '';
        const rarity = m ? MODULE_RARITY[m.rarity] : null;
        return `
            <div class="mech-slot ${selected}" onclick="selectAssemblySlot('${s.key}')">
                <div>
                    <div class="slot-name">${s.label}</div>
                    <div class="part-name" style="color:${rarity ? rarity.color : '#666'}">
                        ${m ? m.name : '未装备'} <span style="color:#ffaa44">Lv.${part ? part.level : 0}</span>
                    </div>
                </div>
            </div>`;
    }).join('');
}

window.selectAssemblySlot = function(slotKey) {
    selectedAssemblySlot = slotKey;
    renderMechSlots();
    renderPartsList();
};

window.filterParts = function(filter) {
    selectedFilter = filter;
    renderAssemblyPanel();
};

function renderPartsList() {
    const list = document.getElementById('partsList');
    if (!list) return;
    list.innerHTML = '';

    const inventory = playerSave.partsInventory || {};
    const researched = playerSave.researchedModules || [];
    const blueprints = playerSave.blueprints || [];

    for (const moduleId in ALL_MODULES) {
        const m = ALL_MODULES[moduleId];
        const owned = inventory[moduleId];
        const isResearched = researched.includes(moduleId);
        const hasBlueprint = blueprints.includes(moduleId);

        if (selectedFilter !== 'all' && m.slot !== selectedFilter) continue;
        if (selectedAssemblySlot) {
            const slotMap = {
                chassis: 'chassis', head: 'head', arms: 'arms', legs: 'legs',
                core: 'core', weaponLeft: 'weapon', weaponRight: 'weapon'
            };
            if (m.slot !== slotMap[selectedAssemblySlot]) continue;
        }

        const rarity = MODULE_RARITY[m.rarity];
        const researchCost = getBlueprintResearchCost(moduleId);
        const makeCost = getManufactureCost(moduleId);
        const canResearch = hasBlueprint && !isResearched && playerSave.money >= researchCost.money && playerSave.materials >= researchCost.materials;
        const canManufacture = isResearched && playerSave.money >= makeCost.money && playerSave.materials >= makeCost.materials;

        const item = document.createElement('div');
        item.className = 'part-item';
        item.innerHTML = `
            <div class="part-info" onclick="showPartDetail('${moduleId}')">
                <div class="part-title" style="color:${rarity.color}">${m.name}</div>
                <div class="part-desc">${m.description}</div>
            </div>
            <div class="part-level">${owned ? '拥有 Lv.' + owned.level : isResearched ? '已研发' : hasBlueprint ? '有蓝图' : '缺蓝图'}</div>
            <div class="part-actions">
                <button ${owned && selectedAssemblySlot ? '' : 'disabled'} onclick="equipModule('${moduleId}')">装备</button>
                <button ${owned && (owned.level < m.maxLevel) && playerSave.money >= moduleUpgradeCost(moduleId, owned.level) ? '' : 'disabled'} onclick="upgradeModule('${moduleId}')">升级</button>
                <button class="btn-research" ${canResearch ? '' : 'disabled'} onclick="researchModule('${moduleId}')">${isResearched ? '已研发' : '研发'}</button>
                <button ${canManufacture ? '' : 'disabled'} onclick="manufactureModule('${moduleId}')">制造</button>
            </div>
        `;
        list.appendChild(item);
    }
}

window.showPartDetail = function(moduleId) {
    const detail = document.getElementById('partDetail');
    if (!detail) return;
    const m = ALL_MODULES[moduleId];
    const stats = calculateModuleDisplayStats(moduleId);
    const rarity = MODULE_RARITY[m.rarity];
    detail.innerHTML = `
        <h4 style="color:${rarity.color}">${m.name} [${rarity.name}]</h4>
        <p style="color:#888;font-size:13px;">${m.description}</p>
        <div class="detail-stat">类型: ${slotName(m.slot)}</div>
        <div class="detail-stat">基础价格: ${m.cost} 金币</div>
        <div class="detail-stat">${stats}</div>
    `;
};

function slotName(slot) {
    const names = { chassis: '躯干', head: '头部', arms: '手臂', legs: '腿部', core: '核心', weapon: '武器' };
    return names[slot] || slot;
}

function calculateModuleDisplayStats(moduleId) {
    const m = ALL_MODULES[moduleId];
    const stats = calculateMechBuild({ [m.slot]: { moduleId, level: 1 } });
    const parts = [];
    const labels = {
        maxHealth: '血量', maxEnergy: '能量', armor: '装甲', maxSpeed: '移速',
        damageBonus: '伤害', reloadSpeed: '射速', shield: '护盾', repairRate: '修复',
        cooldownReduction: '冷却'
    };
    for (const key in stats) {
        if (key === 'weight' || key === 'totalWeight' || key === 'weapons' || !labels[key]) continue;
        let val = stats[key];
        if (['armor', 'damageBonus', 'cooldownReduction'].includes(key)) val = (val * 100).toFixed(0) + '%';
        else if (key === 'repairRate') val = val + '/秒';
        parts.push(`${labels[key]}: ${val}`);
    }
    parts.push(`重量: ${m.stats.weight}`);
    return parts.join(' | ');
}

window.equipModule = function(moduleId) {
    if (!selectedAssemblySlot) return;
    const inv = playerSave.partsInventory;
    if (!inv[moduleId] || inv[moduleId].count <= 0) return;

    const m = ALL_MODULES[moduleId];
    const slotMap = {
        chassis: 'chassis', head: 'head', arms: 'arms', legs: 'legs',
        core: 'core', weaponLeft: 'weapon', weaponRight: 'weapon'
    };
    if (m.slot !== slotMap[selectedAssemblySlot]) return;

    const current = playerSave.mechBuild[selectedAssemblySlot];
    if (current) {
        if (!inv[current.moduleId]) inv[current.moduleId] = { level: current.level, count: 0 };
        inv[current.moduleId].count++;
    }

    playerSave.mechBuild[selectedAssemblySlot] = { moduleId, level: inv[moduleId].level };
    inv[moduleId].count--;
    if (inv[moduleId].count <= 0) delete inv[moduleId];

    // 如果正在编辑某台机甲，同步回去
    if (window.editingMechId) {
        const idx = playerSave.mechs.findIndex(m => m.id === window.editingMechId);
        if (idx >= 0) {
            playerSave.mechs[idx].mechBuild = JSON.parse(JSON.stringify(playerSave.mechBuild));
        }
    }

    saveGame(playerSave);
    renderAssemblyPanel();
};

window.upgradeModule = function(moduleId) {
    const inv = playerSave.partsInventory;
    if (!inv[moduleId]) return;
    const m = ALL_MODULES[moduleId];
    if (inv[moduleId].level >= m.maxLevel) return;
    const cost = moduleUpgradeCost(moduleId, inv[moduleId].level);
    if (playerSave.money < cost) return;

    playerSave.money -= cost;
    inv[moduleId].level++;
    for (const slot in playerSave.mechBuild) {
        const part = playerSave.mechBuild[slot];
        if (part && part.moduleId === moduleId) part.level = inv[moduleId].level;
    }
    saveGame(playerSave);
    renderAssemblyPanel();
};

window.researchModule = function(moduleId) {
    const researched = playerSave.researchedModules;
    if (researched.includes(moduleId)) return;
    if (!playerSave.blueprints.includes(moduleId)) {
        alert('缺少该模块的蓝图，请通过任务获取。');
        return;
    }
    const cost = getBlueprintResearchCost(moduleId);
    if (playerSave.money < cost.money || playerSave.materials < cost.materials) return;

    playerSave.money -= cost.money;
    playerSave.materials -= cost.materials;
    researched.push(moduleId);
    if (!playerSave.partsInventory[moduleId]) playerSave.partsInventory[moduleId] = { level: 1, count: 0 };
    playerSave.partsInventory[moduleId].count++;
    playerSave.blueprints = playerSave.blueprints.filter(id => id !== moduleId);
    saveGame(playerSave);
    renderAssemblyPanel();
};

window.manufactureModule = function(moduleId) {
    if (!playerSave.researchedModules.includes(moduleId)) {
        alert('请先研发该模块的蓝图。');
        return;
    }
    const cost = getManufactureCost(moduleId);
    if (playerSave.money < cost.money || playerSave.materials < cost.materials) return;

    playerSave.money -= cost.money;
    playerSave.materials -= cost.materials;
    if (!playerSave.partsInventory[moduleId]) playerSave.partsInventory[moduleId] = { level: 1, count: 0 };
    playerSave.partsInventory[moduleId].count++;
    saveGame(playerSave);
    renderAssemblyPanel();
};

window.salvagePart = function(moduleId) {
    const inv = playerSave.partsInventory;
    if (!inv[moduleId] || inv[moduleId].count <= 0) return;
    playerSave.materials += salvageModule(moduleId, inv[moduleId].level);
    inv[moduleId].count--;
    if (inv[moduleId].count <= 0) delete inv[moduleId];
    saveGame(playerSave);
    renderAssemblyPanel();
};

// ========== 驾驶员管理 ==========
function renderPilotsPanel() {
    const panel = document.getElementById('upgradePanel');
    panel.innerHTML = '';
    panel.className = 'upgrade-panel';

    const activePilot = playerSave.pilots.find(p => p.id === playerSave.activePilotId);

    panel.innerHTML += `<h3 style="color:#00d4ff; width:100%;">出战驾驶员</h3>`;
    if (activePilot) {
        panel.innerHTML += renderPilotCard(activePilot, true);
    }

    panel.innerHTML += `<h3 style="color:#00d4ff; width:100%;">所有驾驶员</h3>`;
    for (const pilot of playerSave.pilots) {
        if (pilot.id === playerSave.activePilotId) continue;
        panel.innerHTML += renderPilotCard(pilot, false);
    }

    panel.innerHTML += `<h3 style="color:#00d4ff; width:100%;">招募新驾驶员</h3>`;
    for (const templateId in PILOT_TEMPLATES) {
        const template = PILOT_TEMPLATES[templateId];
        const cost = getRecruitCost(templateId);
        const canAfford = playerSave.money >= cost;
        panel.innerHTML += `
            <div class="upgrade-item">
                <h4 style="color:${template.color}">${template.icon} ${template.name}</h4>
                <div class="level">${template.description}</div>
                <div class="cost">招募花费: ${cost} 金币</div>
                <button ${canAfford ? '' : 'disabled'} onclick="recruitPilot('${templateId}')">招募</button>
            </div>`;
    }
}

function renderPilotCard(pilot, isActive) {
    const info = getPilotDisplayInfo(pilot);
    const stats = info.stats;
    const expRatio = pilot.exp / pilot.expToNext;
    return `
        <div class="upgrade-item ${isActive ? 'active-card' : ''}" style="border-color:${isActive ? '#00d4ff' : '#333'}">
            <div style="display:flex; align-items:center; gap:10px;">
                <div style="font-size:32px;">${info.icon}</div>
                <div>
                    <h4 style="color:${info.color}; margin:0;">${info.name} [Lv.${pilot.level}]</h4>
                    <div style="color:#888; font-size:12px;">${info.templateName} | 任务 ${pilot.missions} | 击杀 ${pilot.kills}</div>
                    <div style="width:150px; height:8px; background:#333; margin-top:4px;">
                        <div style="width:${Math.floor(expRatio * 100)}%; height:100%; background:#00d4ff;"></div>
                    </div>
                    <div style="font-size:11px; color:#888;">EXP: ${pilot.exp}/${pilot.expToNext}</div>
                </div>
            </div>
            <div style="margin-top:8px; font-size:12px; color:#aaa;">
                生命 ${Math.floor(stats.maxHealth)} | 移速 ${stats.maxSpeed.toFixed(1)} | 伤害 ${stats.damage.toFixed(1)} | 瞄准 ${(stats.aimBonus * 100).toFixed(0)}% | 修复 ${(stats.repairBonus * 100).toFixed(0)}%
            </div>
            <div style="margin-top:4px; font-size:11px; color:${info.talent ? '#ffaa44' : '#666'}">天赋: ${info.talent ? info.talent.name + ' - ' + info.talent.description : '无'}</div>
            ${!isActive ? `<button onclick="selectPilot('${pilot.id}')" style="margin-top:8px;">设为出战</button>
            <button onclick="dismissPilot('${pilot.id}')" style="margin-top:8px; background:#ff4444;">解雇</button>` : '<div style="color:#00d4ff; margin-top:8px; font-size:12px;">当前出战</div>'}
        </div>`;
}

window.recruitPilot = function(templateId) {
    const cost = getRecruitCost(templateId);
    if (playerSave.money < cost) return;
    playerSave.money -= cost;
    const pilot = createPilot(templateId);
    playerSave.pilots.push(pilot);
    if (!playerSave.activePilotId) playerSave.activePilotId = pilot.id;
    saveGame(playerSave);
    renderPilotsPanel();
};

window.selectPilot = function(pilotId) {
    const pilot = playerSave.pilots.find(p => p.id === pilotId);
    if (!pilot) return;
    playerSave.activePilotId = pilotId;
    saveGame(playerSave);
    renderPilotsPanel();
};

window.dismissPilot = function(pilotId) {
    if (playerSave.pilots.length <= 1) {
        alert('至少需要保留一名驾驶员');
        return;
    }
    playerSave.pilots = playerSave.pilots.filter(p => p.id !== pilotId);
    if (playerSave.activePilotId === pilotId) {
        playerSave.activePilotId = playerSave.pilots[0].id;
    }
    saveGame(playerSave);
    renderPilotsPanel();
};

// ========== 机甲选择 ==========
function renderMechsPanel() {
    const panel = document.getElementById('upgradePanel');
    panel.innerHTML = '';
    panel.className = 'upgrade-panel';

    panel.innerHTML += `<h3 style="color:#00d4ff; width:100%;">我的机甲</h3>`;
    for (const mech of playerSave.mechs) {
        const isActive = mech.id === playerSave.activeMechId;
        const build = calculateMechBuild(mech.mechBuild);
        const maxWeight = Math.max(50, build.maxEnergy * 0.8);
        panel.innerHTML += `
            <div class="upgrade-item ${isActive ? 'active-card' : ''}" style="border-color:${isActive ? '#00d4ff' : '#333'}">
                <h4 style="color:${mech.color || '#00d4ff'}">${mech.name}</h4>
                <div class="level">血量 ${Math.floor(build.maxHealth)} | 能量 ${Math.floor(build.maxEnergy)} | 速度 ${build.maxSpeed.toFixed(1)} | 装甲 ${(build.armor * 100).toFixed(0)}%</div>
                <div class="cost">重量 ${build.totalWeight.toFixed(1)}/${Math.floor(maxWeight)} kg</div>
                ${!isActive ? `<button onclick="selectMech('${mech.id}')">设为出战</button>` : '<div style="color:#00d4ff; font-size:12px;">当前出战</div>'}
                <button onclick="editMechBuild('${mech.id}')" style="margin-top:6px;">编辑组装</button>
            </div>`;
    }

    const slotCost = 1000 + playerSave.mechs.length * 1000;
    const canBuy = playerSave.money >= slotCost;
    panel.innerHTML += `
        <div class="upgrade-item">
            <h4>购买新机甲槽位</h4>
            <div class="cost">花费: ${slotCost} 金币</div>
            <button ${canBuy ? '' : 'disabled'} onclick="buyNewMechSlot()">购买</button>
        </div>`;
}

window.selectMech = function(mechId) {
    const mech = playerSave.mechs.find(m => m.id === mechId);
    if (!mech) return;
    playerSave.activeMechId = mechId;
    saveGame(playerSave);
    renderMechsPanel();
};

window.editMechBuild = function(mechId) {
    const mech = playerSave.mechs.find(m => m.id === mechId);
    if (!mech) return;
    window.editingMechId = mechId;
    playerSave.mechBuild = mech.mechBuild;
    hangarTab = 'assembly';
    renderAssemblyPanel();
};

window.buyNewMechSlot = function() {
    const cost = 1000 + playerSave.mechs.length * 1000;
    if (playerSave.money < cost) return;
    playerSave.money -= cost;
    const newMech = createDefaultPlayerMech();
    newMech.name = `机甲 ${playerSave.mechs.length + 1}`;
    playerSave.mechs.push(newMech);
    if (!playerSave.activeMechId) playerSave.activeMechId = newMech.id;
    saveGame(playerSave);
    renderMechsPanel();
};

// ========== 敌方机甲回收 ==========
function renderEnemyMechsPanel() {
    const panel = document.getElementById('upgradePanel');
    panel.innerHTML = '';
    panel.className = 'upgrade-panel';

    panel.innerHTML += `<h3 style="color:#00d4ff; width:100%;">敌方机甲回收</h3>`;
    const templates = getAllEnemyMechTemplates();
    for (const template of templates) {
        const unlocked = checkEnemyMechUnlock(playerSave, template.id);
        const progress = getEnemyMechUnlockProgress(playerSave, template.id);
        const alreadyOwned = playerSave.mechs.some(m => m.templateId === template.id);
        const canBuy = unlocked && !alreadyOwned && playerSave.money >= template.cost;
        const ratio = progress ? progress.ratio : 0;

        panel.innerHTML += `
            <div class="upgrade-item" style="border-color:${unlocked ? '#00ff88' : '#333'}">
                <h4 style="color:${template.color}">${template.name}</h4>
                <div class="level">${template.description}</div>
                <div style="width:150px; height:8px; background:#333; margin:6px 0;">
                    <div style="width:${Math.floor(ratio * 100)}%; height:100%; background:${unlocked ? '#00ff88' : '#ffaa44'};"></div>
                </div>
                <div class="cost">${unlocked ? `价格: ${template.cost} 金币` : `解锁: ${template.unlockHint}`}</div>
                <button ${canBuy ? '' : 'disabled'} onclick="buyEnemyMechForPlayer('${template.id}')">${alreadyOwned ? '已拥有' : (unlocked ? '购买' : '未解锁')}</button>
            </div>`;
    }
}

window.buyEnemyMechForPlayer = async function(templateId) {
    const { buyEnemyMech } = await import('./enemyMechs.js');
    const result = buyEnemyMech(playerSave, templateId);
    if (result.success) {
        saveGame(playerSave);
        renderEnemyMechsPanel();
    } else {
        alert(result.reason);
    }
};
