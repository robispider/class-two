import { gameState } from '../gameState.js';
import { config } from '../config.js';
import { toBangla } from '../utils.js';
import { PracticeQuestion } from '../questions/PracticeQuestion.js';

class PracticeScene extends Phaser.Scene {
    constructor() {
        super('PracticeScene');
    }

    create() {
        const { width, height } = this.scale;

        // --- Background ---
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(
            Phaser.Display.Color.HexStringToColor(config.colors.bgGradient[0]).color,
            Phaser.Display.Color.HexStringToColor(config.colors.bgGradient[0]).color,
            Phaser.Display.Color.HexStringToColor(config.colors.bgGradient[1]).color,
            Phaser.Display.Color.HexStringToColor(config.colors.bgGradient[1]).color,
            1
        );
        graphics.fillRect(0, 0, width, height);
        
        this.selectionContainer = this.add.container(width / 2, height / 2);
        this.gameContainer = this.add.container(0, 0).setVisible(false);

        this.createSelectionScreen();
    }

    createSelectionScreen() {
        const { width, height } = this.scale;

        const title = this.add.text(0, -height * 0.35, 'অনুশীলনের জন্য একটি নামতা বাছাই করুন', {
            fontSize: '48px',
            fontFamily: '"Noto Sans Bengali", sans-serif',
            fill: config.colors.text,
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: width * 0.8 }
        }).setOrigin(0.5);
        this.selectionContainer.add(title);

        const buttonSize = 70;
        const buttonSpacing = 20;
        const cols = 10;
        const rows = 2;
        const gridWidth = cols * buttonSize + (cols - 1) * buttonSpacing;

        for (let i = 1; i <= 20; i++) {
            const col = (i - 1) % cols;
            const row = Math.floor((i - 1) / cols);

            const x = col * (buttonSize + buttonSpacing) - gridWidth / 2 + buttonSize / 2;
            const y = row * (buttonSize + buttonSpacing) - (buttonSize * 1.5);

            const buttonBg = this.add.rectangle(0, 0, buttonSize, buttonSize, Phaser.Display.Color.HexStringToColor(config.colors.option2).color)
                .setStrokeStyle(4, Phaser.Display.Color.HexStringToColor(config.colors.panelBorder).color).setOrigin(0.5);
            const buttonText = this.add.text(0, 0, toBangla(i), { fontSize: '36px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold' }).setOrigin(0.5);
            
            const button = this.add.container(x, y, [buttonBg, buttonText]).setSize(buttonSize, buttonSize).setInteractive({ useHandCursor: true });
            
            this.selectionContainer.add(button);

            button.on('pointerdown', () => this.startPractice(i));
            button.on('pointerover', () => this.tweens.add({ targets: button, scale: 1.1, duration: 150 }));
            button.on('pointerout', () => this.tweens.add({ targets: button, scale: 1, duration: 150 }));
        }

        // Back Button
        const backButton = this.add.text(0, height * 0.3, 'পেছনে যান', {
            fontSize: '32px',
            fontFamily: '"Noto Sans Bengali", sans-serif',
            fill: '#ffffff',
            backgroundColor: config.colors.stopButton,
            padding: { left: 20, right: 20, top: 10, bottom: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        backButton.on('pointerdown', () => this.scene.start('StartScreenScene'));
        this.selectionContainer.add(backButton);
    }
    
    startPractice(tableNumber) {
        const { width, height } = this.scale;

        // Fade out selection screen and fade in game screen
        this.tweens.add({
            targets: this.selectionContainer,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                this.selectionContainer.setVisible(false);
                this.gameContainer.setVisible(true).setAlpha(0);
                this.tweens.add({ targets: this.gameContainer, alpha: 1, duration: 300 });
            }
        });
        
        gameState.mode = 'practice';

        // --- Header ---
        const headerHeight = height * 0.1;
        const header = this.add.container(0, 0).setSize(width, headerHeight);
        this.gameContainer.add(header);

        const title = this.add.text(width / 2, headerHeight / 2, `${toBangla(tableNumber)} এর নামতা অনুশীলন`, {
            fontSize: '40px',
            fontFamily: '"Noto Sans Bengali", sans-serif',
            fill: config.colors.text,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        header.add(title);
        
        // --- Footer for Back Button ---
        const footerHeight = height * 0.08;
        const footer = this.add.container(0, height - footerHeight).setSize(width, footerHeight);
        this.gameContainer.add(footer);

        const backButton = this.add.text(width - 20, footerHeight / 2, 'প্র্যাকটিস শেষ করুন', {
            fontSize: '24px',
            fontFamily: '"Noto Sans Bengali", sans-serif',
            fill: '#ffffff',
            backgroundColor: config.colors.stopButton,
            padding: { left: 15, right: 15, top: 8, bottom: 8 }
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

        backButton.on('pointerdown', () => this.scene.start('StartScreenScene'));
        footer.add(backButton);

        // This is the main area where the question class will draw its content
        this.qaRegion = this.add.container(0, headerHeight).setSize(width, height - headerHeight - footerHeight);
        this.gameContainer.add(this.qaRegion);

        this.feedbackLabel = this.add.text(20, footerHeight / 2, '', {
            fontSize: '24px',
            fontFamily: '"Noto Sans Bengali", sans-serif',
            fill: config.colors.text,
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        footer.add(this.feedbackLabel);

        // --- Instantiate and start the question manager ---
        this.questionManager = new PracticeQuestion(
            gameState,
            this,
            {
                onCorrect: (pts, msg) => this.showFeedback(msg, config.colors.correct),
                onIncorrect: (pts, msg) => this.showFeedback(msg, config.colors.incorrect),
                // Other callbacks can be added here if needed
            },
            -1, // No time limit
            1000, // A large number of questions for continuous practice
            [tableNumber] // The table to practice
        );

        gameState.currentQuestion = this.questionManager;
        this.questionManager.startQuestionSet();
    }

    showFeedback(message, color) {
        this.feedbackLabel.setText(message).setColor(color);
        this.tweens.killTweensOf(this.feedbackLabel);
        this.feedbackLabel.setAlpha(1);
        this.time.delayedCall(1500, () => {
            this.tweens.add({ targets: this.feedbackLabel, alpha: 0, duration: 500 });
        });
    }

    update(time, delta) {
        if (this.questionManager) {
            this.questionManager.update(time, delta);
        }
    }
}

export default PracticeScene;