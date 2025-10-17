// js/questions/PuzzleQuestion.js
import { Question } from './Question.js';
import { config } from '../config.js';
import { gameState } from '../gameState.js';
import { toBangla, shuffle } from '../utils.js';

class PuzzleQuestion extends Question {
    constructor(...args) {
        super(...args);
        this.helpText = "বাম পাশের প্রতিটি গুণফল সমাধান করুন। তারপর সঠিক উত্তরের ছবির টুকরাটি ডান পাশের গ্রিডে টেনে এনে বসিয়ে দিন। ছবিটি সম্পূর্ণ করুন!";
        this.puzzleCols = 4;
        this.puzzleRows = 3;
        this.numQuestions = this.puzzleCols * this.puzzleRows;
        this.questions = [];
        this.answerBlockQuestions = [];
        this.draggablePieces = [];
        this.answerBlocks = [];
        this.createdObjects = [];
        this.correctlyPlacedPieces = 0;
        this.isProcessing = false;
    }

    startQuestionSet() {
        this.gameState.questionCount = 0;
        this.gameState.correctCount = 0;
        this.gameState.score = 0;
        this.correctlyPlacedPieces = 0;
        this.generateAllQuestions();
        this.buildScene();
        const totalTime = this.timeLimit * this.numQuestions;
        this.scene.startQuestionTimer(totalTime);
        this.scene.input.enable(true);
    }

    generateAllQuestions() {
        this.questionGenerator.setAllowedTables(this.allowedTables);
        const fixedB = this.gameState.mode === "practice" ? this.allowedTables[0] : null;
        const uniqueQuestions = new Map();
        for (let i = 0; i < 200 && uniqueQuestions.size < this.numQuestions; i++) {
            const q = this.questionGenerator.generateAdaptiveQuestion(fixedB, this.gameState.currentStage);
            if (!uniqueQuestions.has(q.target)) uniqueQuestions.set(q.target, q);
        }
        if (uniqueQuestions.size < this.numQuestions) console.warn(`Could only generate ${uniqueQuestions.size}/${this.numQuestions} unique questions.`);
        const questionsArray = Array.from(uniqueQuestions.values());
        this.questions = shuffle(questionsArray.slice());
        this.answerBlockQuestions = shuffle(questionsArray.slice());
    }

