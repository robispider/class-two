// js/questions/StandardQuestion.js

import { Question } from './Question.js';
import { config } from '../config.js';
import { gameState } from '../gameState.js';
import { toBangla, rand, shuffle } from '../utils.js';

/**
 * A standard multiplication question with visual aids.
 * This class is self-contained and creates its own background panel.
 */
class StandardQuestion extends Question {
    constructor(...args) {
        super(...args);
        this.helpText = "স্ক্রিনে দেখানো বস্তুগুলো গুণ করে সঠিক উত্তরটি বাছাই করুন। কিছু বাক্সে কতগুলো বস্তু আছে তা দেখানো থাকবে, বাকিগুলোতে একই পরিমাণ আছে ধরে মোট সংখ্যা বের করতে হবে।";

        // This array will hold references to all major GameObjects created by this question
        // to ensure they are all properly destroyed during cleanup.
        this.createdObjects = [];
    }

    /**
     * Sets up the entire question scene, including UI, visuals, and interactivity.
     */
    setup() {
        super.setup();

        // FIX: Re-activate the game state for the new question.
        gameState.gameActive = true;
           // Tell the GameScene to start the timer for this question
        if (gameState.timingModel === 'per-question') {
            this.scene.startQuestionTimer(this.timeLimit);
        }



        const { a, b } = this.questionData;
        gameState.currentA = a;
        gameState.currentB = b;
        gameState.currentAnswer = a * b;

        const randomItemIndex = rand(0, config.assets.count - 1);
        const currentItemName = config.assets.itemNames[randomItemIndex];

        const types = ['standard', 'partial'];
        let type = types[Math.floor(Math.random() * types.length)];
        if (a === 1 || b === 1) {
            type = 'standard';
        }
        gameState.questionType = type;

        let titleText = (type === 'standard')
            ? `কতগুলি ${currentItemName} দেখা যাচ্ছে?`
            : `সব বাক্সে একই সংখ্যক ${currentItemName} আছে। মোট কতগুলি ${currentItemName} আছে?`;

        const qaRegion = this.scene.qaRegion;

        // --- 1. Create the visualization background panel for this question instance ---
        const vizPanelHeight = qaRegion.height * 0.7;
        const panelPadding = 20;
        const panelW = qaRegion.width - 2 * panelPadding;
        const panelH = vizPanelHeight - 2 * panelPadding;

        const vizPanel = this.scene.add.graphics();
        vizPanel.fillStyle(Phaser.Display.Color.HexStringToColor(config.colors.panel).color, 0.8);
        vizPanel.lineStyle(10, Phaser.Display.Color.HexStringToColor(config.colors.panelBorder).color, 1);
        vizPanel.fillRoundedRect(panelPadding, panelPadding, panelW, panelH, 30);
        vizPanel.strokeRoundedRect(panelPadding, panelPadding, panelW, panelH, 30);
        qaRegion.add(vizPanel);
        this.createdObjects.push(vizPanel); // Track for cleanup

        // --- 2. Create Layout Containers ---
        const vizContainer = this.scene.add.container(0, 0).setSize(qaRegion.width, qaRegion.height * 0.7);
        const questionContainer = this.scene.add.container(0, vizContainer.height).setSize(qaRegion.width, qaRegion.height * 0.1);
        const answerContainer = this.scene.add.container(0, vizContainer.height + questionContainer.height).setSize(qaRegion.width, qaRegion.height * 0.2);

        qaRegion.add([vizContainer, questionContainer, answerContainer]);
        this.createdObjects.push(vizContainer, questionContainer, answerContainer); // Track for cleanup

        // --- 3. Populate Containers with UI Elements ---
        const questionTitle = this.scene.add.text(
            questionContainer.width / 2, questionContainer.height / 2, titleText,
            { fontSize: '32px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold', align: 'center', wordWrap: { width: questionContainer.width - 40 } }
        ).setOrigin(0.5);
        questionContainer.add(questionTitle);

        const explicitTextLabel = this.scene.add.text(
            answerContainer.width * 0.25, answerContainer.height / 2, `${toBangla(a)} × ${toBangla(b)} = ?`,
            { fontSize: '60px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold', align: 'center' }
        ).setOrigin(0.5);
        answerContainer.add(explicitTextLabel);

        this.createVisualization(vizContainer, a, b, type, randomItemIndex);

        const optionsContainer = this.scene.add.container(answerContainer.width * 0.65, answerContainer.height / 2);
        answerContainer.add(optionsContainer);

        const options = this.generateOptions(gameState.currentAnswer);
        const optionColors = [config.colors.option1, config.colors.option2, config.colors.option3, config.colors.option4];
        shuffle(optionColors);

        const buttonWidth = 120, buttonHeight = 80, spacing = 20;
        const totalButtonWidth = (options.length * buttonWidth) + ((options.length - 1) * spacing);

        options.forEach((opt, index) => {
            const x = (index * (buttonWidth + spacing)) - (totalButtonWidth / 2) + (buttonWidth / 2);
            const buttonBg = this.scene.add.rectangle(0, 0, buttonWidth, buttonHeight, Phaser.Display.Color.HexStringToColor(optionColors[index]).color)
                .setStrokeStyle(4, Phaser.Display.Color.HexStringToColor(config.colors.panelBorder).color).setOrigin(0.5);
            const buttonText = this.scene.add.text(0, 0, toBangla(opt), { fontSize: '40px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold' }).setOrigin(0.5);
            const button = this.scene.add.container(x, 0, [buttonBg, buttonText]).setSize(buttonWidth, buttonHeight).setInteractive({ useHandCursor: true });
            
            button.answerValue = opt;
            optionsContainer.add(button);

            button.on('pointerdown', () => { if (gameState.gameActive) this.checkAnswer(opt, optionsContainer); });
            button.on('pointerover', () => this.scene.tweens.add({ targets: button, scale: 1.05, duration: 150, ease: 'Sine.easeInOut' }));
            button.on('pointerout', () => this.scene.tweens.add({ targets: button, scale: 1, duration: 150, ease: 'Sine.easeInOut' }));
        });

        // --- 4. Animate the entrance of UI elements ---
        [vizContainer, questionContainer, answerContainer].forEach((container, i) => {
            container.setAlpha(0);
            this.scene.tweens.add({ targets: container, alpha: 1, y: '+=20', duration: 500, ease: 'Power2', delay: i * 100 });
        });

        if (gameState.timingModel === 'per-question') {
             this.questionTimer = this.scene.time.delayedCall(this.timeLimit * 1000, this.handleTimeUp, [], this);
        }
    }

