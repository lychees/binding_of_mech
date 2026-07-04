// 杂兵编辑器、关卡编辑器
import { ENEMY_TEMPLATES, LEVELS } from './enemies.js';
import { getPlayerSave } from './ui.js';
import { createFieldRow, createEditorSection, downloadJSON } from './utils.js';

const ENEMY_FIELDS = [
    { key: 'name', label: '名称', type: 'text' },
    { key: 'size', label: '大小', type: 'number', step: 1 },
    { key: 'color', label: '颜色', type: 'color' },
    { key: 'health', label: '血量', type: 'number', step: 5 },
    { key: 'speed', label: '速度', type: 'number', step: 0.1 },
    { key: 'fireRate', label: '射击间隔', type: 'number', step: 5 },
    { key: 'detectionRange', label: '检测范围', type: 'number', step: 10 },
    { key: 'money', label: '金币掉落', type: 'number', step: 5 },
    { key: 'exp', label: '经验掉落', type: 'number', step: 5 }
];

// ========== 杂兵编辑器 ==========
export function renderEnemyEditorPage() {
    const content = document.getElementById('enemyEditorContent');
    content.innerHTML = '';
    for (const key in ENEMY_TEMPLATES) {
        const t = ENEMY_TEMPLATES[key];
        const fields = ENEMY_FIELDS.map(f => {
            const input = f.type === 'color'
                ? `<input type="color" id="ep_${key}_${f.key}" value="${t[f.key]}">`
                : `<input type="${f.type}" id="ep_${key}_${f.key}" value="${t[f.key]}" step="${f.step || 1}">`;
            return createFieldRow(f.label, input);
        }).join('');
        content.innerHTML += createEditorSection(
            `<h3 style="color:#ffaa44; margin:0 0 10px 0; font-size:14px;">${t.name} (${key})
                <button class="btn-danger" style="float:right;padding:2px 8px;font-size:11px;" onclick="deleteEnemyType('${key}')">删除</button>
            </h3>`,
            fields,
            'margin-bottom:15px; padding:10px; background:rgba(0,0,0,0.3); border-radius:6px; border:1px solid #333;'
        );
    }
}

function collectEnemyEditorPageData() {
    for (const key in ENEMY_TEMPLATES) {
        const name = document.getElementById('ep_' + key + '_name');
        if (!name) continue;
        ENEMY_TEMPLATES[key].name = name.value;
        for (const f of ENEMY_FIELDS) {
            if (f.key === 'name') continue;
            const el = document.getElementById('ep_' + key + '_' + f.key);
            if (!el) continue;
            ENEMY_TEMPLATES[key][f.key] = f.type === 'color' ? el.value : parseFloat(el.value) || 0;
        }
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
    renderEnemyEditorPage();
};

window.deleteEnemyType = function(key) {
    if (Object.keys(ENEMY_TEMPLATES).length <= 1) {
        alert('至少保留一种杂兵类型！');
        return;
    }
    delete ENEMY_TEMPLATES[key];
    renderEnemyEditorPage();
};

window.exportEnemies = function() {
    collectEnemyEditorPageData();
    downloadJSON('enemy_templates.json', ENEMY_TEMPLATES);
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
            Object.assign(ENEMY_TEMPLATES, JSON.parse(e.target.result));
            renderEnemyEditorPage();
            alert('导入成功！');
        } catch (err) {
            alert('导入失败：' + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
};

window.applyEnemies = function() {
    collectEnemyEditorPageData();
};

// ========== 关卡编辑器 ==========
export function renderLevelEditorPage() {
    const content = document.getElementById('levelEditorContent');
    content.innerHTML = '';
    const enemyTypes = Object.keys(ENEMY_TEMPLATES);

    LEVELS.forEach(lv => {
        const typeCheckboxes = enemyTypes.map(type => {
            const checked = lv.enemyTypes.includes(type) || lv.enemyTypes.includes('all') ? 'checked' : '';
            return `<label style="color:#ccc; margin-right:10px; font-size:12px;">
                <input type="checkbox" id="lep_${lv.id}_${type}" ${checked}> ${ENEMY_TEMPLATES[type]?.name || type}
            </label>`;
        }).join('');

        content.innerHTML += createEditorSection(
            `<h3 style="color:#ffaa44; margin:0 0 10px 0; font-size:14px;">第${lv.id}关 - ${lv.name}
                <button class="btn-danger" style="float:right;padding:2px 8px;font-size:11px;" onclick="deleteLevel(${lv.id})">删除</button>
            </h3>`,
            [
                createFieldRow('名称', `<input type="text" id="lep_${lv.id}_name" value="${lv.name}">`),
                createFieldRow('敌人数量', `<input type="number" id="lep_${lv.id}_enemyCount" value="${lv.enemyCount}" step="1">`),
                createFieldRow('奖励金币', `<input type="number" id="lep_${lv.id}_reward" value="${lv.reward}" step="10">`),
                `<div class="field-row" style="flex-wrap:wrap;"><label>敌人类型</label><div style="flex:1;">${typeCheckboxes}</div></div>`,
                `<div class="field-row"><label><input type="checkbox" id="lep_${lv.id}_all" ${lv.enemyTypes.includes('all') ? 'checked' : ''}> 包含所有类型</label></div>`,
                `<div class="field-row"><label><input type="checkbox" id="lep_${lv.id}_unlocked" ${lv.unlocked ? 'checked' : ''}> 默认解锁</label></div>`
            ].join(''),
            'margin-bottom:15px; padding:10px; background:rgba(0,0,0,0.3); border-radius:6px; border:1px solid #333;'
        );
    });
}

function collectLevelEditorData() {
    LEVELS.forEach(lv => {
        const name = document.getElementById('lep_' + lv.id + '_name');
        if (!name) return;
        lv.name = name.value;
        lv.enemyCount = parseInt(document.getElementById('lep_' + lv.id + '_enemyCount').value) || 10;
        lv.reward = parseInt(document.getElementById('lep_' + lv.id + '_reward').value) || 100;
        lv.unlocked = document.getElementById('lep_' + lv.id + '_unlocked').checked;

        if (document.getElementById('lep_' + lv.id + '_all').checked) {
            lv.enemyTypes = ['all'];
        } else {
            lv.enemyTypes = [];
            Object.keys(ENEMY_TEMPLATES).forEach(type => {
                const cb = document.getElementById('lep_' + lv.id + '_' + type);
                if (cb && cb.checked) lv.enemyTypes.push(type);
            });
            if (lv.enemyTypes.length === 0) lv.enemyTypes = ['scout'];
        }
    });
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
    downloadJSON('level_config.json', LEVELS);
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
