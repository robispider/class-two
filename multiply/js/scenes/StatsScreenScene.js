// js/scenes/StatsScreenScene.js
import { createBackgroundDecorations, toBangla } from '../utils.js';
import { config } from '../config.js';
import { gameState } from '../gameState.js';

class StatsScreenScene extends Phaser.Scene {
    constructor() {
        super('StatsScreenScene');
    }

    create() {
        const { width, height } = this.cameras.main;
        createBackgroundDecorations(this, width, height);

        // --- Title ---
        this.add.text(width / 2, 60, 'পরিসংখ্যান', {
            fontSize: '48px',
            fontFamily: '"Noto Sans Bengali", sans-serif',
            fill: config.colors.text,
            fontStyle: 'bold',
            stroke: '#FFFFFF',
            strokeThickness: 4
        }).setOrigin(0.5);

        // --- Panel for better readability ---
        const panel = this.add.graphics();
        panel.fillStyle(Phaser.Display.Color.HexStringToColor(config.colors.panel).color, 0.8);
        panel.fillRoundedRect(width / 2 - 350, 120, 700, 500, 20);
        panel.lineStyle(4, Phaser.Display.Color.HexStringToColor(config.colors.panelBorder).color);
        panel.strokeRoundedRect(width / 2 - 350, 120, 700, 500, 20);

        // --- FIX: Access data directly from the performance tracker ---
        const trackerData = gameState.performanceTracker.data;
        let y = 160;
        const spacing = 45;
        const textStyle = {
            fontSize: '28px',
            fontFamily: '"Noto Sans Bengali", sans-serif',
            fill: config.colors.text
        };
        const titleStyle = { ...textStyle, fontSize: '32px', fontStyle: 'bold', fill: '#FFD700' };

        this.add.text(width / 2, y, 'স্টেজ সর্বোচ্চ স্কোর', titleStyle).setOrigin(0.5);
        y += spacing * 1.5;

        // --- Stage High Scores ---
        if (trackerData.stageHigh && Object.keys(trackerData.stageHigh).length > 0) {
            // Sort keys for consistent display
            const sortedKeys = Object.keys(trackerData.stageHigh).sort();
            for (const key of sortedKeys) {
                const score = trackerData.stageHigh[key];
                const [level, stage] = key.split('-');
                this.add.text(width / 2, y, `লেভেল ${toBangla(level)} - স্টেজ ${toBangla(stage)}: ${toBangla(score)}`, textStyle).setOrigin(0.5);
                y += spacing;
            }
        } else {
            this.add.text(width / 2, y, 'কোনো স্টেজ এখনো খেলা হয়নি।', { ...textStyle, fontStyle: 'italic' }).setOrigin(0.5);
            y += spacing;
        }

        y += spacing;

        // --- Overall High Score ---
        this.add.text(width / 2, y, `সামগ্রিক সর্বোচ্চ স্কোর: ${toBangla(trackerData.overallHigh)}`, titleStyle).setOrigin(0.5);
        y += spacing * 2;

        // --- Back Button ---
        const backButton = this.add.image(width / 2, y, 'button-red')
            .setScale(0.35)
            .setInteractive({ useHandCursor: true });
            
        this.add.text(backButton.x, backButton.y, 'পিছনে', { ...textStyle, fontSize: '30px', fill: '#FFFFFF', fontStyle: 'bold' }).setOrigin(0.5);

        backButton.on('pointerdown', () => {
            this.sound.play('button-click');
            this.scene.start('StartScreenScene');
        });
        backButton.on('pointerover', () => {
            this.sound.play('button-hover', {volume: 0.7});
            backButton.setTint(0xDDDDDD);
        });
        backButton.on('pointerout', () => {
            backButton.clearTint();
        });
    }
}

export default StatsScreenScene;