    createVisualization(container, a, b, type, itemIndex) {
        const contentW = container.width - 80;
        const contentH = container.height - 80;
        const cols = Math.min(b, 5);
        const rows = Math.ceil(b / cols);
        const spacing = 20;
        const potentialGroupW = Math.floor((contentW - (cols - 1) * spacing) / cols);
        const potentialGroupH = Math.floor((contentH - (rows - 1) * spacing) / rows);
        const groupSize = Math.min(potentialGroupW, potentialGroupH, 150);
        const totalGridW = cols * groupSize + (cols - 1) * spacing;
        const totalGridH = rows * groupSize + (rows - 1) * spacing;
        const startX = (container.width - totalGridW) / 2;
        const startY = (container.height - totalGridH) / 2;
        
        for (let i = 0; i < b; i++) {
            const col = i % cols, row = Math.floor(i / cols);
            const gx = startX + col * (groupSize + spacing);
            const gy = startY + row * (groupSize + spacing);
            const groupContainer = this.scene.add.container(gx, gy);
            container.add(groupContainer);

            if (type === 'partial' && i > 0) {
                groupContainer.add(this.scene.add.image(0, 0, 'box_closed').setOrigin(0,0).setDisplaySize(groupSize, groupSize));
                
            } else {
                groupContainer.add(this.scene.add.image(0, 0, 'box_open').setOrigin(0,0).setDisplaySize(groupSize, groupSize));
                this.addItemsToGroup(groupContainer, a, groupSize, itemIndex);
            }
            groupContainer.setScale(0.5).setAlpha(0);
            this.scene.tweens.add({ targets: groupContainer, scale: 1, alpha: 1, duration: 400, delay: i * 80, ease: 'Back.easeOut' });
        }
    }

    addItemsToGroup(group, numItems, groupSize, itemIndex) {
        const innerPad = groupSize * 0.15, innerW = groupSize - 2 * innerPad, innerH = groupSize - 2 * innerPad;
        const innerCols = Math.ceil(Math.sqrt(numItems)), innerRows = Math.ceil(numItems / innerCols);
        const gap = 5;
        let itemSize = Math.min((innerW - (innerCols - 1) * gap) / innerCols, (innerH - (innerRows - 1) * gap) / innerRows, 64);
        const totalItemsW = innerCols * itemSize + (innerCols - 1) * gap;
        const totalItemsH = innerRows * itemSize + (innerRows - 1) * gap;
        const offsetX = innerPad + (innerW - totalItemsW) / 2, offsetY = innerPad + (innerH - totalItemsH) / 2;

        for (let j = 0; j < numItems; j++) {
            const sc = j % innerCols, sr = Math.floor(j / innerCols);
            const sx = offsetX + sc * (itemSize + gap) + (itemSize / 2);
            const sy = offsetY + sr * (itemSize + gap) + (itemSize / 2);
            group.add(this.scene.add.sprite(sx, sy, 'items_spritesheet', itemIndex).setDisplaySize(itemSize, itemSize).setOrigin(0.5));
        }
    }

