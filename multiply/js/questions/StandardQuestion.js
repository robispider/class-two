// js/questions/StandardQuestion.js

import { Question } from './Question.js';
import { config } from '../config.js';
import { gameState } from '../gameState.js';
import { toBangla, rand, shuffle } from '../utils.js';
import { ScoreCalculator } from '../ScoreCalculator.js';
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
        // this.createdObjects = [];
             this.persistentObjects = []; // UI that lasts for the whole stage (panels, containers)
        this.transientObjects = [];  // UI for a single question (items, text, buttons)

        this.vizContainer = null;
        this.questionContainer = null;
        this.answerContainer = null;
        this.music = null;
               this.askedQuestions = new Set();
    }
   /**
     * Overrides the parent method. Now sets up the persistent UI once,
     * then displays the first question.
     */
    startQuestionSet() {
        if (!this.music || !this.music.isPlaying) {
            this.music = this.scene.sound.add('practice-music-loop', { loop: true, volume: 0.4 });
            this.music.play();
        }
        this.gameState.questionCount = 0;
        this.gameState.correctCount = 0;
        this.gameState.score = 0;
             this.askedQuestions.clear();

        this.setupPersistentUI();    // Create the panels and containers once.
        this.displayNextQuestion();  // Display the first question.
    }
    /**
     * NEW METHOD: This runs only ONCE per stage to create the static background
     * and layout containers that will be reused for every question.
     */
    setupPersistentUI() {
        const qaRegion = this.scene.qaRegion;

        // 1. Create the main visualization background panel.
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
        this.persistentObjects.push(vizPanel);

        // 2. Create the main layout containers that will hold the content.
        this.vizContainer = this.scene.add.container(0, 0).setSize(qaRegion.width, qaRegion.height * 0.7);
        this.questionContainer = this.scene.add.container(0, this.vizContainer.height).setSize(qaRegion.width, qaRegion.height * 0.1);
        this.answerContainer = this.scene.add.container(0, this.vizContainer.height + this.questionContainer.height).setSize(qaRegion.width, qaRegion.height * 0.2);

        qaRegion.add([this.vizContainer, this.questionContainer, this.answerContainer]);
        this.persistentObjects.push(this.vizContainer, this.questionContainer, this.answerContainer);
    }
    
    /**
     * MODIFIED: This is the new main loop, replacing the old setup().
     * It runs for EVERY question to clear old content and display new content.
     */
    displayNextQuestion() {
        // Clear only the content (transient objects) from the previous question.
        this.transientObjects.forEach(obj => obj.destroy());
        this.transientObjects = [];

        // Generate new question data.
         // ✅ --- MODIFIED: Loop to ensure the generated question is unique ---
        let questionData;
        let questionKey;
        let tries = 0;
        const maxTries = 50; // Failsafe to prevent an infinite loop

        do {
            questionData = this.generateQuestionData();
            // Create a unique, order-independent key (e.g., "3x7" is the same as "7x3")
            const keyParts = [questionData.a, questionData.b].sort((x, y) => x - y);
            questionKey = keyParts.join('x');
            tries++;
        } while (this.askedQuestions.has(questionKey) && tries < maxTries && this.askedQuestions.size < this.numQuestions);

        if (tries >= maxTries) {
            console.warn("Could not generate a unique question after many tries. A repeat is possible.");
        }

        this.askedQuestions.add(questionKey); // Add the new, unique question to the set
        this.questionData = questionData;
        // ✅ --- END OF MODIFICATION ---
        const { a, b } = this.questionData;
        gameState.currentA = a;
        gameState.currentB = b;
        gameState.currentAnswer = a * b;

        gameState.gameActive = true;
        if (gameState.timingModel === 'per-question') {
            this.scene.startQuestionTimer(this.timeLimit);
        }

        const randomItemIndex = rand(0, config.assets.count - 1);
        const currentItemName = config.assets.itemNames[randomItemIndex];

        let type = (gameState.currentStage === 1) ? 'standard' : 'partial';
        // if (type === 'partial' && (a === 1 || b === 1)) {
        //     type = 'standard'; // Override for simple cases
        // }
        gameState.questionType = type;

        const titleText = (type === 'standard')
            ? `কতগুলি ${currentItemName} দেখা যাচ্ছে?`
            : `প্রতিটি বাক্সে ${toBangla(a)}টি ${currentItemName} আছে। মোট কতগুলি ${currentItemName} আছে?`;

        // --- Populate the persistent containers with NEW transient content ---

        const questionTitle = this.scene.add.text(this.questionContainer.width / 2, this.questionContainer.height / 2, titleText, { fontSize: '32px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold', align: 'center', wordWrap: { width: this.questionContainer.width - 40 } }).setOrigin(0.5);
        this.questionContainer.add(questionTitle);
        this.transientObjects.push(questionTitle);

        const equationText = (type === 'partial') ? `${toBangla(a)} × ☐ = ?` : `${toBangla(a)} × ${toBangla(b)} = ?`;
        const explicitTextLabel = this.scene.add.text(this.answerContainer.width * 0.25, this.answerContainer.height / 2, equationText, { fontSize: '60px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold', align: 'center' }).setOrigin(0.5);
        this.answerContainer.add(explicitTextLabel);
        this.transientObjects.push(explicitTextLabel);

        this.createVisualization(this.vizContainer, a, b, type, randomItemIndex);

        const optionsContainer = this.scene.add.container(this.answerContainer.width * 0.65, this.answerContainer.height / 2);
        this.answerContainer.add(optionsContainer);
        this.transientObjects.push(optionsContainer);

        const options = this.generateOptions(gameState.currentAnswer);
        const optionColors = shuffle([config.colors.option1, config.colors.option2, config.colors.option3, config.colors.option4]);
        const buttonWidth = 110, buttonHeight = 60, spacing = 20;
        const totalButtonWidth = (options.length * buttonWidth) + ((options.length - 1) * spacing);

        options.forEach((opt, index) => {
            const x = (index * (buttonWidth + spacing)) - (totalButtonWidth / 2) + buttonWidth / 2;
            const buttonBg = this.scene.add.rectangle(0, 0, buttonWidth, buttonHeight, Phaser.Display.Color.HexStringToColor(optionColors[index]).color).setStrokeStyle(4, Phaser.Display.Color.HexStringToColor(config.colors.panelBorder).color).setOrigin(0.5);
            const buttonText = this.scene.add.text(0, 0, toBangla(opt), { fontSize: '36px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold' }).setOrigin(0.5);
            const button = this.scene.add.container(x, 0, [buttonBg, buttonText]).setSize(buttonWidth, buttonHeight).setInteractive({ useHandCursor: true });
            button.answerValue = opt;
            optionsContainer.add(button);
            button.on('pointerdown', () => { if (gameState.gameActive) { this.scene.sound.play('button-click'); this.checkAnswer(opt, optionsContainer); }});
            button.on('pointerover', () => { this.scene.sound.play('button-hover', { volume: 0.7 }); this.scene.tweens.add({ targets: button, scale: 1.05, duration: 150, ease: 'Sine.easeInOut' }); });
            button.on('pointerout', () => this.scene.tweens.add({ targets: button, scale: 1, duration: 150, ease: 'Sine.easeInOut' }));
        });

        // Animate the entrance of ONLY the new transient elements
        this.transientObjects.forEach((obj, i) => {
            obj.setAlpha(0).setY(obj.y + 10);
            this.scene.tweens.add({ targets: obj, alpha: 1, y: '-=10', duration: 400, ease: 'Power2', delay: i * 50 });
        });
    }

    // Override parent's nextQuestion to call our new display method
    nextQuestion() {
        if (this.currentQuestionIndex >= this.numQuestions) {
            this.completeSet();
            return;
        }
        this.currentQuestionIndex++;
        this.displayNextQuestion();
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

        if (!this.music || !this.music.isPlaying) {
            this.music = this.scene.sound.add('practice-music-loop', { loop: true, volume: 0.4 });
            this.music.play();
        }

        const { a, b } = this.questionData;
        gameState.currentA = a;
        gameState.currentB = b;
        gameState.currentAnswer = a * b;

        const randomItemIndex = rand(0, config.assets.count - 1);
        const currentItemName = config.assets.itemNames[randomItemIndex];

       // --- MODIFICATION START ---
        // Determine question type based on the stage number instead of randomly.
        let type;
        if (gameState.currentStage === 1) {
            type = 'standard'; // Stage 1 is always 'standard'
        } else {
            type = 'partial'; // Stage 2 is always 'partial'
        } 
        // else {
        //     // Fallback for any other case (e.g., if used in practice mode)
        //     const types = ['standard', 'partial'];
        //     type = types[Math.floor(Math.random() * types.length)];
        // }

        // IMPORTANT: Override for simple questions. A "partial" question makes no sense
        // if there's only one group of items (b=1) or one item per group (a=1).
        // if (a === 1 || b === 1) {
        //     type = 'standard';
        // }
        // --- MODIFICATION END ---

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
 // --- MODIFICATION START ---
        // Determine the equation text based on the question type.
        let equationText;
        if (type === 'partial') {
            // For partial, show a box for 'b' to indicate it's the unknown.
            // Using a Unicode box character for a cleaner look.
            equationText = `${toBangla(a)} × ☐ = ?`;
        } else {
            // For standard, show the full equation.
            equationText = `${toBangla(a)} × ${toBangla(b)} = ?`;
        }

        const explicitTextLabel = this.scene.add.text(
            answerContainer.width * 0.25, answerContainer.height / 2, equationText,
            { fontSize: '60px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold', align: 'center' }
        ).setOrigin(0.5);
        answerContainer.add(explicitTextLabel);
        // --- MODIFICATION END ---

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

             button.on('pointerdown', () => {
                if (gameState.gameActive) {
                    this.scene.sound.play('button-click'); // Play click sound
                    this.checkAnswer(opt, optionsContainer);
                }
            });
            button.on('pointerover', () => {
                this.scene.sound.play('button-hover', { volume: 0.7 }); // Play hover sound
                this.scene.tweens.add({ targets: button, scale: 1.05, duration: 150, ease: 'Sine.easeInOut' });
            });
            
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

     // MODIFIED: Visualization groups are now transient objects
    createVisualization(container, a, b, type, itemIndex) {
        const contentW = container.width - 80;
        const contentH = container.height - 80;
        const cols = Math.min(b, 5);
        const rows = Math.ceil(b / cols);
        const spacing = 20;
        const groupSize = Math.min(Math.floor((contentW - (cols - 1) * spacing) / cols), Math.floor((contentH - (rows - 1) * spacing) / rows), 150);
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
            this.transientObjects.push(groupContainer); // Add to transient array

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
          const timeTaken = this.scene.stopQuestionTimer();
         gameState.questionCount++;
        this.scene.updateGameProgress();
        
        if (this.questionTimer) this.questionTimer.remove();

        optionsContainer.getAll().forEach(button => button.disableInteractive());

        const correct = selected === gameState.currentAnswer;
         this.gameState.performanceTracker.logResponse(gameState.currentA, gameState.currentB, timeTaken, correct);
        let feedbackText = correct ? "সঠিক!" : `ভুল! সঠিক উত্তর: ${toBangla(gameState.currentAnswer)}`;
        let points = correct ? config.points.correct + this.gameState.streak * config.points.streakBonus : config.points.incorrect;

           if (correct) {
            // --- NEW: Play correct answer sound ---
            this.scene.sound.play('applause', { volume: 0.6 });
            const points = ScoreCalculator.calculateCorrectScore(
                this.questionData,
                timeTaken,
                this.gameState.performanceTracker
            );
            this.handleCorrect(points, feedbackText);
            this.playFeedbackAnimation(true, selected, optionsContainer);
        } else {
            // --- NEW: Play incorrect answer sound ---
            this.scene.sound.play('button-shake');
            this.handleIncorrect(points, feedbackText);
            this.playFeedbackAnimation(false, selected, optionsContainer);
        }
    }
  handleTimeUp() {
        if (!gameState.gameActive) return;
        // Find the options container from the transient objects
        const answerContainer = this.transientObjects.find(c => c.list && c.list.length > 0 && c.list[0].answerValue !== undefined);
        this.checkAnswer(null, answerContainer);
    }
    /**
     * REWRITTEN: Plays a visual animation on the buttons to give immediate feedback.
     * This version uses a flatter, more reliable sequence of tweens and callbacks.
     */
      playFeedbackAnimation(isCorrect, selectedValue, optionsContainer) {
        const correctButton = optionsContainer.getAll().find(b => b.answerValue === gameState.currentAnswer);
        const selectedButton = optionsContainer.getAll().find(b => b.answerValue === selectedValue);

        const startTransitionOut = () => {
            // --- MODIFIED: Animate only the TRANSIENT objects ---
            this.scene.tweens.add({
                targets: this.transientObjects,
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
                    targets: correctButton, scale: 1.2, yoyo: true, duration: 300, ease: 'Cubic.easeInOut',
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
                    targets: selectedButton, x: '+=10', yoyo: true, duration: 50, repeat: 4, ease: 'Sine.easeInOut',
                    onStart: () => bg.setFillStyle(0xff0000, 1),
                    onComplete: () => {
                        bg.setFillStyle(originalColor, 1);
                        showCorrectThenTransition();
                    }
                });
            } else {
                showCorrectThenTransition();
            }
        }
    }

    /**
     * OVERRIDE: This is the final cleanup when the stage ends.
     * It now destroys both persistent and transient objects.
     */
    cleanup() {
        super.cleanup(); // Stops the question timer from the parent class
        if (this.music && this.music.isPlaying) {
            this.music.stop();
        }
        
        // Destroy all objects created by this question class
        this.transientObjects.forEach(obj => obj.destroy());
        this.persistentObjects.forEach(obj => obj.destroy());
        
        // Clear the arrays for the next stage
        this.transientObjects = [];
        this.persistentObjects = [];
    }
}

export { StandardQuestion };