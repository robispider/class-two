// js/questions/FactorPairsQuestion.js
import { Question } from './Question.js';
import { config } from '../config.js';
import { gameState } from '../gameState.js';
import { toBangla, shuffle, rand } from '../utils.js';
import { ScoreCalculator } from '../ScoreCalculator.js';

class FactorPairsQuestion extends Question {
    constructor(...args) {
        super(...args);
        this.helpText = "একটি টার্গেট নম্বর দেখানো হবে। গ্রিড থেকে এমন দুটি সংখ্যা বাছাই করুন যাদের গুণফল টার্গেট নম্বরের সমান হয়। সঠিক উত্তর দিলে সংখ্যা দুটি গ্রিড থেকে সরে যাবে।";

        this.questions = [];
        this.selectedCard = null;
        this.boardContainer = null;
        this.cards = [];
        this.isProcessing = false;
        this.createdObjects = [];
        this.questionTitle = null;
        this.requiredFactors = [];

        this.gridScale = 1;
        this.frameNames = [];
        this.currentQuestionIndex = 0;
    }

    /* --------------------------------------------------------------------- */
    /*  START / QUESTION GENERATION                                           */
    /* --------------------------------------------------------------------- */
    startQuestionSet() {
        if (!this.music || !this.music.isPlaying) {
            this.music = this.scene.sound.add('puzzle-suspense', { loop: true, volume: 0.4 });
            this.music.play();
        }
        this.gameState.questionCount = 0;
        this.gameState.correctCount = 0;
        this.gameState.score = 0;

        this.generateAllQuestions();
        this.buildPersistentScene();
        this.displayNextQuestion();
    }

    generateAllQuestions() {
        const unique = new Map();
        const maxAttempts = this.numQuestions * 5;

        for (let i = 0; i < maxAttempts && unique.size < this.numQuestions; i++) {
            const q = this.questionGenerator.generateAdaptiveQuestion(null, this.gameState.currentStage);
            if (q && q.a > 1 && q.b > 1 && q.target <= 100 && !unique.has(q.target)) {
                unique.set(q.target, q);
            }
        }

        if (unique.size < this.numQuestions) {
            console.warn(`Could only generate ${unique.size}/${this.numQuestions} unique questions – falling back to table generator`);
            this.questionGenerator.setAllowedTables(this.allowedTables);
            const batch = [];
            this.allowedTables.forEach(t => {
                for (let m = 1; m <= 10; m++) {
                    const q = this.questionGenerator.generateSpecificQuestion(m, t);
                    if (q.target <= 100 && q.a <= 10 && q.b <= 10 && !unique.has(q.target)) {
                        batch.push(q);
                    }
                }
            });
            shuffle(batch).slice(0, this.numQuestions - unique.size).forEach(q => unique.set(q.target, q));
        }

        this.questions = shuffle(Array.from(unique.values()));
    }

    /* --------------------------------------------------------------------- */
    /*  PERSISTENT BOARD                                                      */
    /* --------------------------------------------------------------------- */
    buildPersistentScene() {
        gameState.gameActive = true;
        const qaRegion = this.scene.qaRegion;

        const gridTargetSize = 60;
        const maxFactor = Math.max(10, ...this.allowedTables);

        const allFactors = this.questions.flatMap(q => q.factors.filter(f => f <= maxFactor));
        this.requiredFactors = [...new Set(allFactors)];

        let gridNumbers = [...this.requiredFactors];
        while (gridNumbers.length < gridTargetSize) {
            gridNumbers.push(rand(2, maxFactor));
        }
        gridNumbers = shuffle(gridNumbers).slice(0, gridTargetSize);

        this.boardContainer = this.scene.add.container(0, 0).setSize(qaRegion.width, qaRegion.height);
        qaRegion.add(this.boardContainer);
        this.createdObjects.push(this.boardContainer);

        this.questionTitle = this.scene.add.text(
            qaRegion.width / 2, 40, '',
            { fontSize: '36px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold', align: 'center', wordWrap: { width: qaRegion.width - 40 } }
        ).setOrigin(0.5);
        this.boardContainer.add(this.questionTitle);

        this.createGrid(gridNumbers);
    }

