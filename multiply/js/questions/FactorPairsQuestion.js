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

        this.gridScale = 1;  // Will be set in createGrid
    this.frameNames = [];  // To cache frame names per card index

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

    const puzzleTexture = this.scene.textures.get('puzzle1');
    const extrusion = 1;
    const margin = extrusion;
    const spacing = 2 * extrusion;
    const cols = 10;
    const rows = 6;

    // Reconstruct original tile dimensions from texture
    const tileWidth = (puzzleTexture.getSourceImage().width - 2 * margin - (cols - 1) * spacing) / cols;
    const tileHeight = (puzzleTexture.getSourceImage().height - 2 * margin - (rows - 1) * spacing) / rows;

    // Compute scale based on original full size (preserves aspect)
    const originalFullWidth = tileWidth * cols;
    const scale = (qaRegion.width * 0.6) / originalFullWidth;
    const tileW = tileWidth * scale;
    const tileH = tileHeight * scale;

    // Cache for healing
    this.gridScale = scale;
    this.tileW = tileW;
    this.tileH = tileH;
    this.frameNames = [];  // Reset

    const startX = qaRegion.width / 2 - (tileW * cols) / 2;
    const startY = puzzleCenterY - (tileH * rows) / 2;

    const colorPalette = [
        config.colors.option1, config.colors.option2,
        config.colors.option3, config.colors.option4
    ].map(hex => Phaser.Display.Color.HexStringToColor(hex).color);

    for (let i = 0; i < gridNumbers.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + (col * tileW) + (tileW / 2);
        const y = startY + (row * tileH) + (tileH / 2);

        // Add frame for this tile piece
        const frameX = margin + col * (tileWidth + spacing);
        const frameY = margin + row * (tileHeight + spacing);
        const frameName = `${col}-${row}`;
        puzzleTexture.add(frameName, 0, frameX, frameY, tileWidth, tileHeight);
        
        // Cache frame name per index
        this.frameNames[i] = frameName;

        const cardBack = this.scene.add.image(0, 0, 'puzzle1', frameName);
        cardBack.setOrigin(0.5);
        cardBack.setScale(scale);
        cardBack.preFX.addPixelate(5);

        const colorOverlay = this.scene.add.rectangle(0, 0, tileW, tileH);
        colorOverlay.setFillStyle(Phaser.Math.RND.pick(colorPalette), 0.7);
        colorOverlay.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(config.colors.panelBorder).color);

        const cardText = this.scene.add.text(0, 0, toBangla(gridNumbers[i]), {
            fontSize: `${Math.min(36, tileW * 0.4)}px`, fontFamily: '"Noto Sans Bengali", sans-serif',
            fill: config.colors.text, fontStyle: 'bold', stroke: '#FFFFFF', strokeThickness: 2
        }).setOrigin(0.5);

        const cardFront = this.scene.add.image(0, 0, 'puzzle1', frameName);
        cardFront.setOrigin(0.5);
        cardFront.setScale(scale);
        cardFront.setVisible(false);

        const card = this.scene.add.container(x, y, [cardBack, colorOverlay, cardText, cardFront])
            .setSize(tileW, tileH).setInteractive({ useHandCursor: true });

        card.numberValue = gridNumbers[i];
        card.isActive = true;
        card.index = i;
        card.cardBack = cardBack;
        card.frameName = frameName;  // Extra cache per card

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
        if (this.selectedCard) this.removeSelectionEffect(this.selectedCard);
        
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
        if (this.selectedCard) this.removeSelectionEffect(this.selectedCard);
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
        this.removeSelectionEffect(this.selectedCard);
        
        const product = this.selectedCard.numberValue * card.numberValue;
        if (product === gameState.currentTarget) {
            this.scene.stopQuestionTimer();
            const points = config.points.correct + gameState.streak * config.points.streakBonus;
            this.handleCorrect(points, "সঠিক!");
            this.animateCorrectPair(this.selectedCard, card);
        } else {
            this.handleIncorrect(config.points.incorrect, "ভুল মিল!");
            this.animateIncorrectPair(this.selectedCard, card);
        }
    }

    addSelectionEffect(card) {
        if (card && card.isActive) {
            card.cardBack.postFX.clear(); // Clear any previous effects
            card.cardBack.postFX.addGlow(0x66ff66, 4, 0);
        }
    }

    removeSelectionEffect(card) {
        if (card && card.cardBack && card.cardBack.postFX) {
            card.cardBack.postFX.clear();
        }
    }

    animateCorrectPair(card1, card2) {
        [card1, card2].forEach(card => {
            card.isActive = false;
            card.disableInteractive();
            this.flipCard(card);
        });
        this.scene.time.delayedCall(500, () => {
            this.checkAndHealFutureQuestions();
            this.transitionToNext();
        }, [], this);
    }

