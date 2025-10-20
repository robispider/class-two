// js/scenes/LevelScreenScene.js
import { createBackgroundDecorations, toBangla } from '../utils.js';
import { config } from '../config.js';
import { gameState } from '../gameState.js';
import GameplayController from '../GameplayController.js';

class LevelScreenScene extends Phaser.Scene {
    constructor() {
        super('LevelScreenScene');
         gameState.controller = new GameplayController();
    }

    create(data) {
        const level = data.level || 1;
        gameState.currentLevel = level;
        

        // Add background decorations
        createBackgroundDecorations(this, this.cameras.main.width, this.cameras.main.height);

        // Title
        this.add.text(this.cameras.main.width / 2, 50, `লেভেল বাছাই করুন`, {
            fontSize: '40px',
             fontFamily: '"Noto Sans Bengali", sans-serif',
            fill: config.colors.text,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Level buttons
        const maxLevels = gameState.controller.levels.length;
        const buttonSpacing = 100;
        const startY = 150;
        for (let i = 0; i < maxLevels; i++) {
            const levelNum = i + 1;
            const button = this.add.rectangle(this.cameras.main.width / 2, startY + i * buttonSpacing, 200, 80, Phaser.Display.Color.HexStringToColor(config.colors.option1).color)
                .setOrigin(0.5)
                .setInteractive();
            const buttonText = this.add.text(this.cameras.main.width / 2, startY + i * buttonSpacing, `লেভেল ${toBangla(levelNum)}`, {
                fontSize: '30px',
                fill: config.colors.text,
                 fontFamily: '"Noto Sans Bengali", sans-serif',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            button.on('pointerdown', () => {
                // gameState.allowedTables=gameState.controller.levels[i];
                this.scene.start('StageScreenScene', { level: levelNum });
            });
            button.on('pointerover', () => button.setFillStyle(Phaser.Display.Color.HexStringToColor(config.colors.option1).darken(20).color));
            button.on('pointerout', () => button.setFillStyle(Phaser.Display.Color.HexStringToColor(config.colors.option1).color));
        }

        // Practice Mode Button
          const practiceButton = this.add.rectangle(this.cameras.main.width / 2, startY + maxLevels * buttonSpacing, 200, 80, Phaser.Display.Color.HexStringToColor(config.colors.option2).color)
            .setOrigin(0.5)
            .setInteractive();
        const practiceText = this.add.text(this.cameras.main.width / 2, startY + maxLevels * buttonSpacing, 'প্র্যাকটিস মোড', {
            fontSize: '20px',
             fontFamily: '"Noto Sans Bengali", sans-serif',
            fill: config.colors.text,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        practiceButton.on('pointerdown', () => {
            // UPDATED LINE: Starts the new practice scene
            this.scene.start('PracticeScene');
        });


        // Back Button
        // const backButton = this.add.rectangle(this.cameras.main.width / 2, startY + (maxLevels + 1) * buttonSpacing, 200, 80, Phaser.Display.Color.HexStringToColor(config.colors.stopButton).color)
        //     .setOrigin(0.5)
        //     .setInteractive();
        // const backText = this.add.text(this.cameras.main.width / 2, startY + (maxLevels + 1) * buttonSpacing, 'পিছনে', {
        //     fontSize: '30px',
        //     fill: config.colors.text,
        //     fontStyle: 'bold'
        // }).setOrigin(0.5);
        // backButton.on('pointerdown', () => {
        //     this.scene.start('StartScreenScene');
        // });
    }
}

export default LevelScreenScene;