    buildScene() {
        gameState.gameActive = true;
        const qaRegion = this.scene.qaRegion;
        this.vizContainer = this.scene.add.container(0, qaRegion.height * 0.1).setSize(qaRegion.width, qaRegion.height * 0.9).setName('vizContainer');
        const titleContainer = this.scene.add.container(0, 0).setSize(qaRegion.width, qaRegion.height * 0.1);
        qaRegion.add([this.vizContainer, titleContainer]);
        this.createdObjects.push(this.vizContainer, titleContainer);
        const title = this.scene.add.text(qaRegion.width / 2, titleContainer.height / 2, "প্রশ্নের উত্তর মিলিয়ে ছবি সম্পূর্ণ করুন!", { fontSize: '32px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold' }).setOrigin(0.5);
        titleContainer.add(title);
        this.createdObjects.push(title);
        const panelPadding = 10;
        const panelW = this.vizContainer.width - 2 * panelPadding;
        const panelH = this.vizContainer.height - 2 * panelPadding;
        const panel = this.scene.add.graphics({ x: panelPadding, y: panelPadding });
        panel.fillStyle(Phaser.Display.Color.HexStringToColor(config.colors.panel).color, 0.8);
        panel.lineStyle(10, Phaser.Display.Color.HexStringToColor(config.colors.panelBorder).color, 1);
        panel.fillRoundedRect(0, 0, panelW, panelH, 30);
        panel.strokeRoundedRect(0, 0, panelW, panelH, 30);
        this.vizContainer.add(panel);
        this.createdObjects.push(panel);
        const contentW = panelW - 20;
        const contentH = panelH - 20;
        this.leftContainer = this.scene.add.container(panelPadding + 10, panelPadding + 10).setSize(contentW / 2, contentH);
        this.rightContainer = this.scene.add.container(this.leftContainer.x + this.leftContainer.width, panelPadding + 10).setSize(contentW / 2, contentH);
        this.vizContainer.add([this.leftContainer, this.rightContainer]);
        this.createdObjects.push(this.leftContainer, this.rightContainer);
        const puzzleTexture = this.scene.textures.get('puzzle1');
        const img = puzzleTexture.getSourceImage();
        const extrusion = 1, margin = extrusion, spacing = 2 * extrusion;
        const pieceWidthOnSheet = (img.width - 2 * margin - (this.puzzleCols - 1) * spacing) / this.puzzleCols;
        const pieceHeightOnSheet = (img.height - 2 * margin - (this.puzzleRows - 1) * spacing) / this.puzzleRows;
        for (let r = 0; r < this.puzzleRows; r++) {
            for (let c = 0; c < this.puzzleCols; c++) {
                const frameName = `piece_${c}-${r}`;
                if (!puzzleTexture.has(frameName)) {
                    puzzleTexture.add(frameName, 0, margin + c * (pieceWidthOnSheet + spacing), margin + r * (pieceHeightOnSheet + spacing), pieceWidthOnSheet, pieceHeightOnSheet);
                }
            }
        }
        
        // ✅ --- MODIFICATION 2: Create an aspect-ratio-correct grid ---
        const imageAspectRatio = img.width / img.height;
        const containerAspectRatio = this.rightContainer.width / this.rightContainer.height;
        let finalGridW, finalGridH;

        if (imageAspectRatio > containerAspectRatio) {
            // Container is taller/skinnier than the image, so width is the constraint
            finalGridW = this.rightContainer.width * 0.95; // Use 95% to leave some padding
            finalGridH = finalGridW / imageAspectRatio;
        } else {
            // Container is wider than the image, so height is the constraint
            finalGridH = this.rightContainer.height * 0.95;
            finalGridW = finalGridH * imageAspectRatio;
        }

        const gridContainer = this.scene.add.container(
            (this.rightContainer.width - finalGridW) / 2,
            (this.rightContainer.height - finalGridH) / 2
        ).setSize(finalGridW, finalGridH);
        this.rightContainer.add(gridContainer);
        this.createdObjects.push(gridContainer);

        this.createAnswerGrid(gridContainer); // Pass the new correctly-sized container
        this.createQuestionList(this.leftContainer);
        this.setupDragAndDrop();
    }

