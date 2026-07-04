// 渲染 System：统一绘制世界中的所有对象

import { world } from './WorldState.js?v=2';
import { cameraX, cameraY } from '../config.js?v=2';

export function renderWorld(ctx) {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    drawGrid(ctx);
    drawObstacles(ctx);

    if (world.fortress) {
        world.fortress.draw();
    }

    for (const e of world.enemies) { e.draw(); }
    for (const p of world.players) { if (!p.isDead) p.draw(); }
    if (world.pilot) world.pilot.draw();

    for (const b of world.bullets) { b.draw(); }
    for (const h of world.hooks) { h.draw(); }
    for (const p of world.particles) { p.draw(); }
    for (const d of world.drops) { drawDrop(ctx, d); }
    for (const ft of world.floatingTexts) { drawFloatingText(ctx, ft); }
}

function drawGrid(ctx) {
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 0.5;
    const startX = Math.floor(cameraX / 40) * 40;
    const startY = Math.floor(cameraY / 40) * 40;
    for (let x = startX; x < cameraX + ctx.canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x - cameraX, 0);
        ctx.lineTo(x - cameraX, ctx.canvas.height);
        ctx.stroke();
    }
    for (let y = startY; y < cameraY + ctx.canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y - cameraY);
        ctx.lineTo(ctx.canvas.width, y - cameraY);
        ctx.stroke();
    }
}

function drawObstacles(ctx) {
    for (const obs of world.obstacles) {
        const sx = obs.x - cameraX;
        const sy = obs.y - cameraY;
        if (sx + obs.width < 0 || sx > ctx.canvas.width || sy + obs.height < 0 || sy > ctx.canvas.height) continue;

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
        } else if (obs.isWreckage) {
            ctx.save();
            ctx.translate(sx + obs.width / 2, sy + obs.height / 2);
            ctx.rotate(Math.PI / 8);
            ctx.fillStyle = '#2a1a1a';
            ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
            ctx.strokeStyle = '#5a3a3a';
            ctx.lineWidth = 3;
            ctx.strokeRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
            ctx.fillStyle = '#ff4400';
            ctx.beginPath();
            ctx.arc(-20, -10, 6, 0, Math.PI * 2);
            ctx.arc(15, 20, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 100, 0, 0.3)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 6; i++) {
                ctx.beginPath();
                ctx.moveTo((Math.random() - 0.5) * obs.width, (Math.random() - 0.5) * obs.height);
                ctx.lineTo((Math.random() - 0.5) * obs.width, (Math.random() - 0.5) * obs.height);
                ctx.stroke();
            }
            ctx.restore();
        } else {
            ctx.fillStyle = obs.color;
            ctx.fillRect(sx, sy, obs.width, obs.height);
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1;
            ctx.strokeRect(sx, sy, obs.width, obs.height);
        }
    }
}

function drawDrop(ctx, d) {
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
        ctx.fillStyle = window.ITEM_RARITY?.[def.rarity]?.color || '#888';
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
}

function drawFloatingText(ctx, ft) {
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
}
