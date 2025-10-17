// js/questions/FactorPairsQuestion.js
import { Question } from './Question.js';
import { config } from '../config.js';
import { gameState } from '../gameState.js';
import { toBangla, shuffle, rand } from '../utils.js';

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
    }

    startQuestionSet() {
        this.gameState.questionCount = 0;
        this.gameState.correctCount = 0;
        this.gameState.score = 0;

        this.generateAllQuestions();
        this.buildPersistentScene();
        this.displayNextQuestion();
    }

    generateAllQuestions() {
        this.questionGenerator.setAllowedTables(this.allowedTables);
        const batch = [];
        this.allowedTables.forEach(tableNumber => {
            for (let multiplier = 1; multiplier <= 10; multiplier++) {
                const q = this.questionGenerator.generateSpecificQuestion(multiplier, tableNumber);
                if (q.target <= 100 && q.a <= 10 && q.b <= 10) {
                    batch.push(q);
                }
            }
        });
        this.questions = shuffle(batch).slice(0, this.numQuestions);
    }

    buildPersistentScene() {
        gameState.gameActive = true;
        const qaRegion = this.scene.qaRegion;

        const gridTargetSize = 60;
        const maxFactor = Math.max(10, ...this.allowedTables);
        const allRequiredFactors = this.questions.flatMap(q => q.factors.filter(f => f <= maxFactor));
        this.requiredFactors = [...new Set(allRequiredFactors)];
        let gridNumbers = [...this.requiredFactors];
        
        while (gridNumbers.length < 50 && allRequiredFactors.length > 0) {
            gridNumbers.push(allRequiredFactors.pop());
        }
        while (gridNumbers.length < gridTargetSize) {
            gridNumbers.push(rand(1, maxFactor));
        }
        gridNumbers = shuffle(gridNumbers).slice(0, gridTargetSize);

        this.boardContainer = this.scene.add.container(0, 0).setSize(qaRegion.width, qaRegion.height);
        qaRegion.add(this.boardContainer);
        this.createdObjects.push(this.boardContainer);

        this.questionTitle = this.scene.add.text(
            qaRegion.width / 2, 40, '', {
                fontSize: '36px', fontFamily: '"Noto Sans Bengali", sans-serif',
                fill: config.colors.text, fontStyle: 'bold', align: 'center',
                wordWrap: { width: qaRegion.width - 40 }
            }
        ).setOrigin(0.5);
        this.boardContainer.add(this.questionTitle);

        this.createGrid(gridNumbers);
    }

    createGrid(gridNumbers) {
        const qaRegion = this.scene.qaRegion;
        const titleAreaHeight = 80;
        const puzzleAreaHeight = qaRegion.height - titleAreaHeight;
        const puzzleCenterY = titleAreaHeight + (puzzleAreaHeight / 2);

        const puzzlePic = this.scene.add.image(qaRegion.width / 2, puzzleCenterY, 'puzzle1');
        const scale = (qaRegion.width * 0.6) / puzzlePic.width;
        puzzlePic.setScale(scale);
        this.boardContainer.add(puzzlePic);

        const cols = 10;
        const rows = 6;
        const tileW = puzzlePic.displayWidth / cols;
        const tileH = puzzlePic.displayHeight / rows;
        const startX = puzzlePic.x - puzzlePic.displayWidth / 2;
        const startY = puzzlePic.y - puzzlePic.displayHeight / 2;

        const colorPalette = [
            config.colors.option1, config.colors.option2,
            config.colors.option3, config.colors.option4
        ].map(hex => Phaser.Display.Color.HexStringToColor(hex).color);

        for (let i = 0; i < gridNumbers.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + (col * tileW) + (tileW / 2);
            const y = startY + (row * tileH) + (tileH / 2);

            // --- Card Back ---
            const cardBg = this.scene.add.rectangle(0, 0, tileW, tileH)
                .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(config.colors.panelBorder).color);
            cardBg.setFillStyle(Phaser.Math.RND.pick(colorPalette), 0.9);

            const cardText = this.scene.add.text(0, 0, toBangla(gridNumbers[i]), {
                fontSize: `${Math.min(36, tileW * 0.4)}px`, fontFamily: '"Noto Sans Bengali", sans-serif',
                fill: config.colors.text, fontStyle: 'bold'
            }).setOrigin(0.5);

            // --- Card Front (Puzzle Piece) ---
            const cardFront = this.scene.add.image(0, 0, 'puzzle1');
            cardFront.setCrop(
                col * (puzzlePic.width / cols), row * (puzzlePic.height / rows),
                puzzlePic.width / cols, puzzlePic.height / rows
            );
            cardFront.setDisplaySize(tileW, tileH);
            cardFront.setVisible(false);

            const card = this.scene.add.container(x, y, [cardBg, cardText, cardFront])
                .setSize(tileW, tileH).setInteractive({ useHandCursor: true });

            card.numberValue = gridNumbers[i];
            card.isActive = true;
            card.index = i;
            card.fx = {}; // Object to hold references to post-processing effects

            // --- Visual Effect: Idle Shine ---
            card.fx.shine = cardBg.postFX.addGlow(0xffffff, 0, 0, false, 0.1, 12);
            this.scene.tweens.add({
                targets: card.fx.shine,
                outerStrength: 1.5,
                yoyo: true, loop: -1, ease: 'sine.inout',
                duration: 1500 + rand(0, 1000)
            });

            card.on('pointerdown', () => this.handleTileClick(card));
            this.cards.push(card);
            this.boardContainer.add(card);
        }
    }

    displayNextQuestion() {
        if (this.currentQuestionIndex >= this.numQuestions) {
            this.completeSet(true);
            return;
        }

        const questionData = this.questions[this.currentQuestionIndex];
        gameState.currentTarget = questionData.target;
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
        this.handleIncorrect(0, "সময় শেষ!");
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
        
        const product = this.selectedCard.numberValue * card.numberValue;
        if (product === gameState.currentTarget) {
            this.scene.stopQuestionTimer();
            const points = config.points.correct + gameState.streak * config.points.streakBonus;
            this.handleCorrect(points, "সঠিক!");
            this.removeSelectionEffect(this.selectedCard);
            this.animateCorrectPair(this.selectedCard, card);
        } else {
            this.handleIncorrect(config.points.incorrect, "ভুল মিল!");
            this.removeSelectionEffect(this.selectedCard);
            this.animateIncorrectPair(this.selectedCard, card);
        }
    }

    addSelectionEffect(card) {
        if (card && card.isActive && !card.fx.selection) {
            const cardBg = card.getAt(0);
            card.fx.selection = cardBg.postFX.addGlow(0x66ff66, 4, 0);
        }
    }

    removeSelectionEffect(card) {
        if (card && card.fx.selection) {
            card.fx.selection.destroy();
            card.fx.selection = null;
        }
    }

    animateCorrectPair(card1, card2) {
        [card1, card2].forEach(card => {
            card.isActive = false;
            card.disableInteractive();
            if (card.fx.shine) {
                this.scene.tweens.killTweensOf(card.fx.shine);
                card.fx.shine.destroy();
            }
            this.flipCard(card);
        });
        
        this.scene.time.delayedCall(500, () => {
            this.checkAndHealFutureQuestions();
            this.transitionToNext();
        }, [], this);
    }

    flipCard(card) {
        const cardBg = card.getAt(0);
        const cardText = card.getAt(1);
        const cardFront = card.getAt(2);

        this.scene.tweens.add({
            targets: card, scaleX: 0, duration: 200, ease: 'sine.in',
            onComplete: () => {
                cardBg.setVisible(false);
                cardText.setVisible(false);
                cardFront.setVisible(true);
                this.scene.tweens.add({ targets: card, scaleX: 1, duration: 200, ease: 'sine.out' });
            }
        });
    }
    
    animateIncorrectPair(card1, card2) {
        [card1, card2].forEach(card => {
            const cardBg = card.getAt(0);
            const errorGlow = cardBg.postFX.addGlow(0xff0000, 6, 0);
            this.scene.time.delayedCall(400, () => errorGlow.destroy());
        });

        const originalX = card2.x;
        this.scene.tweens.add({
            targets: card2, x: originalX + 10, duration: 50, ease: 'Sine.easeInOut', yoyo: true, repeat: 3,
            onComplete: () => { card2.x = originalX; }
        });
        
        this.scene.time.delayedCall(400, () => {
            this.selectedCard = null;
            this.isProcessing = false;
            gameState.gameActive = true;
        }, [], this);
    }

    transitionToNext() {
        this.scene.time.delayedCall(500, this.displayNextQuestion, [], this);
    }

    completeSet(success = false) {
        if (!gameState.gameActive && !this.isProcessing) return;
        gameState.gameActive = false;
        this.isProcessing = true;
        this.scene.stopQuestionTimer();

        if (success) {
            const remainingCards = this.cards.filter(c => c.isActive);
            this.scene.tweens.add({
                targets: remainingCards, alpha: 0, scale: 0.5, duration: 500,
                delay: this.scene.tweens.stagger(20),
                onComplete: () => this.callbacks.onCompleteSet("স্টেজ সম্পূর্ণ!", success)
            });
        } else {
            this.callbacks.onCompleteSet("আবার চেষ্টা করুন!", success);
        }
    }
    
    isQuestionSolvable(question, availableTiles) {
        const target = question.target;
        const factors = question.factors;
        const tileCounts = availableTiles.reduce((acc, num) => { (acc[num] = (acc[num] || 0) + 1); return acc; }, {});
        for (const factor of factors) {
            if (target % factor === 0) {
                const otherFactor = target / factor;
                if (factor === otherFactor) { if (tileCounts[factor] && tileCounts[factor] >= 2) return true; }
                else { if (tileCounts[factor] && tileCounts[otherFactor]) return true; }
            }
        }
        return false;
    }

    checkAndHealFutureQuestions() {
        const remainingQuestions = this.questions.slice(this.currentQuestionIndex);
        if (remainingQuestions.length === 0) return;
        const activeTiles = this.cards.filter(c => c.isActive).map(c => c.numberValue);
        for (const futureQuestion of remainingQuestions) {
            if (!this.isQuestionSolvable(futureQuestion, activeTiles)) {
                console.warn(`Future question (Target: ${futureQuestion.target}) is unsolvable. Healing board.`);
                let factorToAdd = null;
                for (const f of futureQuestion.factors) {
                    if (this.requiredFactors.includes(f) && !activeTiles.includes(f)) {
                        factorToAdd = f;
                        if (f !== 1 && f !== futureQuestion.target) break;
                    }
                }
                if (factorToAdd !== null) {
                    const inactiveCards = this.cards.filter(c => !c.isActive);
                    if (inactiveCards.length > 0) {
                        const cardToRevive = shuffle(inactiveCards)[0];
                        cardToRevive.numberValue = factorToAdd;
                        cardToRevive.isActive = true;
                        cardToRevive.getAt(1).setText(toBangla(factorToAdd));
                        cardToRevive.getAt(0).setFillStyle(Phaser.Display.Color.HexStringToColor(config.colors.option1).color, 0.8);
                        
                        cardToRevive.setScale(0).setAlpha(0).setAngle(-180);
                        this.scene.tweens.add({
                            targets: cardToRevive, scale: 1, alpha: 1, angle: 0, duration: 500, ease: 'Back.easeOut'
                        });
                        return;
                    }
                }
            }
        }
    }

    cleanup() {
        super.cleanup();
        this.createdObjects.forEach(obj => { if (obj && obj.scene) obj.destroy(); });
        this.cards.forEach(card => { if (card && card.scene) card.destroy(); });
        this.createdObjects = [];
        this.cards = [];
        this.selectedCard = null;
    }
}

export { FactorPairsQuestion };