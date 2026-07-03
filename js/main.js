// 主入口 - 游戏主循环和UI管理
import { keys, bullets, particles, footprints, hooks, obstacles, enemies, setCamera, WORLD_WIDTH, WORLD_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from './config.js';
import { WEAPONS, ENEMY_TEMPLATES, LEVELS } from './enemies.js';
import { loadSave, saveGame, addMoneyExp, upgradeCost, getMechStats } from '../data/save.js';
import Mech from './classes/Mech.js';
import Enemy from './classes/Enemy.js';
import Bullet from './classes/Bullet.js';
import LaserBeam from './classes/LaserBeam.js';
import Particle from './classes/Particle.js';
import Hook from './classes/Hook.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// 让模块内的类可以使用全局ctx
window.ctx = ctx;

let mech;
let currentLevel = null;
let missionMoney = 0;
let missionExp = 0;
let gameRunning = false;
let animationId = null;

// 玩家存档
let playerSave = loadSave();

// ========== 页面切换 ==========
window.showMainMenu = function() {
    document.getElementById('mainMenu').style.display = 'flex';
    document.getElementById('levelSelect').style.display = 'none';
    document.getElementById('hangar').style.display = 'none';
    document.getElementById('weaponEditor').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'none';
    stopGame();
};

window.showLevelSelect = function() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('levelSelect').style.display = 'flex';
    renderLevelGrid();
};

window.showHangar = function() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('hangar').style.display = 'flex';
    updateHangarUI();
};

window.showWeaponEditor = function() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('weaponEditor').style.display = 'flex';
    renderWeaponEditor();
};

window.returnToMenu = function() {
    showMainMenu();
};

// ========== 关卡选择 ==========
function renderLevelGrid() {
    const grid = document.getElementById('levelGrid');
    grid.innerHTML = '';
    LEVELS.forEach(level => {
        const unlocked = level.unlocked || playerSave.levelsCompleted.includes(level.id - 1) || level.id === 1;
        const card = document.createElement('div');
        card.className = 'level-card' + (unlocked ? '' : ' locked');
        card.innerHTML = `
            <h3>第${level.id}关</h3>
            <p>${level.name}</p>
            <p>敌人: ${level.enemyCount}</p>
            <p class="reward">奖励: ${level.reward}金币</p>
        `;
        if (unlocked) {
            card.onclick = () => startLevel(level);
        }
        grid.appendChild(card);
    });
}

