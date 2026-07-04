// 游戏循环 System：按顺序调用各 System

import { world } from './WorldState.js?v=2';
import { updateInputs } from './InputSystem.js?v=2';
import { updatePhysics } from './PhysicsSystem.js?v=2';
import { updateDamage } from './DamageSystem.js?v=2';
import { renderWorld } from './RenderSystem.js?v=2';

export function gameTick(ctx, systems) {
    updateInputs();
    if (systems.camera) systems.camera();
    if (systems.fortress) systems.fortress();
    if (systems.ai) systems.ai();
    if (systems.player) systems.player();
    if (systems.online) systems.online();
    if (systems.pilot) systems.pilot();
    updatePhysics();
    updateDamage();
    if (systems.particles) systems.particles();
    if (systems.hooks) systems.hooks();
    if (systems.drops) systems.drops();
    renderWorld(ctx);
    if (systems.hud) systems.hud();
}

export function updateParticles() {
    for (let i = world.particles.length - 1; i >= 0; i--) {
        world.particles[i].update();
        if (world.particles[i].life <= 0) world.particles.splice(i, 1);
    }
}

export function updateHooks() {
    for (let i = world.hooks.length - 1; i >= 0; i--) {
        world.hooks[i].update(world.hooks[i].owner);
        if (world.hooks[i].state === 'done') world.hooks.splice(i, 1);
    }
}

export { renderWorld };
