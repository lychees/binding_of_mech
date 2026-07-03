// 游戏常量配置
export const WORLD_WIDTH = 2400;
export const WORLD_HEIGHT = 2400;
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const keys = {};
export const bullets = [];
export const particles = [];
export const footprints = [];
export const meleeAttacks = [];
export const hooks = [];
export const obstacles = [];
export const enemies = [];
export const drops = []; // 地面掉落物
export const inventory = { repairKits: 0 }; // 物品栏

export let cameraX = 0;
export let cameraY = 0;

export function setCamera(x, y) {
    cameraX = x;
    cameraY = y;
}
