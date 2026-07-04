import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 0; // 让系统分配端口

function log(msg) {
    console.log(`[runner] ${msg}`);
}

// 简单的静态文件服务器
async function startServer() {
    const server = http.createServer((req, res) => {
        let filePath = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
        if (filePath.endsWith('/')) filePath += 'index.html';
        const ext = path.extname(filePath).toLowerCase();
        const mime = {
            '.html': 'text/html',
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.wav': 'audio/wav',
            '.mp3': 'audio/mpeg'
        }[ext] || 'application/octet-stream';

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('Not found');
                return;
            }
            res.writeHead(200, { 'Content-Type': mime });
            res.end(data);
        });
    });

    return new Promise((resolve) => {
        server.listen(PORT, '127.0.0.1', () => {
            const addr = server.address();
            log(`HTTP server listening on http://127.0.0.1:${addr.port}`);
            resolve({ server, port: addr.port });
        });
    });
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

class CDPClient {
    constructor(wsUrl) {
        this.ws = new WebSocket(wsUrl);
        this.id = 0;
        this.pending = new Map();
        this.events = [];
        this.consoleMessages = [];
        this.exceptions = [];
        this.ws.onmessage = (ev) => this.handleMessage(JSON.parse(ev.data));
    }

    async ready() {
        return new Promise((resolve, reject) => {
            this.ws.onopen = resolve;
            this.ws.onerror = reject;
        });
    }

    handleMessage(msg) {
        if (msg.id !== undefined && this.pending.has(msg.id)) {
            const { resolve, reject } = this.pending.get(msg.id);
            this.pending.delete(msg.id);
            if (msg.error) reject(new Error(msg.error.message));
            else resolve(msg.result);
        }
        if (msg.method) {
            this.events.push(msg);
            if (msg.method === 'Runtime.consoleAPICalled') {
                this.consoleMessages.push(msg.params);
            }
            if (msg.method === 'Runtime.exceptionThrown') {
                this.exceptions.push(msg.params.exceptionDetails);
            }
        }
    }

    send(method, params = {}) {
        this.id++;
        const id = this.id;
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            this.ws.send(JSON.stringify({ id, method, params }));
        });
    }

    evaluate(expression, options = {}) {
        return this.send('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true,
            ...options
        });
    }

    async navigate(url) {
        await this.send('Page.enable');
        await this.send('Runtime.enable');
        const nav = await this.send('Page.navigate', { url });
        // 等待加载完成
        await this.waitForEvent('Page.loadEventFired', 15000);
        return nav;
    }

    waitForEvent(method, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const t = setTimeout(() => reject(new Error(`等待 ${method} 超时`)), timeout);
            const check = () => {
                const idx = this.events.findIndex(e => e.method === method);
                if (idx >= 0) {
                    clearTimeout(t);
                    resolve(this.events[idx]);
                    return;
                }
                setTimeout(check, 50);
            };
            check();
        });
    }

    close() {
        this.ws.close();
    }
}

async function launchChrome() {
    const userDataDir = path.join(ROOT, '.chrome-test-profile');
    const chrome = spawn(CHROME, [
        '--headless=new',
        '--remote-debugging-port=0',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        `--user-data-dir=${userDataDir}`,
        'about:blank'
    ], {
        detached: false
    });

    let wsUrl = null;
    await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Chrome 启动超时')), 15000);
        chrome.stderr.on('data', (data) => {
            const text = data.toString();
            const m = text.match(/DevTools listening on (ws:\/\/[^\s]+)/);
            if (m) {
                wsUrl = m[1];
                clearTimeout(timer);
                resolve();
            }
        });
        chrome.on('error', reject);
        chrome.on('exit', (code) => {
            if (!wsUrl) reject(new Error(`Chrome 退出，代码 ${code}`));
        });
    });

    log(`Chrome DevTools: ${wsUrl}`);
    return { chrome, wsUrl };
}

