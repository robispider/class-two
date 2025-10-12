// js/questions/FactorPairsQuestion.js
import { Question } from './Question.js';
import { config } from '../config.js';
import { gameState } from '../gameState.js';
import { toBangla, shuffle } from '../utils.js';

class FactorPairsQuestion extends Question {
    constructor(...args) {
        super(...args);
        this.optionButtons = [];
        this.optionTexts = [];
        this.questionText = null;
    }

    setup() {
        super.setup();
        const { a, b, target } = this.questionData;
        gameState.currentA = a;
        gameState.currentB = b;
        gameState.currentAnswer = target;

        // Create question text
        this.questionText = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            100,
            `${toBangla(a)} × ${toBangla(b)} = ?`,
            {
                fontSize: '50px',
                fill: config.colors.text,
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // Generate and display answer options (placeholder: similar to StandardQuestion)
        const options = this.generateOptions(target);
        const startY = 200;
        const spacing = 100;
        this.optionButtons = [];
        this.optionTexts = [];
        options.forEach((option, index) => {
            const button = this.scene.add.rectangle(
                this.scene.cameras.main.width / 2,
                startY + index * spacing,
                200,
                80,
                Phaser.Display.Color.HexStringToColor(config.colors[`option${index + 1}`]).color
            ).setOrigin(0.5).setInteractive();
            const text = this.scene.add.text(
                this.scene.cameras.main.width / 2,
                startY + index * spacing,
                toBangla(option),
                {
                    fontSize: '30px',
                    fill: config.colors.text,
                    fontStyle: 'bold'
                }
            ).setOrigin(0.5);
            button.on('pointerdown', () => this.handleAnswer(option));
            button.on('pointerover', () => button.setFillStyle(Phaser.Display.Color.HexStringToColor(config.colors[`option${index + 1}`]).darken(20).color));
            button.on('pointerout', () => button.setFillStyle(Phaser.Display.Color.HexStringToColor(config.colors[`option${index + 1}`]).color));
            this.optionButtons.push(button);
            this.optionTexts.push(text);
        });

        // Set up timer
        this.elapsed = 0;
        this.totalTime = this.timeLimit;
        this.timerText = this.scene.add.text(
            this.scene.cameras.main.width - 100,
            50,
            `সময়: ${toBangla(this.totalTime)}`,
            { fontSize: '30px', fill: config.colors.text }
        );
        this.stopwatch = this.scene.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    updateTimer() {
        this.elapsed++;
        this.timerText.text = `সময়: ${toBangla(this.totalTime - this.elapsed)}`;
        if (this.elapsed >= this.totalTime) {
            this.handleTimeUp();
        }
    }

    handleAnswer(selected) {
        this.stopwatch.remove();
        const correct = selected === this.gameState.currentAnswer;
        const feedbackText = correct ? 'সঠিক!' : 'ভুল!';
        const points = correct ? config.points.correct + this.gameState.streak * config.points.streakBonus : config.points.incorrect;
        const feedback = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2,
            feedbackText,
            {
                fontSize: '60px',
                fill: correct ? 'green' : 'red',
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: { left: 20, right: 20, top: 20, bottom: 20 }
            }
        ).setOrigin(0.5);
        if (correct) {
            this.handleCorrect(points, feedbackText);
        } else {
            this.handleIncorrect(points, feedbackText);
            if (this.gameState.mode === 'practice') {
                this.gameState.performanceTracker.addProblematic(this.gameState.currentA, this.gameState.currentB);
            }
        }
        this.gameState.questionCount++;
        this.transitionToNext(feedback);
    }

    cleanup() {
        if (this.questionText) this.questionText.destroy();
        this.optionButtons.forEach(button => button.destroy());
        this.optionTexts.forEach(text => text.destroy());
        if (this.timerText) this.timerText.destroy();
        if (this.stopwatch) this.stopwatch.remove();
        this.optionButtons = [];
        this.optionTexts = [];
        super.cleanup();
    }
}

export { FactorPairsQuestion };