// js/scenes/PracticeScreenScene.js
import { createBackgroundDecorations, toBangla } from '../utils.js';
import { config } from '../config.js';
import { gameState } from '../gameState.js';
import { startStage } from '../game.js';

class PracticeScreenScene extends Phaser.Scene {
    constructor() {
        super('PracticeScreenScene');
    }

    create(data) {
        const level = data.level;
        gameState.currentLevel = level;

        // Add background decorations
        createBackgroundDecorations(this, this.cameras.main.width, this.cameras.main.height);

        // Title
        this.add.text(this.cameras.main.width / 2, 50, `প্র্যাকটিস মোড - গুণের টেবিল বাছাই করুন`, {
            fontSize: '40px',
            fill: config.colors.text,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Multiplication table buttons
        const maxTables = gameState.maxNumber;
        const buttonSpacing = 80;
        const startY = 150;
        const columns = 3;
        const startX = this.cameras.main.width / 2 - (columns - 1) * 150 / 2;
        for (let i = 0; i < maxTables; i++) {
            const tableNum = i + 1;
            const col = i % columns;
            const row = Math.floor(i / columns);
            const button = this.add.rectangle(startX + col * 150, startY + row * buttonSpacing, 120, 60, Phaser.Display.Color.HexStringToColor(config.colors.option2).color)
                .setOrigin(0.5)
                .setInteractive();
            const buttonText = this.add.text(startX + col * 150, startY + row * buttonSpacing, `গুণ ${toBangla(tableNum)}`, {
                fontSize: '25px',
                fill: config.colors.text,
                fontStyle: 'bold'
            }).setOrigin(0.5);
            button.on('pointerdown', () => {
                gameState.fixedMultiplier = tableNum;
                startStage(this, 'practice', level, [tableNum]);
            });
            button.on('pointerover', () => button.setFillStyle(Phaser.Display.Color.HexStringToColor(config.colors.option2).darken(20).color));
            button.on('pointerout', () => button.setFillStyle(Phaser.Display.Color.HexStringToColor(config.colors.option2).color));
        }

        // Back Button
        const backButton = this.add.rectangle(this.cameras.main.width / 2, startY + Math.ceil(maxTables / columns) * buttonSpacing, 200, 80, Phaser.Display.Color.HexStringToColor(config.colors.stopButton).color)
            .setOrigin(0.5)
            .setInteractive();
        const backText = this.add.text(this.cameras.main.width / 2, startY + Math.ceil(maxTables / columns) * buttonSpacing, 'পিছনে', {
            fontSize: '30px',
            fill: config.colors.text,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        backButton.on('pointerdown', () => {
            this.scene.start('LevelScreenScene', { level });
        });
    }
}

export default PracticeScreenScene;