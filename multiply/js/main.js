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
import PracticeScene from './scenes/PracticeScene.js'; 
import LoaderScene from './scenes/LoaderScene.js'; // --- ADDED ---

const phaserConfig = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    backgroundColor: '#333333',
    parent: 'game-container',
    dom: {
        createContainer: true
    },
    scene: [
        BootScene,
        PreloadScene,
        StartScreenScene,
        LevelScreenScene,
        StageScreenScene,
        PracticeScreenScene,
        StatsScreenScene,
        LeaderboardScreenScene,
        LoaderScene, // --- ADDED ---
        
        GameScene,
        PracticeScene 
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
    },
    audio: {
        disableWebAudio: false  // <-- ADD THIS: Forces HTML5 Audio mode
    }
};

const game = new Phaser.Game(phaserConfig);

export { game, gameState, config, uiColors, planes };