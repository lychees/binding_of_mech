// 主入口
import { keys } from './config.js?v=2';
import { initUI } from './ui.js?v=2';
import './game.js?v=2';
import './editors.js?v=2';

initUI();
window.showMainMenu();
