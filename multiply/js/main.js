// js/main.js
import { gameState } from './gameState.js';
import { config, uiColors, planes } from './config.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import StartScreenScene from './scenes/StartScreenScene.js';
import LevelScreenScene from './scenes/LevelScreenScene.js';
import StageScreenScene from './scenes/StageScreenScene.js';
import PracticeScreenScene from './scenes/PracticeScreenScene.js';
import StatsScreenScene from './scenes/StatsScreenScene.js';
import LeaderboardScreenScene from './scenes/LeaderboardScreenScene.js';
import GameScene from './scenes/GameScene.js';

const phaserConfig = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    backgroundColor: '#333333',
    scene: [
        BootScene,
        PreloadScene,
        StartScreenScene,
        LevelScreenScene,
        StageScreenScene,
        PracticeScreenScene,
        StatsScreenScene,
        LeaderboardScreenScene,
        GameScene
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1 },
            debug: false
        }
    }
};

const game = new Phaser.Game(phaserConfig);

export { game, gameState, config, uiColors, planes };