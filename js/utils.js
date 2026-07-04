// 通用工具函数

export function dist(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

export function distSq(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
}

export function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

export function normalize(x, y) {
    const len = Math.sqrt(x * x + y * y);
    return len > 0 ? { x: x / len, y: y / len, len } : { x: 0, y: 0, len: 0 };
}

export function randRange(min, max) {
    return min + Math.random() * (max - min);
}

export function randInt(min, max) {
    return Math.floor(randRange(min, max + 1));
}

export function randSign() {
    return Math.random() < 0.5 ? -1 : 1;
}

export function rectIntersect(r1, r2) {
    return r1.x < r2.x + r2.width && r1.x + r1.width > r2.x &&
           r1.y < r2.y + r2.height && r1.y + r1.height > r2.y;
}

export function circleRectCollide(cx, cy, radius, rect) {
    const closestX = clamp(cx, rect.x, rect.x + rect.width);
    const closestY = clamp(cy, rect.y, rect.y + rect.height);
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy < radius * radius;
}

export function formatNumber(n, digits = 1) {
    return Number.isInteger(n) ? n : n.toFixed(digits);
}

// 创建 DOM 元素的轻量辅助
export function el(tag, attrs = {}, children = []) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
        if (key === 'className') element.className = value;
        else if (key === 'textContent') element.textContent = value;
        else if (key === 'innerHTML') element.innerHTML = value;
        else if (key === 'onclick') element.onclick = value;
        else element.setAttribute(key, value);
    }
    for (const child of children) {
        if (typeof child === 'string') element.appendChild(document.createTextNode(child));
        else element.appendChild(child);
    }
    return element;
}

// 编辑器通用：创建字段行
export function createFieldRow(label, inputHtml) {
    return `<div class="field-row"><label>${label}</label>${inputHtml}</div>`;
}

// 编辑器通用：创建区块
export function createEditorSection(titleHtml, fieldsHtml, style = '') {
    const extra = style ? ` style="${style}"` : '';
    return `<div class="editor-section"${extra}>
        ${titleHtml}
        ${fieldsHtml}
    </div>`;
}

// 下载 JSON 文件
export function downloadJSON(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
