// 主入口 - 游戏主循环和UI管理
import { keys, bullets, particles, footprints, hooks, obstacles, enemies, drops, inventory, setCamera, cameraX, cameraY, WORLD_WIDTH, WORLD_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from './config.js';
import { ENEMY_TEMPLATES, LEVELS } from './enemies.js';
import { WEAPONS } from './weapons.js';
import { loadSave, saveGame, addMoneyExp, upgradeCost, getMechStats } from '../data/save.js';
import Mech from './classes/Mech.js';
import Enemy from './classes/Enemy.js';
import Pilot from './classes/Pilot.js';
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
let pilot = null;
let isPilotActive = false;
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
    document.getElementById('enemyEditorPage').style.display = 'none';
    document.getElementById('levelEditorPage').style.display = 'none';
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

window.showEnemyEditor = function() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('enemyEditorPage').style.display = 'flex';
    renderEnemyEditorPage();
};

window.showLevelEditor = function() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('levelEditorPage').style.display = 'flex';
    renderLevelEditorPage();
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
    // 获取当前激活的标签页
    const activeTab = document.querySelector('.hangar-tab.active');
    const tab = activeTab ? activeTab.textContent === '机甲升级' ? 'mech' : 'weapon' : 'mech';
    renderUpgradePanel(tab);
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
    
    // 隐藏任务完成提示
    document.getElementById('missionResult').style.display = 'none';
    
    // 生成障碍物和树木
    generateObstacles();
    generateTrees();
    
    // 生成敌人
    generateEnemiesForLevel(level);
    
    // 创建机甲
    const stats = getMechStats(playerSave);
    mech = new Mech(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    mech.maxSpeed = stats.maxSpeed;
    mech.dashMaxCooldown = stats.dashCooldown;
    mech.maxHealth = stats.maxHealth;
    mech.health = stats.maxHealth; // 满血开始
    mech.armor = stats.armor;
    mech.isDead = false;
    
    // 重置驾驶员
    pilot = null;
    isPilotActive = false;
    
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
    
    // 鼠标位置追踪（驾驶员瞄准用）
    window.mouseX = canvas.width / 2;
    window.mouseY = canvas.height / 2;
    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        window.mouseX = e.clientX - rect.left;
        window.mouseY = e.clientY - rect.top;
    });
    
    gameRunning = true;
    gameLoop();
}

