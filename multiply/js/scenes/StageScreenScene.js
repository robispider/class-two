// js/scenes/StageScreenScene.js
import { createBackgroundDecorations, toBangla } from '../utils.js';
import { config } from '../config.js';
import { gameState } from '../gameState.js';
import { startStage } from '../game.js';

class StageScreenScene extends Phaser.Scene {
    constructor() {
        super('StageScreenScene');
    }

    create(data) {
        const level = data.level;
        gameState.currentLevel = level;

        // Add background decorations
        createBackgroundDecorations(this, this.cameras.main.width, this.cameras.main.height);

        // Title
        this.add.text(this.cameras.main.width / 2, 50, `লেভেল ${toBangla(level)} - স্টেজ বাছাই করুন`, {
            fontSize: '40px',
            fill: config.colors.text,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Stage buttons
        const maxStages = gameState.controller.stagesPerLevel;
        const buttonSpacing = 100;
        const startY = 150;
        const unlockedStages = maxStages; // All stages unlocked
        for (let i = 0; i < maxStages; i++) {
            const stageNum = i + 1;
            const button = this.add.rectangle(
                this.cameras.main.width / 2,
                startY + i * buttonSpacing,
                200,
                80,
                Phaser.Display.Color.HexStringToColor(config.colors.option1).color
            ).setOrigin(0.5).setInteractive({ useHandCursor: true });
            const buttonText = this.add.text(
                this.cameras.main.width / 2,
                startY + i * buttonSpacing,
                `স্টেজ ${toBangla(stageNum)}`,
                {
                    fontSize: '30px',
                    fill: config.colors.text,
                    fontStyle: 'bold'
                }
            ).setOrigin(0.5);
              button.on('pointerdown', () => {
                this.scene.start('GameScene', {
                    mode: 'stage',
                    level: level,
                    stage: stageNum,
                    // Make sure to pass the allowed tables for this level
                    allowedTables: gameState.controller.levels[level - 1]
                });
            });
            button.on('pointerover', () =>
                button.setFillStyle(
                    Phaser.Display.Color.HexStringToColor(config.colors.option1).darken(20).color
                )
            );
            button.on('pointerout', () =>
                button.setFillStyle(Phaser.Display.Color.HexStringToColor(config.colors.option1).color)
            );
        }

        // Back Button
        const backButton = this.add.rectangle(
            this.cameras.main.width / 2,
            startY + maxStages * buttonSpacing,
            200,
            80,
            Phaser.Display.Color.HexStringToColor(config.colors.stopButton).color
        ).setOrigin(0.5).setInteractive();
        const backText = this.add.text(
            this.cameras.main.width / 2,
            startY + maxStages * buttonSpacing,
            'পিছনে',
            {
                fontSize: '30px',
                fill: config.colors.text,
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        backButton.on('pointerdown', () => {
            this.scene.start('LevelScreenScene', { level });
        });
    }
    
  
}

export default StageScreenScene;