async function getPageWS(browserWsUrl) {
    const res = await fetch(`${browserWsUrl.replace(/^ws/, 'http').replace(/\/devtools\/browser\/.*/, '')}/json/list`);
    const pages = await res.json();
    const page = pages.find(p => p.type === 'page');
    if (!page) throw new Error('没有可用的页面目标');
    return page.webSocketDebuggerUrl;
}

let failed = false;
function assertEq(actual, expected, msg) {
    if (actual !== expected) {
        failed = true;
        throw new Error(`${msg}: expected ${expected}, got ${actual}`);
    }
}
function assertTrue(value, msg) {
    if (!value) {
        failed = true;
        throw new Error(`${msg}: got ${value}`);
    }
}

async function runTests() {
    const { server, port } = await startServer();
    const { chrome, wsUrl: browserWsUrl } = await launchChrome();
    let client;
    try {
        const pageWsUrl = await getPageWS(browserWsUrl);
        client = new CDPClient(pageWsUrl);
        await client.ready();
        log('CDP connected');

        await client.navigate(`http://127.0.0.1:${port}/index.html`);
        await sleep(500);

        // 测试 1：标题正确
        const title = await client.evaluate('document.title');
        assertEq(title.result.value, 'Binding of Mech', '页面标题');
        log('✓ 页面标题正确');

        // 测试 2：主菜单可见
        const menuVisible = await client.evaluate(`
            document.getElementById('mainMenu').style.display !== 'none'
        `);
        assertTrue(menuVisible.result.value, '主菜单默认显示');
        log('✓ 主菜单默认显示');

        // 测试 3：点击开始任务进入关卡选择
        await client.evaluate(`showLevelSelect()`);
        await sleep(200);
        const levelSelectVisible = await client.evaluate(`
            document.getElementById('levelSelect').style.display !== 'none'
        `);
        assertTrue(levelSelectVisible.result.value, '关卡选择界面显示');
        log('✓ 关卡选择界面可进入');

        // 测试 4：所有关卡默认解锁
        const allUnlocked = await client.evaluate(`
            Array.from(document.querySelectorAll('.level-card')).every(c => !c.classList.contains('locked'))
        `);
        assertTrue(allUnlocked.result.value, '所有关卡默认解锁');
        log('✓ 所有关卡默认解锁');

        // 测试 5：点击进入第一关，检查游戏是否运行
        await client.evaluate(`showLevelSelect()`);
        await sleep(200);
        await client.evaluate(`document.querySelector('.level-card').click()`);
        await sleep(800);
        const gameVisible = await client.evaluate(`
            document.getElementById('gameContainer').style.display !== 'none'
        `);
        assertTrue(gameVisible.result.value, '游戏容器显示');
        const mechExists = await client.evaluate(`
            typeof mech !== 'undefined' && mech !== null && !mech.isDead
        `);
        assertTrue(mechExists.result.value, '机甲已创建且未死亡');
        log('✓ 进入关卡后机甲存在');

        // 测试 6：武器列表包含所有解锁武器
        const weaponCount = await client.evaluate(`mech.weaponList.length`);
        assertTrue(weaponCount.result.value >= 5, '武器列表至少 5 种');
        log(`✓ 武器列表有 ${weaponCount.result.value} 种武器`);

        // 测试 7：敌人已生成
        const enemyCount = await client.evaluate(`enemies.length`);
        assertTrue(enemyCount.result.value > 0, '关卡中有敌人');
        log(`✓ 关卡中生成 ${enemyCount.result.value} 个敌人`);

        // 测试 8：障碍物已生成
        const obstacleCount = await client.evaluate(`obstacles.length`);
        assertTrue(obstacleCount.result.value > 0, '地图中有障碍物');
        log(`✓ 地图中生成 ${obstacleCount.result.value} 个障碍物`);

        // 测试 9：撤离点已生成
        const evacExists = await client.evaluate(`
            typeof evacuationPoint !== 'undefined' && evacuationPoint !== null
        `);
        assertTrue(evacExists.result.value, '撤离点已生成');
        log('✓ 撤离点已生成');

        // 测试 10：移动机甲不会报错（模拟按下 W 几帧）
        await client.evaluate(`
            keys['KeyW'] = true;
            for (let i = 0; i < 10; i++) {
                mech.update();
            }
            keys['KeyW'] = false;
            true
        `);
        log('✓ 机甲移动更新无报错');

        // 测试 10b：机甲死亡后不再移动，且不生成新障碍
        const deathState = await client.evaluate(`
            const beforeObs = obstacles.length;
            const startX = mech.x;
            const startY = mech.y;
            mech.velocityX = 5;
            mech.velocityY = 5;
            mech.isDead = true;
            mech.alreadyExploded = false;
            for (let i = 0; i < 30; i++) mech.update();
            JSON.stringify({
                moved: Math.abs(mech.x - startX) > 0.1 || Math.abs(mech.y - startY) > 0.1,
                velocityX: mech.velocityX,
                velocityY: mech.velocityY,
                obstacleDelta: obstacles.length - beforeObs
            });
        `);
        const ds = JSON.parse(deathState.result.value);
        assertTrue(!ds.moved, `机甲死亡后不应移动 (delta ${ds.velocityX.toFixed(2)}, ${ds.velocityY.toFixed(2)})`);
        assertEq(ds.obstacleDelta, 0, '机甲死亡后不应生成新障碍');
        log('✓ 机甲死亡后停止移动且不生成障碍');

        // 测试 11：控制台无严重错误
        const severeErrors = client.exceptions.filter(e =>
            e && e.exception && e.exception.description &&
            !e.exception.description.includes('AudioContext')
        );
        if (severeErrors.length > 0) {
            throw new Error(`游戏过程中出现严重 JS 错误: ${severeErrors[0].exception.description}`);
        }
        log('✓ 控制台无严重异常');

        // 测试 12：本地双人模式可进入并创建两台机甲
        await client.evaluate(`showMainMenu(); showMultiplayerLevelSelect()`);
        await sleep(200);
        const multiGridVisible = await client.evaluate(`
            document.getElementById('levelSelect').style.display !== 'none'
        `);
        assertTrue(multiGridVisible.result.value, '双人关卡选择界面显示');
        await client.evaluate(`document.querySelector('.level-card').click()`);
        await sleep(800);
        const multiMechCount = await client.evaluate(`players.length`);
        assertEq(multiMechCount.result.value, 2, '双人模式应有两台机甲');
        log('✓ 本地双人模式可进入并有两台机甲');

        // 测试 13：双人模式控制台无严重错误
        const multiErrors = client.exceptions.filter(e =>
            e && e.exception && e.exception.description &&
            !e.exception.description.includes('AudioContext')
        );
        if (multiErrors.length > 0) {
            throw new Error(`双人模式出现严重 JS 错误: ${multiErrors[0].exception.description}`);
        }
        log('✓ 控制台无严重异常');

        // 测试 14：杂兵编辑器可进入（仅在大厅）
        await client.evaluate(`showMainMenu(); showEnemyEditor()`);
        await sleep(200);
        const enemyEditorVisible = await client.evaluate(`
            document.getElementById('enemyEditorPage').style.display !== 'none'
        `);
        assertTrue(enemyEditorVisible.result.value, '杂兵编辑器界面显示');
        log('✓ 杂兵编辑器可进入');

        // 测试 15：关卡编辑器可进入
        await client.evaluate(`showMainMenu(); showLevelEditor()`);
        await sleep(200);
        const levelEditorVisible = await client.evaluate(`
            document.getElementById('levelEditorPage').style.display !== 'none'
        `);
        assertTrue(levelEditorVisible.result.value, '关卡编辑器界面显示');
        log('✓ 关卡编辑器可进入');

        log('\n全部 E2E 测试通过 ✓');
    } finally {
        if (client) client.close();
        chrome.kill();
        server.close();
    }
}

runTests().catch(err => {
    console.error('\nE2E 测试失败:', err.message);
    process.exit(1);
});