function generateObstacles() {
    const obstacleCount = 30;
    for (let i = 0; i < obstacleCount; i++) {
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
    const treeCount = 60;
    for (let i = 0; i < treeCount; i++) {
        const size = 15 + Math.random() * 25;
        obstacles.push({
            x: Math.random() * (WORLD_WIDTH - size * 2 - 100) + 50,
            y: Math.random() * (WORLD_HEIGHT - size * 2 - 100) + 50,
            width: size,
            height: size,
            type: 'tree',
            color: '#2a5a2a',
            trunkColor: '#5a3a2a',
            health: 20,
            maxHealth: 20,
            isTree: true
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
    
    // 更新相机（跟随机甲或驾驶员）
    const cameraTarget = isPilotActive && pilot && !pilot.isDead ? pilot : mech;
    setCamera(
        Math.max(0, Math.min(WORLD_WIDTH - canvas.width, cameraTarget.x - canvas.width / 2)),
        Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, cameraTarget.y - canvas.height / 2))
    );
    
    drawGrid();
    drawObstacles();
    
    // 更新和绘制敌人
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].update();
        enemies[i].draw();
        
        // 检查着火等持续伤害导致的死亡
        if (enemies[i].health <= 0) {
            const template = ENEMY_TEMPLATES[enemies[i].templateKey];
            if (template) {
                drops.push({
                    x: enemies[i].x,
                    y: enemies[i].y,
                    type: 'money',
                    amount: template.money,
                    radius: 8,
                    color: '#ffaa44',
                    life: 600
                });
                if (Math.random() < 0.3) {
                    drops.push({
                        x: enemies[i].x + (Math.random() - 0.5) * 20,
                        y: enemies[i].y + (Math.random() - 0.5) * 20,
                        type: 'repair',
                        amount: 30,
                        radius: 10,
                        color: '#00ff88',
                        life: 600
                    });
                }
                missionExp += template.exp;
            }
            enemies.splice(i, 1);
            continue;
        }
    }
    
    // 先更新机甲（即使驾驶员在外面，机甲也在原地）
    if (!isPilotActive) {
        mech.update();
        mech.draw();
        
        // 机甲之间碰撞检测（玩家 vs 敌人）
        for (let i = 0; i < enemies.length; i++) {
            mech.resolveCollision(enemies[i]);
        }
        
        // 按 X 弹出舱
        if (keys['x'] || keys['X']) {
            ejectPilot();
            keys['x'] = false;
            keys['X'] = false;
        }
        
        // 机甲死亡判定
        if (mech.isDead) {
            ejectPilot();
        }
    } else {
        // 机甲原地保持，敌人仍可攻击它
        mech.draw();
    }
    
    if (isPilotActive) {
        // 驾驶员模式
        if (pilot) {
            pilot.update();
            pilot.draw();
            
            // 检查驾驶员与机甲的距离，按 G 重新驾驶
            const distToMech = Math.sqrt((pilot.x - mech.x) ** 2 + (pilot.y - mech.y) ** 2);
            if (distToMech < 40 && (keys['g'] || keys['G'])) {
                // 重新驾驶机甲（如果机甲未完全损毁）
                if (mech.health <= 0) {
                    mech.health = mech.maxHealth * 0.3; // 修理30%血量复活
                }
                mech.isDead = false;
                mech.x = pilot.x;
                mech.y = pilot.y;
                isPilotActive = false;
                pilot = null;
                keys['g'] = false;
                keys['G'] = false;
            }
            
            // 驾驶员死亡判定
            if (pilot && pilot.isDead) {
                gameRunning = false;
                showMissionResult(false);
                return;
            }
        }
    }
    
    // 敌人之间碰撞检测
    for (let i = 0; i < enemies.length; i++) {
        for (let j = i + 1; j < enemies.length; j++) {
            enemies[i].resolveCollision(enemies[j]);
        }
    }
    
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
    
    // 更新和绘制掉落物
    updateDrops();
    
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

function ejectPilot() {
    if (isPilotActive || !mech) return;
    isPilotActive = true;
    pilot = new Pilot(mech.x, mech.y);
    
    // 机甲爆炸/弹射特效
    for (let k = 0; k < 20; k++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        particles.push(new Particle(
            mech.x, mech.y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            k % 2 === 0 ? '#ff4444' : '#ffcc00'
        ));
    }
    
    // 如果机甲因为损毁而弹出，留下残骸作为障碍物
    if (mech.health <= 0) {
        mech.health = 0;
        obstacles.push({
            x: mech.x - 25,
            y: mech.y - 25,
            width: 50,
            height: 50,
            type: 'wreck',
            color: '#3a3a3a'
        });
    }
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        bullets[i].draw();
        
        // 玩家子弹击中敌人（机甲或驾驶员）
        if (bullets[i] instanceof Bullet && !bullets[i].isEnemyBullet) {
            for (let j = enemies.length - 1; j >= 0; j--) {
                const dx = bullets[i].x - enemies[j].x;
                const dy = bullets[i].y - enemies[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < enemies[j].size + (bullets[i].radius || 5)) {
                    const template = ENEMY_TEMPLATES[enemies[j].templateKey];
                    enemies[j].takeHit(bullets[i].damage);
                    
                    if (enemies[j].health <= 0) {
                        drops.push({
                            x: enemies[j].x,
                            y: enemies[j].y,
                            type: 'money',
                            amount: template.money,
                            radius: 8,
                            color: '#ffaa44',
                            life: 600
                        });
                        if (Math.random() < 0.3) {
                            drops.push({
                                x: enemies[j].x + (Math.random() - 0.5) * 20,
                                y: enemies[j].y + (Math.random() - 0.5) * 20,
                                type: 'repair',
                                amount: 30,
                                radius: 10,
                                color: '#00ff88',
                                life: 600
                            });
                        }
                        missionExp += template.exp;
                        enemies.splice(j, 1);
                    }
                    bullets.splice(i, 1);
                    break;
                }
            }
        }
        
        // 敌人子弹击中玩家（同时检查机甲和驾驶员）
        if (bullets[i] instanceof Bullet && bullets[i].isEnemyBullet) {
            const possibleTargets = [];
            if (mech && mech.health > 0) possibleTargets.push({ t: mech, r: 20 });
            if (isPilotActive && pilot && !pilot.isDead) possibleTargets.push({ t: pilot, r: pilot.size + 4 });
            
            let hit = false;
            for (let k = 0; k < possibleTargets.length; k++) {
                const target = possibleTargets[k].t;
                const hitRadius = possibleTargets[k].r;
                const dx = bullets[i].x - target.x;
                const dy = bullets[i].y - target.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < hitRadius + (bullets[i].radius || 5)) {
                    let damage = bullets[i].damage || 5;
                    target.takeHit(damage);
                    // 被击中特效
                    for (let k = 0; k < 5; k++) {
                        particles.push(new Particle(
                            target.x, target.y,
                            (Math.random() - 0.5) * 4,
                            (Math.random() - 0.5) * 4,
                            '#00d4ff'
                        ));
                    }
                    hit = true;
                    
                    if (target === mech && mech.health <= 0) {
                        mech.health = 0;
                        mech.isDead = true;
                        if (!isPilotActive) ejectPilot();
                    }
                    
                    if (target === pilot && pilot.isDead) {
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
                    enemies[j].takeHit(bullets[i].damage);
                    if (enemies[j].health <= 0) {
                        const template = ENEMY_TEMPLATES[enemies[j].templateKey];
                        if (template) {
                            missionMoney += template.money;
                            missionExp += template.exp;
                        }
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
    
    // 子弹障碍物碰撞（树木可破坏）
    for (let i = bullets.length - 1; i >= 0; i--) {
        if (bullets[i] instanceof Bullet || bullets[i] instanceof LaserBeam) {
            for (let j = obstacles.length - 1; j >= 0; j--) {
                const obs = obstacles[j];
                if (bullets[i].x >= obs.x && bullets[i].x <= obs.x + obs.width &&
                    bullets[i].y >= obs.y && bullets[i].y <= obs.y + obs.height) {
                    // 可破坏障碍物（树木）
                    if (obs.health !== undefined) {
                        obs.health -= bullets[i].damage || 10;
                        if (obs.health <= 0) {
                            // 破坏特效
                            for (let k = 0; k < 8; k++) {
                                particles.push(new Particle(
                                    obs.x + obs.width / 2, obs.y + obs.height / 2,
                                    (Math.random() - 0.5) * 4,
                                    (Math.random() - 0.5) * 4,
                                    obs.isTree ? '#2a5a2a' : '#888'
                                ));
                            }
                            obstacles.splice(j, 1);
                        }
                    }
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
        
        if (obs.isTree) {
            // 绘制树木（圆形树冠 + 矩形树干）
            const cx = sx + obs.width / 2;
            const cy = sy + obs.height / 2;
            const radius = obs.width / 2;
            
            // 树干
            ctx.fillStyle = obs.trunkColor;
            ctx.fillRect(cx - 3, cy + radius * 0.3, 6, radius * 0.7);
            
            // 树冠（根据血量变化颜色）
            const healthRatio = obs.health / obs.maxHealth;
            if (healthRatio > 0.5) {
                ctx.fillStyle = obs.color;
            } else {
                ctx.fillStyle = '#8a6a3a'; // 受损变棕
            }
            ctx.beginPath();
            ctx.arc(cx, cy - radius * 0.2, radius * 0.8, 0, Math.PI * 2);
            ctx.fill();
            
            // 树冠高光
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
    const minimapTarget = isPilotActive && pilot ? pilot : mech;
    ctx.fillStyle = '#00d4ff';
    ctx.beginPath();
    ctx.arc(mapX + minimapTarget.x * scaleX, mapY + minimapTarget.y * scaleY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX + cameraX * scaleX, mapY + cameraY * scaleY, canvas.width * scaleX, canvas.height * scaleY);
}

function drawWeaponUI() {
    if (isPilotActive) return; // 驾驶员模式不显示武器UI
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
    document.getElementById('hudRepair').textContent = inventory.repairKits;
    
    // 绘制玩家血条（机甲或驾驶员）
    const barWidth = 200;
    const barHeight = 16;
    const barX = 10;
    const barY = 10;
    const target = isPilotActive && pilot ? pilot : mech;
    const healthRatio = target.health / target.maxHealth;
    
    // 背景
    ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // 血量条
    let healthColor;
    if (healthRatio > 0.6) healthColor = '#00ff88';
    else if (healthRatio > 0.3) healthColor = '#ffaa00';
    else healthColor = '#ff4444';
    ctx.fillStyle = healthColor;
    ctx.fillRect(barX, barY, barWidth * healthRatio, barHeight);
    
    // 边框
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // 文字
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(Math.ceil(target.health) + ' / ' + Math.ceil(target.maxHealth), barX + barWidth / 2 - 30, barY + 12);
    
    // 装甲显示
    if (mech.armor > 0) {
        ctx.fillStyle = '#00d4ff';
        ctx.font = '11px monospace';
        ctx.fillText('装甲: ' + Math.floor(mech.armor * 100) + '%', barX, barY + 30);
    }
}

function updateDrops() {
    for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.life--;
        if (d.life <= 0) {
            drops.splice(i, 1);
            continue;
        }
        // 闪烁效果
        const blink = Math.sin(Date.now() / 200) > 0;
        const alpha = d.life < 120 ? d.life / 120 : 1;
        
        ctx.globalAlpha = alpha;
        if (d.type === 'money') {
            // 金币袋 - 圆形
            ctx.fillStyle = blink ? '#ffcc00' : '#ffaa44';
            ctx.beginPath();
            ctx.arc(d.x - cameraX, d.y - cameraY, d.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px monospace';
            ctx.fillText('$', d.x - cameraX - 3, d.y - cameraY + 3);
        } else if (d.type === 'repair') {
            // 修理包 - 十字
            ctx.fillStyle = blink ? '#00ffaa' : '#00ff88';
            ctx.beginPath();
            ctx.arc(d.x - cameraX, d.y - cameraY, d.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px monospace';
            ctx.fillText('+', d.x - cameraX - 3, d.y - cameraY + 3);
        }
        ctx.globalAlpha = 1;
        
        // 检测玩家拾取（机甲或驾驶员）
        const pickupTarget = isPilotActive && pilot ? pilot : mech;
        const dx = pickupTarget.x - d.x;
        const dy = pickupTarget.y - d.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 30) {
            if (d.type === 'money') {
                missionMoney += d.amount;
            } else if (d.type === 'repair') {
                inventory.repairKits++;
            }
            // 拾取特效
            for (let k = 0; k < 5; k++) {
                particles.push(new Particle(
                    d.x, d.y,
                    (Math.random() - 0.5) * 3,
                    (Math.random() - 0.5) * 3,
                    d.type === 'money' ? '#ffcc00' : '#00ff88'
                ));
            }
            drops.splice(i, 1);
        }
    }
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

function renderEnemyEditorPage() {
    const content = document.getElementById('enemyEditorContent');
    content.innerHTML = '';
    for (const key in ENEMY_TEMPLATES) {
        const t = ENEMY_TEMPLATES[key];
        const section = document.createElement('div');
        section.className = 'editor-section';
        section.style.cssText = 'margin-bottom:15px; padding:10px; background:rgba(0,0,0,0.3); border-radius:6px; border:1px solid #333;';
        section.innerHTML = `
            <h3 style="color:#ffaa44; margin:0 0 10px 0; font-size:14px;">${t.name} (${key}) <button class="btn-danger" style="float:right;padding:2px 8px;font-size:11px;" onclick="deleteEnemyType('${key}')">删除</button></h3>
            <div class="field-row"><label>名称</label><input type="text" id="ep_${key}_name" value="${t.name}"></div>
            <div class="field-row"><label>大小</label><input type="number" id="ep_${key}_size" value="${t.size}" step="1"></div>
            <div class="field-row"><label>颜色</label><input type="color" id="ep_${key}_color" value="${t.color}"></div>
            <div class="field-row"><label>血量</label><input type="number" id="ep_${key}_health" value="${t.health}" step="5"></div>
            <div class="field-row"><label>速度</label><input type="number" id="ep_${key}_speed" value="${t.speed}" step="0.1"></div>
            <div class="field-row"><label>射击间隔</label><input type="number" id="ep_${key}_fireRate" value="${t.fireRate}" step="5"></div>
            <div class="field-row"><label>检测范围</label><input type="number" id="ep_${key}_detectionRange" value="${t.detectionRange}" step="10"></div>
            <div class="field-row"><label>金币掉落</label><input type="number" id="ep_${key}_money" value="${t.money}" step="5"></div>
            <div class="field-row"><label>经验掉落</label><input type="number" id="ep_${key}_exp" value="${t.exp}" step="5"></div>
        `;
        content.appendChild(section);
    }
}

function collectEnemyEditorPageData() {
    for (const key in ENEMY_TEMPLATES) {
        const name = document.getElementById('ep_' + key + '_name');
        if (!name) continue;
        ENEMY_TEMPLATES[key].name = name.value;
        ENEMY_TEMPLATES[key].size = parseFloat(document.getElementById('ep_' + key + '_size').value) || 14;
        ENEMY_TEMPLATES[key].color = document.getElementById('ep_' + key + '_color').value;
        ENEMY_TEMPLATES[key].health = parseFloat(document.getElementById('ep_' + key + '_health').value) || 40;
        ENEMY_TEMPLATES[key].speed = parseFloat(document.getElementById('ep_' + key + '_speed').value) || 0.8;
        ENEMY_TEMPLATES[key].fireRate = parseFloat(document.getElementById('ep_' + key + '_fireRate').value) || 45;
        ENEMY_TEMPLATES[key].detectionRange = parseFloat(document.getElementById('ep_' + key + '_detectionRange').value) || 300;
        ENEMY_TEMPLATES[key].money = parseFloat(document.getElementById('ep_' + key + '_money').value) || 20;
        ENEMY_TEMPLATES[key].exp = parseFloat(document.getElementById('ep_' + key + '_exp').value) || 10;
    }
}

window.applyEnemies = function() {
    collectEnemyEditorPageData();
    enemies.length = 0;
    if (currentLevel) {
        generateEnemiesForLevel(currentLevel);
    }
};

// ========== 关卡编辑器 ==========
function renderLevelEditorPage() {
    const content = document.getElementById('levelEditorContent');
    content.innerHTML = '';
    for (let i = 0; i < LEVELS.length; i++) {
        const lv = LEVELS[i];
        const section = document.createElement('div');
        section.className = 'editor-section';
        section.style.cssText = 'margin-bottom:15px; padding:10px; background:rgba(0,0,0,0.3); border-radius:6px; border:1px solid #333;';
        const enemyTypes = Object.keys(ENEMY_TEMPLATES);
        const typeCheckboxes = enemyTypes.map(type => {
            const checked = lv.enemyTypes.includes(type) || lv.enemyTypes.includes('all') ? 'checked' : '';
            return `<label style="color:#ccc; margin-right:10px; font-size:12px;"><input type="checkbox" id="lep_${lv.id}_${type}" ${checked}> ${ENEMY_TEMPLATES[type]?.name || type}</label>`;
        }).join('');
        section.innerHTML = `
            <h3 style="color:#ffaa44; margin:0 0 10px 0; font-size:14px;">第${lv.id}关 - ${lv.name} <button class="btn-danger" style="float:right;padding:2px 8px;font-size:11px;" onclick="deleteLevel(${lv.id})">删除</button></h3>
            <div class="field-row"><label>名称</label><input type="text" id="lep_${lv.id}_name" value="${lv.name}"></div>
            <div class="field-row"><label>敌人数量</label><input type="number" id="lep_${lv.id}_enemyCount" value="${lv.enemyCount}" step="1"></div>
            <div class="field-row"><label>奖励金币</label><input type="number" id="lep_${lv.id}_reward" value="${lv.reward}" step="10"></div>
            <div class="field-row" style="flex-wrap:wrap;"><label>敌人类型</label><div style="flex:1;">${typeCheckboxes}</div></div>
            <div class="field-row"><label><input type="checkbox" id="lep_${lv.id}_all" ${lv.enemyTypes.includes('all') ? 'checked' : ''}> 包含所有类型</label></div>
            <div class="field-row"><label><input type="checkbox" id="lep_${lv.id}_unlocked" ${lv.unlocked ? 'checked' : ''}> 默认解锁</label></div>
        `;
        content.appendChild(section);
    }
}

function collectLevelEditorData() {
    for (let i = 0; i < LEVELS.length; i++) {
        const lv = LEVELS[i];
        const name = document.getElementById('lep_' + lv.id + '_name');
        if (!name) continue;
        lv.name = name.value;
        lv.enemyCount = parseInt(document.getElementById('lep_' + lv.id + '_enemyCount').value) || 10;
        lv.reward = parseInt(document.getElementById('lep_' + lv.id + '_reward').value) || 100;
        lv.unlocked = document.getElementById('lep_' + lv.id + '_unlocked').checked;
        
        const allChecked = document.getElementById('lep_' + lv.id + '_all').checked;
        if (allChecked) {
            lv.enemyTypes = ['all'];
        } else {
            lv.enemyTypes = [];
            const enemyTypes = Object.keys(ENEMY_TEMPLATES);
            enemyTypes.forEach(type => {
                const cb = document.getElementById('lep_' + lv.id + '_' + type);
                if (cb && cb.checked) lv.enemyTypes.push(type);
            });
            if (lv.enemyTypes.length === 0) lv.enemyTypes = ['scout'];
        }
    }
}

window.addNewLevel = function() {
    const newId = LEVELS.length > 0 ? Math.max(...LEVELS.map(l => l.id)) + 1 : 1;
    LEVELS.push({
        id: newId,
        name: '自定义关卡' + newId,
        enemyCount: 15,
        enemyTypes: ['scout', 'soldier'],
        reward: 150,
        unlocked: false
    });
    renderLevelEditorPage();
};

window.deleteLevel = function(id) {
    if (LEVELS.length <= 1) {
        alert('至少保留一个关卡！');
        return;
    }
    const idx = LEVELS.findIndex(l => l.id === id);
    if (idx >= 0) {
        LEVELS.splice(idx, 1);
        renderLevelEditorPage();
    }
};

window.exportLevels = function() {
    collectLevelEditorData();
    const data = JSON.stringify(LEVELS, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'level_config.json';
    a.click();
    URL.revokeObjectURL(url);
};

window.importLevels = function() {
    document.getElementById('levelImportFile').click();
};

window.handleLevelImport = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        try {
            const data = JSON.parse(ev.target.result);
            if (Array.isArray(data)) {
                LEVELS.length = 0;
                data.forEach(l => LEVELS.push(l));
                renderLevelEditorPage();
                alert('导入成功！');
            } else {
                alert('格式错误：应为关卡数组');
            }
        } catch (err) {
            alert('导入失败: ' + err.message);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
};

window.applyLevels = function() {
    collectLevelEditorData();
    alert('关卡配置已应用！');
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
    if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (mech && inventory.repairKits > 0 && mech.health < mech.maxHealth) {
            inventory.repairKits--;
            mech.health = Math.min(mech.maxHealth, mech.health + 30);
            // 修理特效
            for (let k = 0; k < 10; k++) {
                particles.push(new Particle(
                    mech.x, mech.y,
                    (Math.random() - 0.5) * 3,
                    (Math.random() - 0.5) * 3,
                    '#00ff88'
                ));
            }
        }
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
