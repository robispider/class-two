// js/scenes/StartScreenScene.js
import { createBackgroundDecorations } from '../utils.js';
import { config } from '../config.js';
import { gameState } from '../gameState.js';

import GameplayController from '../GameplayController.js';

class StartScreenScene extends Phaser.Scene {
    constructor() {
        super('StartScreenScene');
    }
    create() {
        gameState.controller = new GameplayController();
        createBackgroundDecorations(this, this.cameras.main.width, this.cameras.main.height);
        // Add start screen UI, buttons to levels, stats, leaderboard, etc.
        const levelButton = this.add.text(this.cameras.main.width / 2, 200, 'লেভেল খেলুন', { fontSize: '40px', fill: config.colors.text }).setOrigin(0.5);
        levelButton.setInteractive();
        levelButton.on('pointerdown', () => this.scene.start('LevelScreenScene'));
        // Add more buttons for practice, stats, leaderboard
    }
}

export default StartScreenScene;