    createAnswerGrid(container) {
        const blockW = container.width / this.puzzleCols;
        const blockH = container.height / this.puzzleRows;
        const colorPalette = [config.colors.option1, config.colors.option2, config.colors.option3, config.colors.option4].map(hex => Phaser.Display.Color.HexStringToColor(hex).color);
        for (let i = 0; i < this.numQuestions; i++) {
            const col = i % this.puzzleCols;
            const row = Math.floor(i / this.puzzleCols);
            const x = col * blockW;
            const y = row * blockH;
            const answerData = this.answerBlockQuestions[i];
            const visualBlock = this.scene.add.container(x, y).setSize(blockW, blockH);
            const bg = this.scene.add.rectangle(0, 0, blockW, blockH, Phaser.Math.RND.pick(colorPalette)).setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(config.colors.panelBorder).color).setOrigin(0);
            const text = this.scene.add.text(blockW / 2, blockH / 2, toBangla(answerData.target), { fontSize: `${Math.min(40, blockW * 0.4)}px`, fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold' }).setOrigin(0.5);
            visualBlock.add([bg, text]);
            container.add(visualBlock);
            visualBlock.setData({ bg: bg, text: text });
            const dropZone = this.scene.add.zone(x + blockW / 2, y + blockH / 2, blockW, blockH).setRectangleDropZone(blockW, blockH);
            container.add(dropZone);
            dropZone.setData({ answerValue: answerData.target, isFilled: false, visualBlock: visualBlock });
            this.answerBlocks.push(dropZone);
        }
    }

    createQuestionList(container) {
        const rowH = container.height / this.numQuestions;
        for (let i = 0; i < this.numQuestions; i++) {
            const questionData = this.questions[i];
            const y = i * rowH;
            const rowContainer = this.scene.add.container(0, y).setSize(container.width, rowH);
            container.add(rowContainer);
            const text = this.scene.add.text(10, rowH / 2, `${toBangla(questionData.a)} × ${toBangla(questionData.b)} =`, { fontSize: '28px', fontFamily: '"Noto Sans Bengali", sans-serif', fill: config.colors.text, fontStyle: 'bold' }).setOrigin(0, 0.5);
            rowContainer.add(text);
            const answerIndex = this.answerBlockQuestions.findIndex(q => q.target === questionData.target);
            const frameName = `piece_${answerIndex % this.puzzleCols}-${Math.floor(answerIndex / this.puzzleCols)}`;
            const pieceContainer = this.scene.add.container(0, 0);
            const puzzlePiece = this.scene.add.image(0, 0, 'puzzle1', frameName);
            const scale = (rowH * 0.9) / puzzlePiece.height;
            puzzlePiece.setScale(scale);
            pieceContainer.add(puzzlePiece);
            pieceContainer.setSize(puzzlePiece.displayWidth, puzzlePiece.displayHeight);
            this.vizContainer.add(pieceContainer);
            const piecePlaceholderX = container.x + rowContainer.x + (container.width * 0.7);
            const piecePlaceholderY = container.y + rowContainer.y + (rowH / 2);
            pieceContainer.setPosition(piecePlaceholderX, piecePlaceholderY);
            pieceContainer.initposition={x:piecePlaceholderX, y:piecePlaceholderY}
            pieceContainer.setInteractive({ draggable: true, useHandCursor: true });
            pieceContainer.setData({ questionData: questionData, originalX: piecePlaceholderX, originalY: piecePlaceholderY, isPlaced: false, });
            this.draggablePieces.push(pieceContainer);
        }
    }

    setupDragAndDrop() {
        this.scene.input.on('dragstart', (pointer, gameObject) => {
            if (this.isProcessing || gameObject.getData('isPlaced')) return;
            const localPoint = this.vizContainer.getLocalPoint(pointer.x, pointer.y);
            gameObject.setData('offsetX', localPoint.x - gameObject.x);
            gameObject.setData('offsetY', localPoint.y - gameObject.y);
            this.vizContainer.bringToTop(gameObject);
            gameObject.setDepth(100);
            this.scene.tweens.add({ targets: gameObject, scale: 1.1, duration: 120, ease: 'Sine.easeOut' });
        });
        this.scene.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            if (this.isProcessing || gameObject.getData('isPlaced')) return;
            const localPoint = this.vizContainer.getLocalPoint(pointer.x, pointer.y);
            gameObject.setPosition(localPoint.x - gameObject.getData('offsetX'), localPoint.y - gameObject.getData('offsetY'));
        });
        this.scene.input.on('drop', (pointer, gameObject, dropZone) => {
            if (this.isProcessing || gameObject.getData('isPlaced') || !dropZone.getData || dropZone.getData('isFilled')) return;
            const questionData = gameObject.getData('questionData');
            const droppedValue = dropZone.getData('answerValue');
            if (questionData.target === droppedValue) this.handleCorrectDrop(gameObject, dropZone);
            else this.handleIncorrectDrop(gameObject, dropZone);
        });
        this.scene.input.on('dragend', (pointer, gameObject, dropped) => {
            if (!dropped && !gameObject.getData('isPlaced')) this.returnPieceToHome(gameObject);
        });
    }

    handleCorrectDrop(piece, dropZone) {
        this.isProcessing = true;
        piece.setData('isPlaced', true);
        dropZone.setData('isFilled', true);
        piece.disableInteractive();
        gameState.questionCount++;
        const points = config.points.correct + gameState.streak * config.points.streakBonus;
        this.handleCorrect(points, "সঠিক!");
        this.correctlyPlacedPieces++;
        this.scene.updateGameProgress();
        const visualBlock = dropZone.getData('visualBlock');
        const zoneWorldMatrix = visualBlock.getWorldTransformMatrix();
        const targetPos = this.vizContainer.getLocalPoint(zoneWorldMatrix.tx + visualBlock.width / 2, zoneWorldMatrix.ty + visualBlock.height / 2);
        const targetScale = Math.min(visualBlock.width / piece.width, visualBlock.height / piece.height);

        // ✅ --- MODIFICATION 1: Animate the Answer Text ---
        const textToAnimate = visualBlock.getData('text');
        
        // Get text's current world position
        const textWorldPos = textToAnimate.getWorldTransformMatrix();
        // Move it to the top-level container to animate in the global space
        visualBlock.remove(textToAnimate);
        this.vizContainer.add(textToAnimate);
        // Set its position to where it was
        const textStartPos = this.vizContainer.getLocalPoint(textWorldPos.tx, textWorldPos.ty);
        textToAnimate.setPosition(textStartPos.x, textStartPos.y);
    

        // Animate the text towards the piece's final destination
        this.scene.tweens.add({
            targets: textToAnimate,
            x:  piece.initposition.x,
            y:  piece.initposition.y,
            alpha: 1,
            scale: 1,
            duration: 300,
            ease: 'Power2.easeIn',
            onComplete: (console.log('text animation complete',textToAnimate))
        });
        
        // Only fade out the background of the visual block now
        this.scene.tweens.add({ targets: visualBlock.getData('bg'), alpha: 0, duration: 200 });
        
        // Animate the piece over the top of the visual block
        this.scene.tweens.add({
            targets: piece,
            x: targetPos.x,
            y: targetPos.y,
            scale: targetScale,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.isProcessing = false;
                if (this.correctlyPlacedPieces >= this.numQuestions) this.completeSet(true);
            }
        });
    }

    handleIncorrectDrop(piece, dropZone) {
        this.handleIncorrect(config.points.incorrect, "ভুল!");
        const visualBlock = dropZone.getData('visualBlock');
        this.scene.tweens.add({ targets: visualBlock, angle: 5, duration: 60, ease: 'Sine.easeInOut', yoyo: true, repeat: 3 });
        this.returnPieceToHome(piece);
    }

    returnPieceToHome(piece) {
        this.scene.tweens.add({
            targets: piece, x: piece.getData('originalX'), y: piece.getData('originalY'), scale: 1, duration: 400, ease: 'Cubic.easeOut',
            onComplete: () => piece.setDepth(0)
        });
    }

    handleTimeUp() {
        if (!gameState.gameActive) return;
        this.completeSet(false);
    }

    completeSet(success = false) {
        if (!gameState.gameActive && !this.isProcessing) return;
        gameState.gameActive = false;
        this.isProcessing = true;
        this.scene.stopQuestionTimer();
        this.draggablePieces.forEach(p => p.disableInteractive());
        const feedbackText = success ? "স্টেজ সম্পূর্ণ!" : "সময় শেষ! আবার চেষ্টা করুন।";
        this.callbacks.onCompleteSet(feedbackText, success);
    }

    cleanup() {
        super.cleanup();
        this.scene.input.off('dragstart');
        this.scene.input.off('drag');
        this.scene.input.off('drop');
        this.scene.input.off('dragend');
        const puzzleTexture = this.scene.textures.get('puzzle1');
        if (puzzleTexture) {
            for (let r = 0; r < this.puzzleRows; r++) {
                for (let c = 0; c < this.puzzleCols; c++) {
                    puzzleTexture.remove(`piece_${c}-${r}`);
                }
            }
        }
        this.createdObjects.forEach(obj => obj && obj.scene && obj.destroy());
        this.answerBlocks.forEach(block => block && block.scene && block.destroy());
        this.draggablePieces.forEach(piece => piece && piece.scene && piece.destroy());
        this.createdObjects = [];
        this.questions = [];
        this.answerBlockQuestions = [];
        this.draggablePieces = [];
        this.answerBlocks = [];
    }
}

export { PuzzleQuestion };