    createGrid(gridNumbers) {
        const qaRegion = this.scene.qaRegion;
        const titleAreaHeight = 80;
        const puzzleAreaHeight = qaRegion.height - titleAreaHeight;
        const puzzleCenterY = titleAreaHeight + (puzzleAreaHeight / 2);

        const puzzleTexture = this.scene.textures.get('puzzle1');
        const extrusion = 1;
        const margin = extrusion;
        const spacing = 2 * extrusion;
        const cols = 10;
        const rows = 6;

        const tileWSheet = (puzzleTexture.getSourceImage().width - 2 * margin - (cols - 1) * spacing) / cols;
        const tileHSheet = (puzzleTexture.getSourceImage().height - 2 * margin - (rows - 1) * spacing) / rows;
        const originalFullW = tileWSheet * cols;
        const scale = (qaRegion.width * 0.6) / originalFullW;

        this.gridScale = scale;
        this.tileW = tileWSheet * scale;
        this.tileH = tileHSheet * scale;
        this.frameNames = [];

        const startX = qaRegion.width / 2 - (this.tileW * cols) / 2;
        const startY = puzzleCenterY - (this.tileH * rows) / 2;

        const palette = [config.colors.option1, config.colors.option2, config.colors.option3, config.colors.option4]
            .map(hex => Phaser.Display.Color.HexStringToColor(hex).color);

        for (let i = 0; i < gridNumbers.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * this.tileW + this.tileW / 2;
            const y = startY + row * this.tileH + this.tileH / 2;

            const frameName = `${col}-${row}`;
            if (!puzzleTexture.has(frameName)) {
                puzzleTexture.add(
                    frameName, 0,
                    margin + col * (tileWSheet + spacing),
                    margin + row * (tileHSheet + spacing),
                    tileWSheet, tileHSheet
                );
            }
            this.frameNames[i] = frameName;

            const cardBack = this.scene.add.image(0, 0, 'puzzle1', frameName)
                .setOrigin(0.5).setScale(scale);
            cardBack.preFX.addPixelate(5);

            const overlay = this.scene.add.rectangle(0, 0, this.tileW, this.tileH)
                .setFillStyle(Phaser.Math.RND.pick(palette), 0.7)
                .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(config.colors.panelBorder).color);

            const txt = this.scene.add.text(0, 0, toBangla(gridNumbers[i]), {
                fontSize: `${Math.min(36, this.tileW * 0.4)}px`,
                fontFamily: '"Noto Sans Bengali", sans-serif',
                fill: config.colors.text,
                fontStyle: 'bold',
                stroke: '#FFFFFF',
                strokeThickness: 2
            }).setOrigin(0.5);

            const cardFront = this.scene.add.image(0, 0, 'puzzle1', frameName)
                .setOrigin(0.5).setScale(scale).setVisible(false);

            const card = this.scene.add.container(x, y, [cardBack, overlay, txt, cardFront])
                .setSize(this.tileW, this.tileH)
                .setInteractive({ useHandCursor: true });

            card.numberValue = gridNumbers[i];
            card.isActive = true;
            card.index = i;
            card.cardBack = cardBack;
            card.frameName = frameName;

            card.on('pointerdown', () => {
                this.scene.sound.play('button-click');
                this.handleTileClick(card);
            });
            card.on('pointerover', () => {
                card.setBlendMode(Phaser.BlendModes.MULTIPLY);
                this.scene.sound.play('button-hover', { volume: 0.7 });
            });
            card.on('pointerout', () => card.setBlendMode(Phaser.BlendModes.NORMAL));

            this.cards.push(card);
            this.boardContainer.add(card);
        }
    }

    /* --------------------------------------------------------------------- */
    /*  QUESTION FLOW                                                         */
    /* --------------------------------------------------------------------- */
    displayNextQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.completeSet(true);
            return;
        }
        if (this.selectedCard) this.removeSelectionEffect(this.selectedCard);

        const q = this.questions[this.currentQuestionIndex];
        gameState.currentTarget = q.target;
        gameState.questionCount++;
        this.scene.updateGameProgress();

        this.scene.tweens.add({
            targets: this.questionTitle, alpha: 0, y: this.questionTitle.y - 10, duration: 200, ease: 'Power2',
            onComplete: () => {
                this.questionTitle.setText(`দুটি সংখ্যা খুঁজুন যা গুণ করে ${toBangla(gameState.currentTarget)} হয়!`);
                this.questionTitle.y += 20;
                this.scene.tweens.add({ targets: this.questionTitle, alpha: 1, y: this.questionTitle.y - 10, duration: 200, ease: 'Power2' });
            }
        });

        this.currentQuestionIndex++;
        this.isProcessing = false;
        this.selectedCard = null;
        gameState.gameActive = true;
        this.scene.startQuestionTimer(this.timeLimit);
    }

    handleTimeUp() {
        if (!gameState.gameActive) return;
        gameState.gameActive = false;
        this.isProcessing = true;

        gameState.questionCount++;
        this.scene.updateGameProgress();

        if (this.selectedCard) this.removeSelectionEffect(this.selectedCard);
        this.handleIncorrect("সময় শেষ!");
        this.transitionToNext();
    }

    handleTileClick(card) {
        if (this.isProcessing || !card.isActive) return;

        if (this.selectedCard === card) {
            this.removeSelectionEffect(card);
            this.selectedCard = null;
            return;
        }

        if (!this.selectedCard) {
            this.selectedCard = card;
            this.addSelectionEffect(card);
            return;
        }

        this.isProcessing = true;
        gameState.gameActive = false;
        gameState.questionCount++;
        this.scene.updateGameProgress();

        this.removeSelectionEffect(this.selectedCard);

        const product = this.selectedCard.numberValue * card.numberValue;
        const timeTaken = this.scene.getQuestionElapsedTime();

        if (product === gameState.currentTarget) {
            this.scene.stopQuestionTimer();
            this.scene.sound.play('applause', { volume: 0.6 });
            const points = ScoreCalculator.calculateCorrectScore(
                { a: this.selectedCard.numberValue, b: card.numberValue, target: product },
                timeTaken,
                this.gameState.performanceTracker
            );
            this.handleCorrect(points, "সঠিক!");
            this.animateCorrectPair(this.selectedCard, card);
        } else {
            this.handleIncorrect("ভুল মিল!");
            this.animateIncorrectPair(this.selectedCard, card);
        }
    }

    /* --------------------------------------------------------------------- */
    /*  SELECTION / ANIMATIONS                                                */
    /* --------------------------------------------------------------------- */
    addSelectionEffect(card) {
        if (card.cardBack.postFX) {
            card.cardBack.postFX.clear();
            card.cardBack.postFX.addGlow(0x66ff66, 4, 0);
        }
    }
    removeSelectionEffect(card) {
        if (card.cardBack && card.cardBack.postFX) card.cardBack.postFX.clear();
    }

    animateCorrectPair(c1, c2) {
        [c1, c2].forEach(c => {
            c.isActive = false;
            c.disableInteractive();
            this.flipCard(c);
        });

        this.scene.time.delayedCall(1200, () => {
            this.checkAndHealFutureQuestions();
            this.transitionToNext();
        }, [], this);
    }

    flipCard(card) {
        const backItems = [card.getAt(0), card.getAt(1), card.getAt(2)];
        const front = card.getAt(3);
        this.scene.tweens.add({
            targets: backItems, scaleX: 0, duration: 200, ease: 'Sine.In',
            onComplete: () => {
                backItems.forEach(i => i.setVisible(false));
                front.setVisible(true);
                const s = front.scaleY;
                front.setScale(0, s);
                this.scene.tweens.add({ targets: front, scaleX: s, duration: 200, ease: 'Sine.Out' });
            }
        });
    }

    animateIncorrectPair(c1, c2) {
        this.removeSelectionEffect(c1);
        [c1, c2].forEach(c => {
            const b = c.cardBack;
            if (b.postFX) b.postFX.clear();
            if (b.postFX) b.postFX.addGlow(0xff0000, 6, 0);
            this.scene.time.delayedCall(800, () => { if (b.postFX) b.postFX.clear(); });
        });

        const origX = c2.x;
        this.scene.tweens.add({
            targets: c2, x: origX + 10, duration: 50, ease: 'Sine.easeInOut', yoyo: true, repeat: 3,
            onComplete: () => c2.x = origX
        });

        this.scene.time.delayedCall(400, () => {
            this.selectedCard = null;
            this.isProcessing = false;
            gameState.gameActive = true;
        }, [], this);
        this.scene.sound.play('button-shake');
    }

    transitionToNext() {
        this.scene.time.delayedCall(500, this.displayNextQuestion, [], this);
    }

    /* --------------------------------------------------------------------- */
    /*  HEALING LOGIC (exact copy of the original “copy.js” version)          */
    /* --------------------------------------------------------------------- */
    isQuestionSolvable(question, availableTiles) {
        const target = question.target;
        const factors = question.factors;
        const counts = availableTiles.reduce((a, n) => { a[n] = (a[n] || 0) + 1; return a; }, {});

        for (const f of factors) {
            if (target % f !== 0) continue;
            const other = target / f;
            if (f === other) {
                if (counts[f] >= 2) return true;
            } else {
                if (counts[f] && counts[other]) return true;
            }
        }
        return false;
    }

    checkAndHealFutureQuestions() {
        const remaining = this.questions.slice(this.currentQuestionIndex);
        if (!remaining.length) return;

        const activeVals = this.cards.filter(c => c.isActive).map(c => c.numberValue);

        for (const q of remaining) {
            if (this.isQuestionSolvable(q, activeVals)) continue;

            console.warn(`Future question (Target: ${q.target}) is unsolvable. Healing board.`);

            let factorToAdd = null;
            for (const f of q.factors) {
                if (this.requiredFactors.includes(f) && !activeVals.includes(f) && f !== 1 && f !== q.target) {
                    factorToAdd = f;
                    break;
                }
            }

            if (factorToAdd === null) continue;

            const inactive = this.cards.filter(c => !c.isActive);
            if (!inactive.length) continue;

            const revive = shuffle(inactive)[0];
            this.reviveCard(revive, factorToAdd);
            return; // one heal per turn
        }
    }

    /** --------------------------------------------------------------
     *  REVIVE CARD – **NUMBER + OVERLAY FULLY VISIBLE + INTERACTION**
     *  -------------------------------------------------------------- */
    reviveCard(card, number) {
        const frame = card.frameName || this.frameNames[card.index];

        // 1. Update data
        card.numberValue = number;
        card.isActive = true;

        // 2. Get children (guaranteed order: back, overlay, text, front)
        const back = card.getAt(0);
        const overlay = card.getAt(1);
        const text = card.getAt(2);
        const front = card.getAt(3);

        // 3. BACK – texture, scale, pixelate
        back.setTexture('puzzle1', frame)
            .setScale(this.gridScale, this.gridScale)
            .setVisible(true);
        back.preFX.clear();
        back.preFX.addPixelate(5);

        // 4. OVERLAY – exact size, full opacity
        overlay.setScale(1, 1)
               .setSize(this.tileW, this.tileH)
               .setVisible(true);

        // 5. TEXT – new number, full opacity
        text.setScale(1, 1)
            .setText(toBangla(number))
            .setVisible(true);

        // 6. FRONT – hidden until flip
        front.setTexture('puzzle1', frame)
             .setScale(this.gridScale, this.gridScale)
             .setVisible(false);

        // 7. CONTAINER – visible + blend normal + size + hit area
        card.setVisible(true);
        card.setBlendMode(Phaser.BlendModes.NORMAL);
        card.setSize(this.tileW, this.tileH);
        card.setAlpha(0);

        // 8. INTERACTION – explicit hit area + re-add events
        card.removeInteractive(); // Clear old interaction if any

        this.scene.tweens.add({
            targets: card,
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                card.setInteractive({ useHandCursor: true });
                card.on('pointerdown', () => {
                    this.scene.sound.play('button-click');
                    this.handleTileClick(card);
                });
                card.on('pointerover', () => {
                    card.setBlendMode(Phaser.BlendModes.MULTIPLY);
                    this.scene.sound.play('button-hover', { volume: 0.7 });
                });
                card.on('pointerout', () => {
                    card.setBlendMode(Phaser.BlendModes.NORMAL);
                });
            }
        });
    }

    /* --------------------------------------------------------------------- */
    /*  COMPLETION / CLEANUP                                                  */
    /* --------------------------------------------------------------------- */
    completeSet(success = false) {
        if (!gameState.gameActive && !this.isProcessing) return;
        gameState.gameActive = false;
        this.isProcessing = true;
        this.scene.stopQuestionTimer();

        const feedback = success ? "স্টেজ সম্পূর্ণ!" : "আবার চেষ্টা করুন!";

        if (success) {
            const totalTime = this.scene.getQuestionElapsedTime();
            const bonus = ScoreCalculator.calculateSetCompletionBonus(this.timeLimit, this.numQuestions, totalTime);
            if (bonus > 0) {
                this.gameState.score += bonus;
                this.callbacks.onScoreChange(this.gameState.score);
            }
        }

        this.callbacks.onCompleteSet(feedback, success);
    }

    cleanup() {
        super.cleanup();
        this.createdObjects.forEach(o => { if (o && o.scene) o.destroy(); });
        this.cards.forEach(c => { if (c && c.scene) c.destroy(); });
        this.createdObjects = [];
        this.cards = [];
        this.selectedCard = null;
    }
}

export { FactorPairsQuestion };