// 杂兵模板定义
export const ENEMY_TEMPLATES = {
    scout: {
        name: '侦察兵',
        size: 10,
        color: '#ff6644',
        health: 20,
        speed: 1.5,
        fireRate: 60,
        detectionRange: 250,
        weapon: 'VULCAN',
        drawType: 'scout',
        money: 10,
        exp: 5
    },
    soldier: {
        name: '步兵',
        size: 14,
        color: '#ff4444',
        health: 40,
        speed: 0.8,
        fireRate: 45,
        detectionRange: 300,
        weapon: 'VULCAN',
        drawType: 'soldier',
        money: 20,
        exp: 10
    },
    heavy: {
        name: '重装兵',
        size: 20,
        color: '#aa4444',
        health: 80,
        speed: 0.4,
        fireRate: 30,
        detectionRange: 350,
        weapon: 'CANNON',
        drawType: 'heavy',
        money: 50,
        exp: 25
    },
    sniper: {
        name: '狙击手',
        size: 12,
        color: '#ff88cc',
        health: 25,
        speed: 0.6,
        fireRate: 80,
        detectionRange: 500,
        weapon: 'LASER',
        drawType: 'sniper',
        money: 30,
        exp: 15
    },
    shotgunner: {
        name: '霰弹手',
        size: 16,
        color: '#ffaa44',
        health: 50,
        speed: 0.7,
        fireRate: 50,
        detectionRange: 200,
        weapon: 'SHOTGUN',
        drawType: 'shotgunner',
        money: 40,
        exp: 20
    },
    medic: {
        name: '医疗兵',
        size: 13,
        color: '#44ff88',
        health: 35,
        speed: 1.0,
        fireRate: 40,
        detectionRange: 280,
        weapon: 'VULCAN',
        drawType: 'medic',
        money: 25,
        exp: 12
    }
};

// 关卡配置
export const LEVELS = [
    { id: 1, name: '训练场', enemyCount: 10, enemyTypes: ['scout', 'soldier'], reward: 100, unlocked: true },
    { id: 2, name: '前线哨站', enemyCount: 15, enemyTypes: ['scout', 'soldier', 'shotgunner'], reward: 200, unlocked: false },
    { id: 3, name: '重兵把守', enemyCount: 20, enemyTypes: ['soldier', 'heavy', 'shotgunner'], reward: 350, unlocked: false },
    { id: 4, name: '狙击地带', enemyCount: 18, enemyTypes: ['sniper', 'scout'], reward: 400, unlocked: false },
    { id: 5, name: '混合部队', enemyCount: 25, enemyTypes: ['all'], reward: 600, unlocked: false }
];
