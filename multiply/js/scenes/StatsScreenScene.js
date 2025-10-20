// js/scenes/StatsScreenScene.js
import { createBackgroundDecorations, toBangla } from '../utils.js';
import { config } from '../config.js';
import { gameState } from '../gameState.js';

class StatsScreenScene extends Phaser.Scene {
    constructor() {
        super('StatsScreenScene');
    }

    create() {
        // Add background decorations
        createBackgroundDecorations(this, this.cameras.main.width, this.cameras.main.height);

        // Title
        this.add.text(this.cameras.main.width / 2, 50, 'পরিসংখ্যান', {
            fontSize: '40px',
            fill: config.colors.text,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Display stats
        const stats = gameState.performanceTracker.getStatistics();
        let y = 150;
        const spacing = 50;

        // Stage High Scores
        for (const [key, score] of Object.entries(gameState.performanceTracker.data.stageHigh)) {
            const [level, stage] = key.split('-').map(Number);
            this.add.text(this.cameras.main.width / 2, y, `লেভেল ${toBangla(level)} - স্টেজ ${toBangla(stage)}: ${toBangla(score)}`, {
                fontSize: '30px',
                fill: config.colors.text
            }).setOrigin(0.5);
            y += spacing;
        }

        // Level High Scores
        for (const [level, score] of Object.entries(gameState.performanceTracker.data.levelHigh)) {
            this.add.text(this.cameras.main.width / 2, y, `লেভেল ${toBangla(level)}: ${toBangla(score)}`, {
                fontSize: '30px',
                fill: config.colors.text
            }).setOrigin(0.5);
            y += spacing;
        }

        // Overall High Score
        this.add.text(this.cameras.main.width / 2, y, `সর্বোচ্চ স্কোর: ${toBangla(gameState.performanceTracker.data.overallHigh)}`, {
            fontSize: '30px',
            fill: config.colors.text
        }).setOrigin(0.5);
        y += spacing;

        // Back Button
        const backButton = this.add.rectangle(this.cameras.main.width / 2, y + spacing, 200, 80, Phaser.Display.Color.HexStringToColor(config.colors.stopButton).color)
            .setOrigin(0.5)
            .setInteractive();
        const backText = this.add.text(this.cameras.main.width / 2, y + spacing, 'পিছনে', {
            fontSize: '30px',
            fill: config.colors.text,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        backButton.on('pointerdown', () => {
            this.scene.start('LevelScreenScene');
        });
    }
}

export default StatsScreenScene;