// ========== 格纳库 ==========
window.switchHangarTab = function(tab) {
    document.querySelectorAll('.hangar-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    renderUpgradePanel(tab);
};

function updateHangarUI() {
    document.getElementById('resourceBar').textContent = 
        `金币: ${playerSave.money} | 经验: ${playerSave.exp} | 等级: ${playerSave.level}`;
    renderUpgradePanel('mech');
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
            const div = document.createElement('div');
            div.className = 'upgrade-item';
            div.innerHTML = `
                <h4>${u.name}</h4>
                <div class="level">等级: ${u.level}/${u.max} - ${u.desc}</div>
                <div class="cost">升级花费: ${cost}金币</div>
                <button ${canAfford ? '' : 'disabled'} onclick="upgradeMech('${u.key}')">升级</button>
            `;
            panel.appendChild(div);
        });
    } else {
        const weaponKeys = ['VULCAN', 'SHOTGUN', 'CANNON', 'LASER', 'BEAM_SWORD'];
        weaponKeys.forEach(key => {
            const w = playerSave.weapons[key];
            const base = WEAPONS[key];
            const cost = w.unlocked ? upgradeCost(100, w.level) : 200;
            const canAfford = playerSave.money >= cost;
            const div = document.createElement('div');
            div.className = 'upgrade-item';
            div.innerHTML = `
                <h4>${base.name}</h4>
                <div class="level">${w.unlocked ? `等级: ${w.level}/10` : '未解锁'}</div>
                <div class="cost">${w.unlocked ? `升级花费: ${cost}金币` : `解锁花费: ${cost}金币`}</div>
                <button ${canAfford ? '' : 'disabled'} onclick="upgradeWeapon('${key}')">${w.unlocked ? '升级' : '解锁'}</button>
            `;
            panel.appendChild(div);
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
    if (w.unlocked) {
        const cost = upgradeCost(100, w.level);
        if (playerSave.money >= cost && w.level < 10) {
            playerSave.money -= cost;
            w.level++;
            saveGame(playerSave);
            updateHangarUI();
        }
    } else {
        const cost = 200;
        if (playerSave.money >= cost) {
            playerSave.money -= cost;
            w.unlocked = true;
            w.level = 1;
            saveGame(playerSave);
            updateHangarUI();
        }
    }
};

// ========== 武器编辑器 ==========
let weaponEditorData = JSON.parse(JSON.stringify(WEAPONS));

function renderWeaponEditor() {
    const content = document.getElementById('weaponEditorContent');
    content.innerHTML = '';
    for (const key in weaponEditorData) {
        const w = weaponEditorData[key];
        const section = document.createElement('div');
        section.className = 'editor-section';
        section.style.cssText = 'margin-bottom:15px; padding:10px; background:rgba(0,0,0,0.3); border-radius:6px; border:1px solid #333;';
        section.innerHTML = `
            <h3 style="color:#ffaa44; margin:0 0 10px 0; font-size:14px;">${w.name} (${key})</h3>
            <div class="field-row"><label>伤害</label><input type="number" id="w_${key}_damage" value="${w.damage}" step="1"></div>
            <div class="field-row"><label>射速</label><input type="number" id="w_${key}_fireRate" value="${w.fireRate}" step="1"></div>
            <div class="field-row"><label>散布</label><input type="number" id="w_${key}_spread" value="${w.spread}" step="0.01"></div>
            <div class="field-row"><label>弹速</label><input type="number" id="w_${key}_bulletSpeed" value="${w.bulletSpeed}" step="1"></div>
            <div class="field-row"><label>弹径</label><input type="number" id="w_${key}_bulletRadius" value="${w.bulletRadius}" step="0.5"></div>
        `;
        content.appendChild(section);
    }
}

window.exportWeaponConfig = function() {
    const data = JSON.stringify(weaponEditorData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'weapon_config.json';
    a.click();
    URL.revokeObjectURL(url);
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

// ========== 游戏核心 ==========
function startLevel(level) {
    currentLevel = level;
    missionMoney = 0;
    missionExp = 0;
    
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('levelSelect').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    
    // 清空状态
    bullets.length = 0;
    particles.length = 0;
    footprints.length = 0;
    hooks.length = 0;
    obstacles.length = 0;
    enemies.length = 0;
    
    // 生成障碍物
    generateObstacles();
    
    // 生成敌人
    generateEnemiesForLevel(level);
    
    // 创建机甲
    const stats = getMechStats(playerSave);
    mech = new Mech(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    mech.maxSpeed = stats.maxSpeed;
    mech.dashMaxCooldown = stats.dashCooldown;
    
    // 设置敌人对机甲的引用
    import('./classes/Enemy.js').then(m => m.setMechRef(mech));
    import('./classes/Hook.js').then(m => m.setMechRef(mech));
    
    // 设置武器（根据解锁状态）
    const weaponList = [];
    const weaponKeys = ['VULCAN', 'SHOTGUN', 'CANNON', 'LASER', 'BEAM_SWORD'];
    weaponKeys.forEach(key => {
        if (playerSave.weapons[key].unlocked) {
            const w = weaponEditorData[key];
            const level = playerSave.weapons[key].level;
            const multiplier = 1 + (level - 1) * 0.1;
            weaponList.push({
                ...w,
                damage: w.damage * multiplier,
                fireRate: Math.max(1, w.fireRate * (1 - (level - 1) * 0.05)),
                spread: w.spread * (1 - (level - 1) * 0.1)
            });
        }
    });
    if (weaponList.length === 0) {
        weaponList.push(weaponEditorData.VULCAN);
    }
    mech.weaponList = weaponList;
    mech.currentWeapon = weaponList[0];
    mech.weaponKeys = ['1', '2', '3', '4', '5'].slice(0, weaponList.length);
    
    gameRunning = true;
    gameLoop();
}

function generateObstacles() {
    const obstacleCount = 40;
    for (let i = 0; i < obstacleCount; i++) {
        const type = Math.random() < 0.5 ? 'rock' : 'building';
        const width = 30 + Math.random() * 80;
        const height = 30 + Math.random() * 80;
        obstacles.push({
            x: Math.random() * (WORLD_WIDTH - width - 100) + 50,
            y: Math.random() * (WORLD_HEIGHT - height - 100) + 50,
            width, height, type,
            color: type === 'rock' ? '#555' : '#3a3a4a'
        });
    }
}

function generateEnemiesForLevel(level) {
    let types = level.enemyTypes;
    if (types.includes('all')) {
        types = Object.keys(ENEMY_TEMPLATES);
    }
    for (let i = 0; i < level.enemyCount; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        enemies.push(new Enemy(
            Math.random() * (WORLD_WIDTH - 200) + 100,
            Math.random() * (WORLD_HEIGHT - 200) + 100,
            type
        ));
    }
}

function stopGame() {
    gameRunning = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

function showMissionResult(won) {
    const result = document.getElementById('missionResult');
    document.getElementById('resultTitle').textContent = won ? '任务完成' : '任务失败';
    document.getElementById('rewardMoney').textContent = missionMoney;
    document.getElementById('rewardExp').textContent = missionExp;
    result.style.display = 'block';
    
    if (won) {
        playerSave = addMoneyExp(playerSave, missionMoney, missionExp);
        if (currentLevel && !playerSave.levelsCompleted.includes(currentLevel.id)) {
            playerSave.levelsCompleted.push(currentLevel.id);
            playerSave.highestLevel = Math.max(playerSave.highestLevel, currentLevel.id);
        }
        // 解锁下一关
        const nextLevel = LEVELS.find(l => l.id === currentLevel.id + 1);
        if (nextLevel) nextLevel.unlocked = true;
    }
}

function gameLoop() {
    if (!gameRunning) return;
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 更新相机
    setCamera(
        Math.max(0, Math.min(WORLD_WIDTH - canvas.width, mech.x - canvas.width / 2)),
        Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, mech.y - canvas.height / 2))
    );
    
    drawGrid();
    drawObstacles();
    
    // 更新和绘制敌人
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].update();
        enemies[i].draw();
    }
    
    mech.update();
    mech.draw();
    
    // 更新子弹和碰撞检测
    updateBullets();
    
    // 更新粒子
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
    
    // 更新钩爪
    for (let i = hooks.length - 1; i >= 0; i--) {
        hooks[i].update(mech);
        hooks[i].draw();
        if (hooks[i].state === 'done') hooks.splice(i, 1);
    }
    
    drawWeaponUI();
    drawMinimap();
    updateHUD();
    
    // 检查任务完成
    if (enemies.length === 0 && gameRunning) {
        gameRunning = false;
        showMissionResult(true);
        return;
    }
    
    animationId = requestAnimationFrame(gameLoop);
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        bullets[i].draw();
        
        // 玩家子弹击中敌人
        if (bullets[i] instanceof Bullet && !bullets[i].isEnemyBullet) {
            for (let j = enemies.length - 1; j >= 0; j--) {
                const dx = bullets[i].x - enemies[j].x;
                const dy = bullets[i].y - enemies[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < enemies[j].size + (bullets[i].radius || 5)) {
                    const template = ENEMY_TEMPLATES[enemies[j].templateKey];
                    enemies[j].health -= bullets[i].damage;
                    
                    // 掉落
                    if (enemies[j].health <= 0) {
                        missionMoney += template.money;
                        missionExp += template.exp;
                        enemies.splice(j, 1);
                    }
                    bullets.splice(i, 1);
                    break;
                }
            }
        }
        
        // 敌人子弹击中玩家
        if (bullets[i] instanceof Bullet && bullets[i].isEnemyBullet) {
            const dx = bullets[i].x - mech.x;
            const dy = bullets[i].y - mech.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 20 + (bullets[i].radius || 5)) {
                bullets.splice(i, 1);
            }
        }
        
        // 激光束击中敌人
        if (bullets[i] instanceof LaserBeam && !bullets[i].isEnemyBullet) {
            const cos = Math.cos(bullets[i].angle);
            const sin = Math.sin(bullets[i].angle);
            const beamEndX = bullets[i].x + sin * bullets[i].length;
            const beamEndY = bullets[i].y - cos * bullets[i].length;
            
            for (let j = enemies.length - 1; j >= 0; j--) {
                const dx = enemies[j].x - bullets[i].x;
                const dy = enemies[j].y - bullets[i].y;
                const proj = dx * sin + dy * (-cos);
                const clamped = Math.max(0, Math.min(bullets[i].length, proj));
                const cx = bullets[i].x + sin * clamped;
                const cy = bullets[i].y - cos * clamped;
                const dist = Math.sqrt((enemies[j].x - cx) ** 2 + (enemies[j].y - cy) ** 2);
                
                if (dist < enemies[j].size + bullets[i].width) {
                    const template = ENEMY_TEMPLATES[enemies[j].templateKey];
                    enemies[j].health -= bullets[i].damage;
                    if (enemies[j].health <= 0) {
                        missionMoney += template.money;
                        missionExp += template.exp;
                        enemies.splice(j, 1);
                    }
                }
            }
        }
        
        // 移除过期子弹
        if (bullets[i] && bullets[i].life <= 0) {
            bullets.splice(i, 1);
        }
    }
    
    // 子弹障碍物碰撞
    for (let i = bullets.length - 1; i >= 0; i--) {
        if (bullets[i] instanceof Bullet || bullets[i] instanceof LaserBeam) {
            for (let j = 0; j < obstacles.length; j++) {
                const obs = obstacles[j];
                if (bullets[i].x >= obs.x && bullets[i].x <= obs.x + obs.width &&
                    bullets[i].y >= obs.y && bullets[i].y <= obs.y + obs.height) {
                    bullets.splice(i, 1);
                    break;
                }
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
    for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        const sx = obs.x - cameraX;
        const sy = obs.y - cameraY;
        if (sx + obs.width < 0 || sx > canvas.width || sy + obs.height < 0 || sy > canvas.height) continue;
        ctx.fillStyle = obs.color;
        ctx.fillRect(sx, sy, obs.width, obs.height);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx, sy, obs.width, obs.height);
    }
}

function drawMinimap() {
    const mapSize = 150;
    const mapX = canvas.width - mapSize - 10;
    const mapY = canvas.height - mapSize - 10;
    const scaleX = mapSize / WORLD_WIDTH;
    const scaleY = mapSize / WORLD_HEIGHT;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.strokeRect(mapX, mapY, mapSize, mapSize);
    
    for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        ctx.fillStyle = '#666';
        ctx.fillRect(mapX + obs.x * scaleX, mapY + obs.y * scaleY, Math.max(2, obs.width * scaleX), Math.max(2, obs.height * scaleY));
    }
    for (let i = 0; i < enemies.length; i++) {
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(mapX + enemies[i].x * scaleX, mapY + enemies[i].y * scaleY, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.fillStyle = '#00d4ff';
    ctx.beginPath();
    ctx.arc(mapX + mech.x * scaleX, mapY + mech.y * scaleY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX + cameraX * scaleX, mapY + cameraY * scaleY, canvas.width * scaleX, canvas.height * scaleY);
}

function drawWeaponUI() {
    const startX = canvas.width - 150;
    const startY = 20;
    const itemHeight = 35;
    for (let i = 0; i < mech.weaponList.length; i++) {
        const w = mech.weaponList[i];
        const isActive = w === mech.currentWeapon;
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
    document.getElementById('hudEnemies').textContent = enemies.length;
}

// ========== 杂兵编辑器 ==========
window.closeEditor = function() {
    document.getElementById('enemyEditor').style.display = 'none';
    document.getElementById('editorOverlay').style.display = 'none';
};

window.openEditor = function() {
    document.getElementById('enemyEditor').style.display = 'block';
    document.getElementById('editorOverlay').style.display = 'block';
    renderEditor();
};

function renderEditor() {
    const content = document.getElementById('editorContent');
    content.innerHTML = '';
    for (const key in ENEMY_TEMPLATES) {
        const t = ENEMY_TEMPLATES[key];
        const section = document.createElement('div');
        section.className = 'editor-section';
        section.innerHTML = `
            <h3>${t.name} (${key}) <button class="btn-danger" style="float:right;padding:2px 8px;font-size:11px;" onclick="deleteEnemyType('${key}')">删除</button></h3>
            <div class="field-row"><label>名称</label><input type="text" id="${key}_name" value="${t.name}"></div>
            <div class="field-row"><label>大小</label><input type="number" id="${key}_size" value="${t.size}" step="1"></div>
            <div class="field-row"><label>颜色</label><input type="color" id="${key}_color" value="${t.color}"></div>
            <div class="field-row"><label>血量</label><input type="number" id="${key}_health" value="${t.health}" step="5"></div>
            <div class="field-row"><label>速度</label><input type="number" id="${key}_speed" value="${t.speed}" step="0.1"></div>
            <div class="field-row"><label>射击间隔</label><input type="number" id="${key}_fireRate" value="${t.fireRate}" step="5"></div>
            <div class="field-row"><label>检测范围</label><input type="number" id="${key}_detectionRange" value="${t.detectionRange}" step="10"></div>
            <div class="field-row"><label>金币掉落</label><input type="number" id="${key}_money" value="${t.money}" step="5"></div>
            <div class="field-row"><label>经验掉落</label><input type="number" id="${key}_exp" value="${t.exp}" step="5"></div>
        `;
        content.appendChild(section);
    }
}

window.addNewEnemyType = function() {
    const keys = Object.keys(ENEMY_TEMPLATES);
    let newKey = 'custom' + (keys.length + 1);
    while (keys.includes(newKey)) newKey = 'custom' + Math.floor(Math.random() * 1000);
    ENEMY_TEMPLATES[newKey] = {
        name: '自定义' + newKey, size: 14, color: '#ff4444', health: 40,
        speed: 0.8, fireRate: 45, detectionRange: 300, weapon: 'VULCAN',
        drawType: 'soldier', money: 20, exp: 10
    };
    renderEditor();
};

window.deleteEnemyType = function(key) {
    if (Object.keys(ENEMY_TEMPLATES).length <= 1) {
        alert('至少保留一种杂兵类型！');
        return;
    }
    delete ENEMY_TEMPLATES[key];
    renderEditor();
};

function collectEditorData() {
    for (const key in ENEMY_TEMPLATES) {
        const name = document.getElementById(key + '_name');
        if (!name) continue;
        ENEMY_TEMPLATES[key].name = name.value;
        ENEMY_TEMPLATES[key].size = parseFloat(document.getElementById(key + '_size').value) || 14;
        ENEMY_TEMPLATES[key].color = document.getElementById(key + '_color').value;
        ENEMY_TEMPLATES[key].health = parseFloat(document.getElementById(key + '_health').value) || 40;
        ENEMY_TEMPLATES[key].speed = parseFloat(document.getElementById(key + '_speed').value) || 0.8;
        ENEMY_TEMPLATES[key].fireRate = parseFloat(document.getElementById(key + '_fireRate').value) || 45;
        ENEMY_TEMPLATES[key].detectionRange = parseFloat(document.getElementById(key + '_detectionRange').value) || 300;
        ENEMY_TEMPLATES[key].money = parseFloat(document.getElementById(key + '_money').value) || 20;
        ENEMY_TEMPLATES[key].exp = parseFloat(document.getElementById(key + '_exp').value) || 10;
    }
}

window.exportEnemies = function() {
    collectEditorData();
    const data = JSON.stringify(ENEMY_TEMPLATES, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'enemy_templates.json';
    a.click();
    URL.revokeObjectURL(url);
};

window.importEnemies = function() {
    document.getElementById('importFile').click();
};

window.handleImport = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            Object.assign(ENEMY_TEMPLATES, data);
            renderEditor();
            alert('导入成功！');
        } catch (err) {
            alert('导入失败：' + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
};

window.applyEnemies = function() {
    collectEditorData();
    enemies.length = 0;
    if (currentLevel) {
        generateEnemiesForLevel(currentLevel);
    }
    closeEditor();
};

// ========== 输入处理 ==========
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
        e.preventDefault();
        if (mech) mech.shoot();
    }
    if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        if (mech) mech.fireHook();
    }
    if (e.key === 'Shift') e.preventDefault();
    if (e.key === 'Tab') {
        e.preventDefault();
        const editor = document.getElementById('enemyEditor');
        if (editor.style.display === 'block') closeEditor();
        else openEditor();
    }
    if (e.key === 'Escape') {
        stopGame();
        showMainMenu();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// 初始化显示主菜单
showMainMenu();
