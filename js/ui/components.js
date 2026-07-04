// 通用 UI 组件：卡片列表、属性面板等

export function CardList({ items, renderItem, onClick, emptyText = '暂无数据' }) {
    if (!items || items.length === 0) {
        return `<div style="color:#888; padding:20px; text-align:center;">${emptyText}</div>`;
    }
    return `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:12px;">${items.map(renderItem).join('')}</div>`;
}

export function Card({ title, subtitle, color = '#00d4ff', borderColor = '#333', content, footer, onClick, dataId = '' }) {
    const clickAttr = onClick ? `onclick="${onClick}"` : '';
    const dataAttr = dataId ? `data-id="${dataId}"` : '';
    return `
        <div class="upgrade-item" style="border-color:${borderColor}; ${onClick ? 'cursor:pointer;' : ''}" ${clickAttr} ${dataAttr}>
            <h4 style="color:${color}; margin:0 0 6px 0;">${title}</h4>
            ${subtitle ? `<div class="level" style="margin-bottom:6px;">${subtitle}</div>` : ''}
            ${content ? `<div style="color:#aaa; font-size:12px; margin:6px 0;">${content}</div>` : ''}
            ${footer ? `<div style="color:#888; font-size:11px; margin-top:4px;">${footer}</div>` : ''}
        </div>
    `;
}

export function StatPanel(stats) {
    // stats: [{ label, value, color }]
    return `<div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:6px; font-size:12px; color:#ccc;">` +
        stats.map(s => `<div><strong style="color:${s.color || '#888'}">${s.label}:</strong> ${s.value}</div>`).join('') +
        `</div>`;
}

export function TabBar(tabs, activeTab, onSwitch) {
    // tabs: [{ id, label }]
    return `<div class="hangar-tabs" style="margin-bottom:15px;">` +
        tabs.map(t => `
            <div class="hangar-tab ${t.id === activeTab ? 'active' : ''}" onclick="${onSwitch}('${t.id}')">${t.label}</div>
        `).join('') +
        `</div>`;
}

export function BlueprintViewer({ mechBuild, width = 320, height = 360 }) {
    const parts = Object.entries(mechBuild || {})
        .filter(([slot]) => !slot.startsWith('weapon'))
        .map(([slot, data]) => ({ slot, name: data.moduleId || '空' }));
    return `
        <div class="assembly-blueprint">
            <h3>MECH BLUEPRINT</h3>
            <div class="mech-schematic" style="position:relative; width:${width}px; height:${height}px;">
                <svg class="mech-svg" viewBox="0 0 320 360" preserveAspectRatio="xMidYMid meet" style="width:100%; height:100%;">
                    <defs>
                        <pattern id="bpGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(76,175,80,0.15)" stroke-width="1"/>
                        </pattern>
                    </defs>
                    <rect width="320" height="360" fill="url(#bpGrid)" />
                    <line x1="160" y1="40" x2="160" y2="320" stroke="rgba(76,175,80,0.4)" stroke-dasharray="4 2" />
                    <line x1="60" y1="180" x2="260" y2="180" stroke="rgba(76,175,80,0.4)" stroke-dasharray="4 2" />
                    <g stroke="#ffeb3b" stroke-width="1.5" fill="none" opacity="0.85">
                        <rect x="145" y="55" width="30" height="28" rx="4" />
                        <rect x="125" y="85" width="70" height="55" rx="6" />
                        <circle cx="160" cy="112" r="14" />
                        <line x1="160" y1="98" x2="160" y2="126" />
                        <line x1="146" y1="112" x2="174" y2="112" />
                        <polygon points="130,142 190,142 180,180 140,180" />
                        <rect x="110" y="90" width="15" height="35" rx="3" />
                        <rect x="195" y="90" width="15" height="35" rx="3" />
                        <line x1="117" y1="125" x2="117" y2="180" />
                        <line x1="205" y1="125" x2="205" y2="180" />
                    </g>
                    <g fill="#ffeb3b" font-size="9" opacity="0.7">
                        <text x="160" y="50" text-anchor="middle">HEAD</text>
                        <text x="160" y="145" text-anchor="middle">CORE</text>
                        <text x="90" y="110" text-anchor="middle">L.ARM</text>
                        <text x="230" y="110" text-anchor="middle">R.ARM</text>
                    </g>
                </svg>
                <div style="position:absolute; bottom:8px; left:8px; right:8px; display:flex; flex-wrap:wrap; gap:4px; font-size:10px; color:#4caf50;">
                    ${parts.map(p => `<span style="border:1px solid rgba(76,175,80,0.4); padding:2px 6px; border-radius:3px;">${p.slot}: ${p.name}</span>`).join('')}
                </div>
            </div>
        </div>
    `;
}