flipCard(card) {
    const backItems = [card.getAt(0), card.getAt(1), card.getAt(2)];
    const cardFront = card.getAt(3);
    // FIX: Tween the scale of the card's CONTENTS, not the container itself.
    this.scene.tweens.add({
        targets: backItems,
        scaleX: 0,
        duration: 200,
        ease: 'Sine.In',
        onComplete: () => {
            backItems.forEach(item => item.setVisible(false));
            cardFront.setVisible(true);
            const targetScale = cardFront.scaleY;  // Preserve the original uniform scale
            cardFront.setScale(0, targetScale);    // Start flipped, using preserved scale
            this.scene.tweens.add({ targets: cardFront, scaleX: targetScale, duration: 200, ease: 'Sine.Out' });
        }
    });
}
    
    animateIncorrectPair(card1, card2) {
        this.removeSelectionEffect(card1);
        [card1, card2].forEach(card => {
            const cardBack = card.cardBack;
            cardBack.postFX.clear();
            const errorGlow = cardBack.postFX.addGlow(0xff0000, 6, 0);
            this.scene.time.delayedCall(800, () => cardBack.postFX.clear());
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
            this.callbacks.onCompleteSet("স্টেজ সম্পূর্ণ!", success);
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
                    const frameName = cardToRevive.frameName || this.frameNames[cardToRevive.index];  // Use cached frame

                    cardToRevive.numberValue = factorToAdd;
                    cardToRevive.isActive = true;
                    cardToRevive.getAt(2).setText(toBangla(factorToAdd));  // Text

                    // Restore visuals with correct scale and frame
                    const cardBack = cardToRevive.getAt(0);
                    cardBack.setTexture('puzzle1', frameName);
                    cardBack.setScale(this.gridScale);
                    cardBack.setVisible(true);
                    cardBack.preFX.clear();  // Clear any old effects
                    cardBack.preFX.addPixelate(5);  // Reapply pixelate

                    const colorOverlay = cardToRevive.getAt(1);
                    colorOverlay.setScale(1);  // Overlay doesn't need game scale (it's sized to tileW/H)
                    colorOverlay.setVisible(true);
                    colorOverlay.setSize(this.tileW, this.tileH);  // Ensure size

                    cardToRevive.getAt(2).setScale(1).setVisible(true);  // Text (scale 1 is fine, positioned relatively)
                    
                    const cardFront = cardToRevive.getAt(3);
                    cardFront.setTexture('puzzle1', frameName);
                    cardFront.setScale(this.gridScale);
                    cardFront.setVisible(false);

                    cardToRevive.setAlpha(0);
                    this.scene.tweens.add({
                        targets: cardToRevive,
                        alpha: 1,
                        duration: 500,
                        onComplete: () => cardToRevive.setInteractive({ useHandCursor: true })
                    });
                    return;
                }
            }
        }
    }
}
    // checkAndHealFutureQuestions() {
    //     const remainingQuestions = this.questions.slice(this.currentQuestionIndex);
    //     if (remainingQuestions.length === 0) return;
    //     const activeTiles = this.cards.filter(c => c.isActive).map(c => c.numberValue);
    //     for (const futureQuestion of remainingQuestions) {
    //         if (!this.isQuestionSolvable(futureQuestion, activeTiles)) {
    //             console.warn(`Future question (Target: ${futureQuestion.target}) is unsolvable. Healing board.`);
    //             let factorToAdd = null;
    //             for (const f of futureQuestion.factors) {
    //                 if (this.requiredFactors.includes(f) && !activeTiles.includes(f)) {
    //                     factorToAdd = f;
    //                     if (f !== 1 && f !== futureQuestion.target) break;
    //                 }
    //             }
    //             if (factorToAdd !== null) {
    //                 const inactiveCards = this.cards.filter(c => !c.isActive);
    //                 if (inactiveCards.length > 0) {
    //                     const cardToRevive = shuffle(inactiveCards)[0];
    //                     cardToRevive.numberValue = factorToAdd;
    //                     cardToRevive.isActive = true;
    //                     cardToRevive.getAt(2).setText(toBangla(factorToAdd));
                        
    //                     // Make sure the correct card faces are visible
    //                     cardToRevive.getAt(0).setVisible(true).setScale(1); // cardBack
    //                     cardToRevive.getAt(1).setVisible(true).setScale(1); // colorOverlay
    //                     cardToRevive.getAt(2).setVisible(true).setScale(1); // cardText
    //                     cardToRevive.getAt(3).setVisible(false); // cardFront

    //                     cardToRevive.setAlpha(0);
    //                     this.scene.tweens.add({
    //                         targets: cardToRevive, alpha: 1, duration: 500,
    //                         onComplete: () => cardToRevive.setInteractive({ useHandCursor: true })
    //                     });
    //                     return;
    //                 }
    //             }
    //         }
    //     }
    // }

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