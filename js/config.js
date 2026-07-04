// 游戏常量配置
export const WORLD_WIDTH = 2400;
export const WORLD_HEIGHT = 2400;
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const keys = {};

import { world } from './engine/WorldState.js?v=2';

// 兼容旧代码：全局数组引用统一指向 world 容器中的数组
export const bullets = world.bullets;
export const particles = world.particles;
export const footprints = world.footprints;
export const meleeAttacks = [];
export const hooks = world.hooks;
export const obstacles = world.obstacles;
export const enemies = world.enemies;
export const drops = world.drops; // 地面掉落物
export const inventory = { repairKits: 0 }; // 旧版兼容，已被 mech/pilot 背包取代
export let mechBag = null;
export let pilotBag = null;

export function setMechBag(bag) { mechBag = bag; }
export function setPilotBag(bag) { pilotBag = bag; }

export let cameraX = 0;
export let cameraY = 0;

export function setCamera(x, y) {
    cameraX = x;
    cameraY = y;
}

export { world };