    checkAnswer(selected, optionsContainer) {
        if (!gameState.gameActive) return;
        gameState.gameActive = false;
         // Tell the GameScene to stop the timer
        this.scene.stopQuestionTimer();
         gameState.questionCount++;
        this.scene.updateGameProgress();
        
        if (this.questionTimer) this.questionTimer.remove();

        optionsContainer.getAll().forEach(button => button.disableInteractive());

        const correct = selected === gameState.currentAnswer;
        this.gameState.performanceTracker.logResponse(gameState.currentA, gameState.currentB, selected, 0, correct);
        let feedbackText = correct ? "সঠিক!" : `ভুল! সঠিক উত্তর: ${toBangla(gameState.currentAnswer)}`;
        let points = correct ? config.points.correct + this.gameState.streak * config.points.streakBonus : config.points.incorrect;

        if (correct) {
            this.handleCorrect(points, feedbackText);
            this.playFeedbackAnimation(true, selected, optionsContainer);
        } else {
            this.handleIncorrect(points, feedbackText);
            this.playFeedbackAnimation(false, selected, optionsContainer);
        }
    }
  handleTimeUp() {
        if (!gameState.gameActive) return;
        // Find the options container to pass to checkAnswer
        const answerContainer = this.createdObjects.find(c => c.width > 0 && c.height > 0 && c.list.length > 1);
        const optionsContainer = answerContainer ? answerContainer.list.find(c => c instanceof Phaser.GameObjects.Container) : null;
        
        this.checkAnswer(null, optionsContainer); // Pass null for selected answer
    }
    /**
     * REWRITTEN: Plays a visual animation on the buttons to give immediate feedback.
     * This version uses a flatter, more reliable sequence of tweens and callbacks.
     */
    playFeedbackAnimation(isCorrect, selectedValue, optionsContainer) {
        const correctButton = optionsContainer.getAll().find(b => b.answerValue === gameState.currentAnswer);
        const selectedButton = optionsContainer.getAll().find(b => b.answerValue === selectedValue);

        const startTransitionOut = () => {
            const allElements = this.createdObjects.filter(obj => obj && obj.scene);
            this.scene.tweens.add({
                targets: allElements,
                alpha: 0,
                scale: 0.9,
                duration: 400,
                ease: 'Power2',
                onComplete: () => this.transitionToNext()
            });
        };

        const showCorrectThenTransition = () => {
             if (correctButton) {
                const bg = correctButton.first;
                const originalColor = bg.fillColor;
                this.scene.tweens.add({
                    targets: correctButton,
                    scale: 1.2, yoyo: true, duration: 300, ease: 'Cubic.easeInOut',
                    onStart: () => bg.setFillStyle(0x00ff00, 1),
                    onComplete: () => {
                        bg.setFillStyle(originalColor, 1);
                        this.scene.time.delayedCall(400, startTransitionOut);
                    }
                });
            } else {
                this.scene.time.delayedCall(400, startTransitionOut);
            }
        };

        if (isCorrect) {
            showCorrectThenTransition();
        } else {
            if (selectedButton) {
                const bg = selectedButton.first;
                const originalColor = bg.fillColor;
                this.scene.tweens.add({
                    targets: selectedButton,
                    x: '+=10', yoyo: true, duration: 50, repeat: 4, ease: 'Sine.easeInOut',
                    onStart: () => bg.setFillStyle(0xff0000, 1),
                    onComplete: () => {
                        bg.setFillStyle(originalColor, 1);
                        // After shake animation, show the correct answer.
                        showCorrectThenTransition();
                    }
                });
            } else {
                // If no button was selected (e.g. timeout), just show the correct one.
                showCorrectThenTransition();
            }
        }
    }

    /**
     * Cleans up all created GameObjects to prevent memory leaks.
     */
    cleanup() {
        super.cleanup();
                this.scene.stopQuestionTimer(); // Ensure timer is stopped on cleanup
        this.createdObjects.reverse().forEach(obj => {
            if (obj && obj.destroy) {
                obj.destroy();
            }
        });
        this.createdObjects = [];
    }
}

export { StandardQuestion };