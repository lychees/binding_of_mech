// 主入口
import { keys } from './config.js?v=2';
import { initUI } from './ui.js?v=2';
import './game.js?v=2';
import './editors.js?v=2';
import { ITEM_DEFS, ITEM_RARITY } from './inventory.js?v=2';
import { WEAPONS } from './weapons.js?v=2';
import { ALL_MODULES, MODULE_RARITY } from './modules.js?v=2';
import { MECH_BLUEPRINTS, MECH_BLUEPRINT_TIERS } from './mechBlueprints.js?v=2';
import { ENEMY_TEMPLATES } from './enemies.js?v=2';
import Mech from './classes/Mech.js?v=2';

window.ITEM_DEFS = ITEM_DEFS;
window.ITEM_RARITY = ITEM_RARITY;
window.WEAPONS = WEAPONS;
window.ALL_MODULES = ALL_MODULES;
window.MODULE_RARITY = MODULE_RARITY;
window.MECH_BLUEPRINTS = MECH_BLUEPRINTS;
window.MECH_BLUEPRINT_TIERS = MECH_BLUEPRINT_TIERS;
window.ENEMY_TEMPLATES = ENEMY_TEMPLATES;
window.Mech = Mech;

initUI();
window.showMainMenu();
